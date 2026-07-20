import { useEffect, useMemo, useRef, useState } from "react";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getMembershipTypeCount(byType, typeNames) {
  return typeNames.reduce((total, typeName) => {
    return total + (Number(byType?.[typeName]) || 0);
  }, 0);
}

export default function MyMembers({ user }) {
  const [rootMember, setRootMember] = useState(null);
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

        const memberId = String(user?.member_id || "").trim();

        if (!memberId) {
          throw new Error("Your account is not linked to a member.");
        }

        const memberRes = await fetch(
          `/api/members?member_id=${encodeURIComponent(memberId)}`
        );

        const memberJson = await memberRes.json().catch(() => ({}));

        if (!memberRes.ok) {
          throw new Error(
            memberJson.error || "Failed to load member profile."
          );
        }

        const memberRow = Array.isArray(memberJson?.data)
          ? memberJson.data[0]
          : null;

        if (!memberRow) {
          throw new Error("Linked member record not found.");
        }

        const reportRes = await fetch(
          `/api/reports?type=member&name=${encodeURIComponent(
            memberRow.name
          )}`
        );

        const reportJson = await reportRes.json().catch(() => ({}));

        if (!reportRes.ok) {
          throw new Error(
            reportJson.error || "Failed to load member genealogy."
          );
        }

        if (!cancelled) {
          setRootMember(memberRow);
          setReport(reportJson);
        }
      } catch (error) {
        if (!cancelled) {
          setErr(error?.message || "Failed to load members.");
          setRootMember(null);
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  const levels = useMemo(() => {
    return Array.isArray(report?.levels) ? report.levels : [];
  }, [report?.levels]);

  const byType = report?.byType || {};
  const totals = report?.totals || {};

  const memberCount = getMembershipTypeCount(byType, ["Member"]);

  const distributorCount = getMembershipTypeCount(byType, ["Distributor"]);

  const areaManagerCount = getMembershipTypeCount(byType, [
    "Area Manager",
    "AreaManager",
  ]);

  const stockistCount = getMembershipTypeCount(byType, [
    "Stockist",
    "Stockiest",
  ]);

  const regionalManagerCount = getMembershipTypeCount(byType, [
    "Regional Manager",
    "RegionalManager",
  ]);

  const deepestLevel = useMemo(() => {
    return levels.reduce((deepest, level) => {
      const currentLevel = Number(level?.level) || 0;
      return Math.max(deepest, currentLevel);
    }, 0);
  }, [levels]);

  const filteredLevels = useMemo(() => {
    const query = normalize(search);

    if (!query) {
      return levels;
    }

    return levels
      .map((level) => {
        const members = Array.isArray(level?.members)
          ? level.members.filter((member) => {
              return (
                normalize(member?.name).includes(query) ||
                normalize(member?.membership_type).includes(query) ||
                normalize(member?.member_id).includes(query)
              );
            })
          : [];

        return {
          ...level,
          members,
          member_count: members.length,
        };
      })
      .filter((level) => level.member_count > 0);
  }, [levels, search]);

  useEffect(() => {
    function updateScrollState() {
      const element = scrollRef.current;

      if (!element) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      setCanScrollLeft(element.scrollLeft > 4);

      setCanScrollRight(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 4
      );
    }

    updateScrollState();

    const element = scrollRef.current;

    if (!element) {
      return undefined;
    }

    element.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [filteredLevels]);

  function scrollLevels(direction) {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <div className="grid max-w-full gap-4 overflow-x-hidden">
        <Card title="My Members">
          <div className="text-sm text-zinc-500">
            Loading your member network...
          </div>
        </Card>
      </div>
    );
  }

  if (err) {
    return (
      <div className="grid max-w-full gap-4 overflow-x-hidden">
        <Card title="My Members">
          <div className="text-sm font-medium text-red-600">{err}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={rootMember?.membership_type || "Network Owner"}
          value={rootMember?.name || "-"}
        />

        <Stat
          label="Total Downlines"
          value={Number(totals.totalMembers) || 0}
        />

        <Stat label="Members" value={memberCount} />

        <Stat label="Distributors" value={distributorCount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Area Managers" value={areaManagerCount} />

        <Stat label="Regional Managers" value={regionalManagerCount} />

        <Stat label="Stockists" value={stockistCount} />

        <Stat label="Deepest Level" value={deepestLevel} />
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
              aria-label="View previous genealogy levels"
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollLevels(1)}
              disabled={!canScrollRight}
              aria-label="View next genealogy levels"
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              {rootMember?.name || "your account"}
            </span>
            .
          </div>

          <div className="w-full md:w-[320px]">
            <label
              htmlFor="genealogy-search"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Search genealogy
            </label>

            <input
              id="genealogy-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, member ID, or type"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-900"
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
                <div className="min-w-[280px] rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
                  <div className="text-sm font-semibold text-zinc-800">
                    {search
                      ? "No matching members found"
                      : "No members in your network yet"}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {search
                      ? "Try searching using another name, member ID, or membership type."
                      : "Members registered under your account will appear here."}
                  </div>
                </div>
              ) : (
                filteredLevels.map((level) => {
                  const levelMembers = Array.isArray(level?.members)
                    ? level.members
                    : [];

                  const memberCountForLevel =
                    Number(level?.member_count) || levelMembers.length;

                  return (
                    <div
                      key={level.level}
                      className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50"
                    >
                      <div className="border-b border-zinc-200 bg-white px-4 py-3">
                        <div className="text-sm font-bold text-zinc-900">
                          {String(
                            level.level_title || `Level ${level.level}`
                          ).toUpperCase()}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          Count: {memberCountForLevel}
                        </div>
                      </div>

                      <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Members ({memberCountForLevel})
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {levelMembers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-zinc-400">
                            No members
                          </div>
                        ) : (
                          <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-[1] bg-white">
                              <tr className="border-b border-zinc-200">
                                <th className="px-4 py-2 text-left font-semibold text-zinc-700">
                                  Member
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {levelMembers.map((member, index) => {
                                const rowKey =
                                  member?.member_id ||
                                  `${level.level}-${member?.name || "member"}-${index}`;

                                return (
                                  <tr
                                    key={rowKey}
                                    className="border-b border-zinc-100 last:border-b-0"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-zinc-800">
                                        {member?.name || "-"}
                                      </div>

                                      {member?.membership_type && (
                                        <div className="mt-0.5 text-xs text-zinc-500">
                                          {member.membership_type}
                                        </div>
                                      )}

                                      {member?.member_id && (
                                        <div className="mt-0.5 text-[11px] text-zinc-400">
                                          {member.member_id}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-2 h-2 rounded-full bg-zinc-200">
            <div
              className={cls(
                "h-2 rounded-full bg-zinc-500 transition-all",
                canScrollLeft || canScrollRight
                  ? "opacity-100"
                  : "opacity-0"
              )}
              style={{ width: "28%" }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
