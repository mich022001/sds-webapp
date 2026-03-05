// web/src/pages/MemberReport.jsx
import { useEffect, useMemo, useState } from "react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export default function MemberReport() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [loadingReport, setLoadingReport] = useState(false);
  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      try {
        setLoadingMembers(true);
        const res = await fetch("/api/members/list");
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setMembers(data);
          if (!selected && data[0]?.name) setSelected(data[0].name);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReport(name) {
    try {
      setErr("");
      setLoadingReport(true);
      setReport(null);

      const res = await fetch(`/api/reports/member?name=${encodeURIComponent(name)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);

      setReport(json);
    } catch (e) {
      setErr(e?.message || "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    if (selected) loadReport(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const genealogyTable = useMemo(() => {
    const g = report?.genealogy || {};
    const levels = Object.keys(g)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    const maxLen = levels.reduce((mx, lvl) => Math.max(mx, (g[lvl] || []).length), 0);

    return { g, levels, maxLen };
  }, [report]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Member</span>
          <select
            className="h-10 w-72 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            value={selected}
            disabled={loadingMembers}
            onChange={(e) => setSelected(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.member_id || m.name} value={m.name}>
                {m.name} {m.member_id ? `(${m.member_id})` : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          className={cls(
            "h-10 rounded-xl px-4 text-sm font-semibold transition",
            "bg-zinc-900 text-white hover:bg-zinc-800"
          )}
          onClick={() => selected && loadReport(selected)}
          disabled={!selected || loadingReport}
        >
          Refresh
        </button>

        {loadingReport && <div className="text-sm text-zinc-500">Loading report...</div>}
        {err && <div className="text-sm text-red-600">Error: {err}</div>}
      </div>

      {report?.member && report?.summary && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Total Cash Issued" value={report.summary.totalCash.toFixed(2)} hint="Includes Outright" />
            <Stat label="Redeemable Cash" value={report.summary.redeemableCash.toFixed(2)} hint="Excludes Outright" />
            <Stat label="Cash Redeemed" value={report.summary.redeemedCash.toFixed(2)} />
            <Stat label="Cash Balance" value={report.summary.balanceCash.toFixed(2)} hint="Redeemable - Redeemed" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Total Product Issued" value={String(report.summary.totalProduct)} />
            <Stat label="Product Redeemed" value={String(report.summary.redeemedProduct)} />
            <Stat label="Product Balance" value={String(report.summary.balanceProduct)} />
            <Stat label="Member Since" value={report.member.created_at ? new Date(report.member.created_at).toLocaleString() : "-"} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Profile">
              <div className="grid gap-2 text-sm text-zinc-700">
                <div><span className="text-zinc-500">Name:</span> {report.member.name}</div>
                <div><span className="text-zinc-500">Member ID:</span> {report.member.member_id || "-"}</div>
                <div><span className="text-zinc-500">Type:</span> {report.member.membership_type || "-"}</div>
                <div><span className="text-zinc-500">Sponsor:</span> {report.member.sponsor_name || "SDS"}</div>
                <div><span className="text-zinc-500">RM:</span> {report.member.regional_manager || "-"}</div>
                <div><span className="text-zinc-500">Area/Region:</span> {report.member.area_region || "-"}</div>
              </div>
            </Card>

            <Card title="Genealogy Summary (Admin view)">
              <div className="text-sm text-zinc-600">
                This is the SDS-wide hierarchy view (Level 0 = SDS, then 1..7).
              </div>
            </Card>
          </div>

          <Card title="Genealogy by Level (0–7)">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    {genealogyTable.levels.map((lvl) => (
                      <th key={lvl} className="px-3 py-2 font-semibold">
                        {lvl === 0 ? "SDS" : `${lvl} ${lvl === 1 ? "ST" : lvl === 2 ? "ND" : lvl === 3 ? "RD" : "TH"} LEVEL`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: genealogyTable.maxLen || 1 }).map((_, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-zinc-100">
                      {genealogyTable.levels.map((lvl) => {
                        const v = (genealogyTable.g[lvl] || [])[rowIdx] || "";
                        return <td key={lvl} className="px-3 py-2">{v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
