import { useEffect, useMemo, useState } from "react";

function levelLabel(lvl) {
  if (lvl === 0) return "SDS";
  if (lvl === 1) return "1ST LEVEL";
  if (lvl === 2) return "2ND LEVEL";
  if (lvl === 3) return "3RD LEVEL";
  return `${lvl}TH LEVEL`;
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/members/list", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const norm = (s) => String(s ?? "").trim().toLowerCase();

    // normalizedName -> original display name
    const displayNameByNorm = new Map();

    // normalizedName -> normalizedSponsor
    const sponsorByNormName = new Map();

    for (const m of rows) {
      const n = norm(m.name);
      const s = norm(m.sponsor_name);
      if (!n) continue;

      displayNameByNorm.set(n, m.name);
      sponsorByNormName.set(n, s);
    }

    const memo = new Map();

    function computeLevel(normName, seen = new Set()) {
      if (memo.has(normName)) return memo.get(normName);
      if (seen.has(normName)) return 1; // cycle safety -> treat as directly under SDS

      seen.add(normName);

      const sponsorNorm = sponsorByNormName.get(normName);

      // If sponsored by SDS or no sponsor → Level 1
      if (!sponsorNorm || sponsorNorm === "sds") {
        memo.set(normName, 1);
        return 1;
      }

      // If sponsor not found → treat as Level 1 under SDS
      if (!displayNameByNorm.has(sponsorNorm)) {
        memo.set(normName, 1);
        return 1;
      }

      const lvl = computeLevel(sponsorNorm, seen) + 1;
      memo.set(normName, lvl);
      return lvl;
    }

    const map = new Map();

    // Add SDS as Level 0 manually
    map.set(0, ["SDS"]);

    for (const normName of displayNameByNorm.keys()) {
      const lvl = computeLevel(normName);
      if (!map.has(lvl)) map.set(lvl, []);
      map.get(lvl).push(displayNameByNorm.get(normName));
    }

    const levels = Array.from(map.keys()).sort((a, b) => a - b);

    for (const lvl of levels) {
      map.get(lvl).sort((a, b) => String(a).localeCompare(String(b)));
    }

    const maxLen = levels.reduce((mx, lvl) => Math.max(mx, map.get(lvl).length), 0);

    return { map, levels, maxLen };
  }, [rows]);

  const totalMembers = rows.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-extrabold text-zinc-900">SUREFIT DIRECT SALES</div>
        <div className="text-sm text-zinc-500">Admin Dashboard</div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Total Members</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
            {totalMembers}
          </div>
        </div>

        {grouped.levels
          .filter((lvl) => lvl !== 0)
          .slice(0, 3)
          .map((lvl) => (
            <div key={lvl} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-medium text-zinc-500">Total {levelLabel(lvl)}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
                {grouped.map.get(lvl)?.length ?? 0}
              </div>
            </div>
          ))}
      </div>

      {/* Hierarchy Table */}
      {loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm text-sm text-zinc-500">
          Loading...
        </div>
      )}

      {err && (
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm text-sm text-red-600">
          Error: {err}
        </div>
      )}

      {!loading && !err && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm overflow-x-auto">
          {grouped.levels.length === 0 ? (
            <div className="text-sm text-zinc-500">No hierarchy data yet.</div>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  {grouped.levels.map((lvl) => (
                    <th
                      key={lvl}
                      className="whitespace-nowrap border-b-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm font-bold text-zinc-900"
                    >
                      {levelLabel(lvl)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: grouped.maxLen }).map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    {grouped.levels.map((lvl) => (
                      <td
                        key={`${lvl}-${rowIdx}`}
                        className="border-b border-zinc-100 px-3 py-2 align-top text-sm text-zinc-800"
                      >
                        {grouped.map.get(lvl)?.[rowIdx] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
