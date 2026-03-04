import { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/members/list");
        const json = await res.json();
        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch {
        setRows([]);
      }
    };
    load();
  }, []);

  /* =========================
     BUILD HIERARCHY FROM SPONSOR CHAIN
     ========================= */
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
      if (seen.has(normName)) return 0; // cycle safety

      seen.add(normName);

      const sponsorNorm = sponsorByNormName.get(normName);

      // root: no sponsor OR sponsor is SDS OR sponsor not found
      if (
        !sponsorNorm ||
        sponsorNorm === "sds" ||
        !displayNameByNorm.has(sponsorNorm)
      ) {
        memo.set(normName, 0);
        return 0;
      }

      const lvl = computeLevel(sponsorNorm, seen) + 1;
      memo.set(normName, lvl);
      return lvl;
    }

    const map = new Map(); // level -> display names[]

    for (const normName of displayNameByNorm.keys()) {
      const lvl = computeLevel(normName);
      if (lvl <= 0) continue; // skip root
      if (!map.has(lvl)) map.set(lvl, []);
      map.get(lvl).push(displayNameByNorm.get(normName));
    }

    const levels = Array.from(map.keys()).sort((a, b) => a - b);

    for (const lvl of levels) {
      map.get(lvl).sort((a, b) =>
        String(a).localeCompare(String(b))
      );
    }

    const maxLen = levels.reduce(
      (mx, lvl) => Math.max(mx, map.get(lvl).length),
      0
    );

    return { map, levels, maxLen };
  }, [rows]);

  const totalMembers = rows.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-extrabold text-zinc-900">
          SUREFIT DIRECT SALES
        </div>
        <div className="text-sm text-zinc-500">Summary</div>
      </div>

      {/* TOTAL MEMBERS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm w-60">
        <div className="text-xs font-medium text-zinc-500">
          Total Members
        </div>
        <div className="mt-2 text-2xl font-extrabold text-zinc-900">
          {totalMembers}
        </div>
      </div>

      {/* HIERARCHY */}
      {grouped.levels.length === 0 ? (
        <div className="text-sm text-zinc-500">
          No hierarchy data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                {grouped.levels.map((lvl) => (
                  <th
                    key={lvl}
                    className="border-b border-zinc-200 px-4 py-2 text-left font-semibold text-zinc-700"
                  >
                    {lvl}{" "}
                    {lvl === 1
                      ? "ST"
                      : lvl === 2
                      ? "ND"
                      : lvl === 3
                      ? "RD"
                      : "TH"}{" "}
                    Level
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: grouped.maxLen }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {grouped.levels.map((lvl) => (
                    <td
                      key={lvl}
                      className="px-4 py-1 align-top text-zinc-800"
                    >
                      {grouped.map.get(lvl)?.[rowIdx] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
