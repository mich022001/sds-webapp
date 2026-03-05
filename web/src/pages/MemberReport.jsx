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

function Button({ children, variant = "primary", ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "h-10 rounded-xl px-4 text-sm font-semibold transition",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "ghost" && "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
      )}
    >
      {children}
    </button>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        {...props}
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 truncate"
      >
        {children}
      </select>
    </label>
  );
}

export default function MemberReport() {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMembers(true);
        setErr("");

        // Your existing members API used by Members page (adjust if yours differs)
        const r = await fetch("/api/members/list");
        const j = await r.json();

        if (!r.ok) throw new Error(j?.error || "Failed to load members.");

        const rows = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        if (!mounted) return;

        setMembers(rows);
        // default pick first member if available
        if (rows.length && !selectedName) setSelectedName(rows[0].name || "");
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load members.");
      } finally {
        if (!mounted) return;
        setLoadingMembers(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMember = useMemo(() => {
    const n = String(selectedName || "").trim().toLowerCase();
    return members.find((m) => String(m.name || "").trim().toLowerCase() === n) || null;
  }, [members, selectedName]);

  async function loadReport() {
    if (!selectedName) return;
    setLoading(true);
    setErr("");
    setReport(null);
    try {
      const r = await fetch(`/api/reports/member?name=${encodeURIComponent(selectedName)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Failed to load report.");
      setReport(j);
    } catch (e) {
      setErr(e.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card
        title="Member Report"
        right={
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            API: /api/reports/member
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Select
            label="Select Member"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            disabled={loadingMembers}
          >
            {members.map((m) => (
              <option key={m.member_id || m.id || m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button onClick={loadReport} disabled={loading || !selectedName}>
              {loading ? "Loading..." : "Generate"}
            </Button>
            <Button variant="ghost" onClick={() => { setReport(null); setErr(""); }}>
              Clear
            </Button>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Member Profile">
          {!selectedMember ? (
            <div className="text-sm text-zinc-500">No member selected.</div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div><span className="font-semibold">Name:</span> {selectedMember.name}</div>
              <div><span className="font-semibold">Member ID:</span> {selectedMember.member_id || "—"}</div>
              <div><span className="font-semibold">Membership:</span> {selectedMember.membership_type || "—"}</div>
              <div><span className="font-semibold">Sponsor:</span> {selectedMember.sponsor_name || "—"}</div>
              <div><span className="font-semibold">Member Since:</span> {selectedMember.created_at || "—"}</div>
            </div>
          )}
        </Card>

        <Card title="Bonus Summary">
          {!report ? (
            <div className="text-sm text-zinc-500">Generate a report to view totals.</div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div><span className="font-semibold">Total Cash Issued:</span> {report.total_cash ?? "—"}</div>
              <div><span className="font-semibold">Redeemed Cash:</span> {report.redeemed_cash ?? "—"}</div>
              <div><span className="font-semibold">Cash Balance:</span> {report.balance_cash ?? "—"}</div>
              <div><span className="font-semibold">Total Product:</span> {report.total_product ?? "—"}</div>
              <div><span className="font-semibold">Redeemed Product:</span> {report.redeemed_product ?? "—"}</div>
              <div><span className="font-semibold">Product Balance:</span> {report.balance_product ?? "—"}</div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Report Output (raw)">
        <pre className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          {JSON.stringify(report, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
