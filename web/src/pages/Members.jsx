import { useEffect, useState } from "react";

export default function Members() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const thStyle = {
    textAlign: "left",
    padding: "12px",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "2px solid #ddd",
  };

  const tdStyle = {
    textAlign: "left",
    padding: "12px",
    fontSize: "14px",
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Members</h2>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}

      {!loading && !err && (
        <>
          <p>Total: {rows.length}</p>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9" }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Membership Type</th>
                  <th style={thStyle}>Sponsor</th>
                  <th style={thStyle}>Member Since</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={tdStyle}>
                      No members yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((m) => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={tdStyle}>{m.id}</td>
                      <td style={tdStyle}>{m.name}</td>
                      <td style={tdStyle}>{m.membership_type}</td>
                      <td style={tdStyle}>
                        {m.sponsor_name ?? "-"}
                      </td>
                      <td style={tdStyle}>
                        {m.created_at
                          ? new Date(m.created_at).toLocaleString()
                          : "-"}
                      </td>
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
