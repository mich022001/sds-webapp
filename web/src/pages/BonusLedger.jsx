import { useEffect, useMemo, useState } from "react";

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function fmtAmount(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v ?? "");
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BonusLedger() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // simple client-side filters (like your sheet filter)
  const [qEarner, setQEarner] = useState("");
  const [qReason, setQReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/bonus-ledger/list?limit=200");
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load bonus ledger");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const a = qEarner.trim().toLowerCase();
    const r = qReason.trim().toLowerCase();

    return rows.filter((x) => {
      const earner = `${x.earner_name ?? ""} ${x.earner_member_id ?? ""}`.toLowerCase();
      const reason = `${x.reason ?? ""}`.toLowerCase();
      return (!a || earner.includes(a)) && (!r || reason.includes(r));
    });
  }, [rows, qEarner, qReason]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Bonus Ledger</h2>

      <div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Filter by earner</span>
          <input
            value={qEarner}
            onChange={(e) => setQEarner(e.target.value)}
            placeholder="name or member id"
            style={{ height: 36, padding: "0 10px", border: "1px solid #ddd", borderRadius: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#666" }}>Filter by reason</span>
          <input
            value={qReason}
            onChange={(e) => setQReason(e.target.value)}
            placeholder="reason"
            style={{ height: 36, padding: "0 10px", border: "1px solid #ddd", borderRadius: 10 }}
          />
        </label>
      </div>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}

      {!loading && !err && (
        <>
          <p>Total: {filtered.length}</p>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Earner</th>
                  <th>Earner Member ID</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Source</th>
                  <th>Level</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">No ledger entries yet.</td>
                  </tr>
                ) : (
                  filtered.map((x) => (
                    <tr key={x.id}>
                      <td>{fmtDate(x.created_at)}</td>
                      <td>{x.earner_name ?? ""}</td>
                      <td>{x.earner_member_id ?? ""}</td>
                      <td style={{ textAlign: "right" }}>{fmtAmount(x.amount)}</td>
                      <td>{x.reason ?? ""}</td>
                      <td>{x.source_name ?? x.source_member_id ?? ""}</td>
                      <td>{x.level ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
