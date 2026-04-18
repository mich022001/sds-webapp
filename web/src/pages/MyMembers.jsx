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
  const [levelFilter, setLevelFilter] = useState("all");
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
  const byType = report?.byType || {};

  const availableLevels = useMemo(() => {
    const levels = [...new Set(members.map((m) => Number(m.relative_level || 0)).filter((v) => v > 0))];
    return levels.sort((a, b) => a - b);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = norm(search);

    return members.filter((row) => {
      const matchesSearch =
        !q ||
        norm(row.name).includes(q) ||
        norm(row.member_id).includes(q) ||
        norm(row.membership_type).includes(q) ||
        norm(row.sponsor_name).includes(q);

      const matchesLevel =
        levelFilter === "all" || Number(row.relative_level || 0) === Number(levelFilter);

      return matchesSearch && matchesLevel;
    });
  }, [members, search, levelFilter]);

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
            <Stat label="Total Members" value={report?.totals?.totalMembers ?? 0} />
            <Stat label="Distributors" value={byType["Distributor"] || 0} />
            <Stat label="Area Managers" value={byType["Area Manager"] || 0} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Members" value={byType["Member"] || 0} />
            <Stat label="Stockiests" value={byType["Stockiest"] || 0} />
            <Stat label="Regional Managers" value={byType["Regional Manager"] || 0} />
          </div>

          <Card title="My Members">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Search
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, member ID, type, sponsor"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Relative Level
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="all">All Levels</option>
                  {availableLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2 font-semibold text-zinc-700">Name</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Member ID</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Relative Level</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Sponsor</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Area / Region</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500" colSpan={7}>
                        No RM-scoped members found.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((row, idx) => (
                      <tr
                        key={`${row.member_id || row.name || "row"}-${idx}`}
                        className="border-b border-zinc-100"
                      >
                        <td className="px-4 py-3 text-zinc-700">{row.name || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{row.member_id || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{row.membership_type || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.relative_level ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{row.sponsor_name || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{row.area_region || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{row.created_at || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Members by Level">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(Array.isArray(report?.levels) ? report.levels : []).map((lvl) => (
                <div
                  key={lvl.level}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="text-sm font-semibold text-zinc-900">
                    {lvl.level_title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Count: {lvl.member_count || 0}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(lvl.members || []).length === 0 ? (
                      <div className="text-sm text-zinc-500">No members.</div>
                    ) : (
                      lvl.members.map((m, i) => (
                        <div
                          key={`${lvl.level}-${m.name || "member"}-${i}`}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                        >
                          {m.name || "-"}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
