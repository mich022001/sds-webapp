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
          headers: { "Accept": "application/json" },
        });

        // If API returns non-200, show useful message
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();

        // Your API currently returns: { data: [...] }
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Members</h2>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}

      {!loading && !err && (
        <>
          <p>Total: {rows.length}</p>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Membership Type</th>
                  <th>Sponsor</th>
		  <th>Member Since</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No members yet.</td>
                  </tr>
                ) : (
                  rows.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.name}</td>
                      <td>{m.membership_type}</td>
                      <td>{m.sponsor_name ?? ""}</td>
                      <td>{m.created_at ? new Date(m.created_at).toLocaleString() : "-"}</td>
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
