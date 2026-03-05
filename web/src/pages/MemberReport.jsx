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
        setErr("");

        const res = await fetch("/api/members/list");
        const json = await res.json().catch(() => ({}));
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
    return () => {
      cancelled = true;
    };
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
      setErr(e?.message || "Failed to load report.");
    } finally {
      setLoadingReport(false);
    }
  }

  const totals = report?.totals || null;
  const member = report?.member || null;

  const prettyMoney = (n) => {
    const x = Number(n ?? 0);
    if (!Number.isFinite(x)) return "0.00";
    return x.toFixed(2);
  };

  const raw = useMemo(() => {
    try {
      return JSON.stringify(report ?? null, null, 2);
    } catch {
      return String(report);
    }
  }, [report]);

  return (
    <div className="grid gap-4">
      <Card
        title="Member Report"
        right={<span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">API: /api/reports/member</span>}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Select Member</span>
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
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
            Generate
          </button>

          <button
            className={cls(
              "h-10 rounded-xl px-4 text-sm font-semibold transition",
              "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
            onClick={() => {
              setErr("");
              setReport(null);
            }}
            disabled={loadingReport}
          >
            Clear
          </button>
        </div>

        {loadingReport && <div className="mt-3 text-sm text-zinc-500">Loading report…</div>}
        {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Member Profile">
          {member ? (
            <div className="grid gap-2 text-sm text-zinc-700">
              <div><span className="text-zinc-500">Name:</span> {member.name}</div>
              <div><span className="text-zinc-500">Member ID:</span> {member.member_id || "-"}</div>
              <div><span className="text-zinc-500">Membership:</span> {member.membership_type || "-"}</div>
              <div><span className="text-zinc-500">Sponsor:</span> {member.sponsor_name || "SDS"}</div>
              <div><span className="text-zinc-500">Member Since:</span> {member.created_at || "-"}</div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Generate a report to view member profile.</div>
          )}
        </Card>

        <Card title="Bonus Summary">
          {totals ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total Cash Issued" value={prettyMoney(totals.total_cash)} hint="Includes Outright 600" />
                <Stat label="Redeemable Cash" value={prettyMoney(totals.redeemable_cash)} hint="Excludes Outright" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Cash Redeemed" value={prettyMoney(totals.redeemed_cash)} />
                <Stat label="Cash Balance" value={prettyMoney(totals.balance_cash)} hint="Redeemable - Redeemed" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total Product" value={String(totals.total_product ?? 0)} />
                <Stat label="Product Redeemed" value={String(totals.redeemed_product ?? 0)} />
                <Stat label="Product Balance" value={String(totals.balance_product ?? 0)} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Generate a report to view totals.</div>
          )}
        </Card>
      </div>

      <Card title="Report Output (raw)">
        <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          {raw}
        </pre>
      </Card>
    </div>
  );
}
