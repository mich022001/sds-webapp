import { useEffect, useMemo, useState } from "react";

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 text-sm font-semibold text-zinc-900">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
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

  const members = Array.isArray(report?.members) ? report.members : [];
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
                norm(m.membership_type).includes(q) ||
                norm(m.sponsor_name).includes(q)
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

  return (
    <div className="grid gap-4">
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
            <Stat label="Total Members" value={totals.totalMembers ?? members.length ?? 0} />
            <Stat label="Members" value={byType["Member"] || 0} />
            <Stat label="Distributors" value={byType["Distributor"] || 0} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Area Managers" value={byType["Area Manager"] || 0} />
            <Stat label="Stockiests" value={byType["Stockiest"] || 0} />
            <Stat label="Levels Present" value={levels.length || 0} />
          </div>

          <Card title="My Members Genealogy">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm text-zinc-600">
                  Genealogy view of members under{" "}
                  <span className="font-semibold text-zinc-900">
                    {rmMember?.name || "RM"}
                  </span>
                  .
                </div>
              </div>

              <div className="w-full md:w-[320px]">
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Search genealogy
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member, type, sponsor"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-5 pb-2">
                {filteredLevels.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                    No genealogy members found.
                  </div>
                ) : (
                  filteredLevels.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="w-[340px] shrink-0 rounded-2xl border border-zinc-200 bg-white"
                    >
                      <div className="border-b border-zinc-200 px-5 py-4">
                        <div className="text-xl font-bold text-zinc-900">
                          {String(lvl.level_title || `Level ${lvl.level}`).toUpperCase()}
                        </div>
                        <div className="mt-2 text-sm text-zinc-500">
                          Count: {lvl.member_count || 0}
                        </div>
                      </div>

                      <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                        Names
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {!lvl.members || lvl.members.length === 0 ? (
                          <div className="px-5 py-4 text-sm text-zinc-500">
                            No members.
                          </div>
                        ) : (
                          lvl.members.map((m, idx) => (
                            <div
                              key={`${lvl.level}-${m.name || "member"}-${idx}`}
                              className="border-b border-zinc-100 px-5 py-4"
                            >
                              <div className="font-medium text-zinc-900">
                                {m.name || "-"}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {m.membership_type || "-"}
                                {m.sponsor_name ? ` • Sponsor: ${m.sponsor_name}` : ""}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
