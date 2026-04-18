import { useEffect, useMemo, useRef, useState } from "react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

export default function MyMembers({ user }) {
  const [rmMember, setRmMember] = useState(null);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState("");
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

        if (!user?.member_id) {
          throw new Error("Your account is not linked to a member.");
        }

        const memberRes = await fetch(
          `/api/members?member_id=${encodeURIComponent(user.member_id)}`
        );
        const memberJson = await memberRes.json().catch(() => ({}));

        if (!memberRes.ok) {
          throw new Error(memberJson.error || "Failed to load RM member profile.");
        }

        const memberRow = Array.isArray(memberJson?.data)
          ? memberJson.data[0]
          : null;

        if (!memberRow?.name) {
          throw new Error("Linked RM member record not found.");
        }

        const reportRes = await fetch(
          `/api/reports?type=regional&rm=${encodeURIComponent(memberRow.name)}`
        );
        const reportJson = await reportRes.json().catch(() => ({}));

        if (!reportRes.ok) {
          throw new Error(reportJson.error || "Failed to load RM member report.");
        }

        if (!cancelled) {
          setRmMember(memberRow);
          setReport(reportJson);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  const levels = Array.isArray(report?.levels) ? report.levels : [];
  const byType = report?.byType || {};
  const totals = report?.totals || {};

  const filteredLevels = useMemo(() => {
    const q = norm(search);
    if (!q) return levels;

    return levels
      .map((lvl) => {
        const filteredMembers = Array.isArray(lvl.members)
          ? lvl.members.filter((m) => {
              return (
                norm(m.name).includes(q) ||
                norm(m.membership_type).includes(q)
              );
            })
          : [];

        return {
          ...lvl,
          members: filteredMembers,
          member_count: filteredMembers.length,
        };
      })
      .filter((lvl) => lvl.member_count > 0);
  }, [levels, search]);

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
  }, [filteredLevels]);

  function scrollLevels(direction) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      {loading ? (
        <Card title="My Members">
          <div className="text-sm text-zinc-500">Loading...</div>
        </Card>
      ) : err ? (
        <Card title="My Members">
          <div className="text-sm text-red-600">{err}</div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Regional Manager" value={rmMember?.name || "-"} />
            <Stat label="Total Members" value={totals.totalMembers ?? 0} />
            <Stat label="Members" value={byType["Member"] || 0} />
            <Stat label="Distributors" value={byType["Distributor"] || 0} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Area Managers" value={byType["Area Manager"] || 0} />
            <Stat label="Stockiests" value={byType["Stockiest"] || 0} />
            <Stat label="Levels Present" value={levels.length || 0} />
          </div>

          <Card
            title="My Members Genealogy"
            className="min-w-0"
            right={
              <div className="flex items-end gap-3">
                <div className="hidden text-xs text-zinc-500 md:block">
                  Swipe or use arrows to view more levels
                </div>
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
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="text-sm text-zinc-600">
                Genealogy view of members under{" "}
                <span className="font-semibold text-zinc-900">
                  {rmMember?.name || "RM"}
                </span>
                .
              </div>

              <div className="w-full md:w-[320px]">
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Search genealogy
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member or type"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
                />
              </div>
            </div>

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
                  {filteredLevels.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500">
                      No genealogy members found.
                    </div>
                  ) : (
                    filteredLevels.map((level) => (
                      <div
                        key={level.level}
                        className="w-[280px] shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50"
                      >
                        <div className="border-b border-zinc-200 bg-white px-4 py-3">
                          <div className="text-sm font-bold text-zinc-900">
                            {String(
                              level.level_title || `Level ${level.level}`
                            ).toUpperCase()}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            Count: {level.member_count || 0}
                          </div>
                        </div>

                        <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Names ({level.member_count || 0})
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {!level.members || level.members.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-zinc-400">
                              No members
                            </div>
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
                                {level.members.map((m, idx) => (
                                  <tr
                                    key={`${level.level}-${m.name || "member"}-${idx}`}
                                    className="border-b border-zinc-100"
                                  >
                                    <td className="px-4 py-2 text-zinc-800">
                                      {m.name || "-"}
                                      {m.membership_type
                                        ? ` (${m.membership_type})`
                                        : ""}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2 h-2 rounded-full bg-zinc-200">
                <div
                  className={cls(
                    "h-2 rounded-full bg-zinc-500 transition-all",
                    canScrollLeft || canScrollRight ? "opacity-100" : "opacity-0"
                  )}
                  style={{ width: "28%" }}
                />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
