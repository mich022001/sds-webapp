import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [members, setMembers] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    membershipType: "Member",
    address: "",
    sponsor: "",
    areaRegion: ""
  });
  const [msg, setMsg] = useState("");

  async function load() {
    const m = await fetch(`${API}/api/members`).then(r => r.json());
    const l = await fetch(`${API}/api/bonus-ledger`).then(r => r.json());
    setMembers(m);
    setLedger(l);
  }

  useEffect(() => { load(); }, []);

  async function register(e) {
    e.preventDefault();
    setMsg("");
    const res = await fetch(`${API}/api/registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(`ERROR: ${data.error}`);
      return;
    }
    setMsg(`Saved! Member ID: ${data.memberId}`);
    setForm({ ...form, name: "", contact: "", email: "", address: "", sponsor: "", areaRegion: "" });
    await load();
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>SDS Direct Sales Web</h2>
      <p style={{ color: "#555" }}>Registration + Members + Bonus Ledger (web version)</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>Registration</h3>
          <form onSubmit={register} style={{ display: "grid", gap: 10 }}>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select value={form.membershipType} onChange={e => setForm({ ...form, membershipType: e.target.value })}>
              <option>Member</option>
              <option>Distributor</option>
              <option>Stockiest</option>
              <option>Area Manager</option>
              <option>Regional Manager</option>
            </select>
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            <input placeholder="Sponsor name (or SDS)" value={form.sponsor} onChange={e => setForm({ ...form, sponsor: e.target.value })} />
            <input placeholder="Area/Region" value={form.areaRegion} onChange={e => setForm({ ...form, areaRegion: e.target.value })} />
            <button type="submit">Save Member</button>
          </form>
          {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>All Members</h3>
          <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #eee", borderRadius: 10 }}>
            <table width="100%" cellPadding="8">
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th align="left">Name</th>
                  <th align="left">ID</th>
                  <th align="left">Type</th>
                  <th align="left">Sponsor</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.member_id}</td>
                    <td>{m.membership_type}</td>
                    <td>{m.sponsor_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 16 }}>Bonus Ledger</h3>
          <div style={{ maxHeight: 240, overflow: "auto", border: "1px solid #eee", borderRadius: 10 }}>
            <table width="100%" cellPadding="8">
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th align="left">Date</th>
                  <th align="left">Earner</th>
                  <th align="left">From</th>
                  <th align="left">Lvl</th>
                  <th align="left">Type</th>
                  <th align="left">Amt</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map(l => (
                  <tr key={l.id}>
                    <td>{l.created_at}</td>
                    <td>{l.earner_name}</td>
                    <td>{l.source_member_name}</td>
                    <td>{l.relative_level}</td>
                    <td>{l.bonus_type}</td>
                    <td>{l.amount_text || l.amount_num || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
