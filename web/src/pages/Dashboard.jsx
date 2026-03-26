import { useEffect, useMemo, useRef, useState } from "react";

function levelLabel(lvl) {
  if (lvl === 0) return "SDS";
  if (lvl === 1) return "1ST LEVEL";
  if (lvl === 2) return "2ND LEVEL";
  if (lvl === 3) return "3RD LEVEL";
  return `${lvl}TH LEVEL`;
}

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

    const displayNameByNorm = new Map();
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
      if (seen.has(normName)) return 1;

      seen.add(normName);

      const sponsorNorm = sponsorByNormName.get(normName);

      if (!sponsorNorm || sponsorNorm === "sds") {
        memo.set(normName, 1);
        return 1;
      }

      if (!displayNameByNorm.has(sponsorNorm)) {
        memo.set(normName, 1);
        return 1;
      }

      const lvl = computeLevel(sponsorNorm, seen) + 1;
      memo.set(normName, lvl);
      return lvl;
    }

    const map = new Map();
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

    const levelItems = levels
      .filter((lvl) => lvl !== 0)
      .map((lvl) => ({
        level: lvl,
        title: levelLabel(lvl),
        names: map.get(lvl) || [],
        count: map.get(lvl)?.length || 0,
    }));

    return { map, levels, maxLen, levelItems };
  }, [rows]);

  useEffect(() => {
    function updateScrollState() {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [grouped]);

  function scrollLevels(direction) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  const totalMembers = rows.length;
  const totalLevel1 = grouped.map.get(1)?.length ?? 0;
  const totalLevel2 = grouped.map.get(2)?.length ?? 0;
  const totalLevel3 = grouped.map.get(3)?.length ?? 0;
  const totalLevelsShown = grouped.levels.filter((lvl) => lvl !== 0).length;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <div className="text-xl font-extrabold text-zinc-900">SUREFIT DIRECT SALES</div>
        <div className="text-sm text-zinc-500">Admin Dashboard</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CompactMetric label="Total Members" value={totalMembers} />
        <CompactMetric label="Total 1st Level" value={totalLevel1} />
        <CompactMetric label="Total 2nd Level" value={totalLevel2} />
        <CompactMetric label="Total 3rd Level" value={totalLevel3} />
        <CompactMetric label="Levels Present" value={totalLevelsShown} />
      </div>

      {loading && (
        <Card title="Hierarchy Overview">
          <div className="text-sm text-zinc-500">Loading...</div>
        </Card>
      )}

      {err && (
        <Card title="Hierarchy Overview">
          <div className="text-sm text-red-600">Error: {err}</div>
        </Card>
      )}

      {!loading && !err && (
        <Card
          title="Genealogy by Level"
          right={
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-zinc-500 md:inline">
                Swipe or use arrows to view more levels
              </span>
              <button
                type="button"
                onClick={() => scrollLevels(-1)}
                disabled={!canScrollLeft}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-40"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollLevels(1)}
                disabled={!canScrollRight}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-40"
              >
                →
              </button>
            </div>
          }
        >
          {grouped.levelItems.length === 0 ? (
            <div className="text-sm text-zinc-500">No hierarchy data yet.</div>
          ) : (
            <div className="relative max-w-full overflow-hidden">
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
              )}
              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />
              )}

              <div
                ref={scrollRef}
                className="w-full overflow-x-auto overflow-y-hidden pb-3"
              >
                <div className="flex w-max gap-4 pr-2">
                  {grouped.levelItems.map((item) => (
                    <div
                      key={item.level}
                      className="w-[280px] shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50"
                    >
                      <div className="border-b border-zinc-200 bg-white px-4 py-3">
                        <div className="text-sm font-bold text-zinc-900">{item.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Count: {item.count}
                        </div>
                      </div>

                      <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Names
                      </div>

                      <div className="max-h-[520px] overflow-y-auto">
                        {item.names.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-zinc-400">No members</div>
                        ) : (
                          <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-white">
                              <tr className="border-b border-zinc-200">
                                <th className="px-4 py-2 text-left font-semibold text-zinc-700">
                                  Name
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.names.map((name, idx) => (
                                <tr
                                  key={`${item.level}-${name}-${idx}`}
                                  className="border-b border-zinc-100"
                                >
                                  <td className="px-4 py-2 text-zinc-800">{name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 h-2 rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full bg-zinc-300 transition-opacity ${
                    canScrollLeft || canScrollRight ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ width: "28%" }}
                />
              </div>

              <div className="mt-2 text-center text-xs text-zinc-500 md:hidden">
                Swipe horizontally to view more levels
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
