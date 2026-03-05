// web/src/pages/RegionalReport.jsx
import { useEffect, useState } from "react";

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

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}

export default function RegionalReport() {
  const [rmList, setRmList] = useState([]);
  const [rm, setRm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRMs() {
      try {
        const res = await fetch("/api/members/list");
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const rms = rows
          .filter((m) => m.membership_type === "Regional Manager")
          .map((m) => m.name);

        if (!cancelled) {
          setRmList(rms);
          if (!rm && rms[0]) setRm(rms[0]);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load RMs");
      }
    }
    loadRMs();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReport(rmName) {
    try {
      setErr("");
      setLoading(true);
      setData(null);

      const res = await fetch(`/api/reports/regional?rm=${encodeURIComponent(rmName)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);

      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (rm) loadReport(rm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rm]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-zinc-600">Regional Manager</span>
          <select
            className="h-10 w-72 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            value={rm}
            onChange={(e) => setRm(e.target.value)}
          >
            {rmList.length === 0 && <option value="">No RMs yet</option>}
            {rmList.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </label>

        {loading && <div className="text-sm text-zinc-500">Loading...</div>}
        {err && <div className="text-sm text-red-600">Error: {err}</div>}
      </div>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="RM" value={data.rm} />
            <Stat label="Total Members" value={data.totalMembers} />
            <Stat label="Types Count" value={Object.keys(data.byType || {}).length} />
          </div>

          <Card title="Counts by Membership Type">
            <div className="grid gap-2 text-sm text-zinc-700">
              {Object.entries(data.byType || {}).map(([k, v]) => (
                <div key={k}><span className="text-zinc-500">{k}:</span> {v}</div>
              ))}
              {Object.keys(data.byType || {}).length === 0 && <div className="text-zinc-500">No data.</div>}
            </div>
          </Card>

          <Card title="Members under this RM">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Sponsor</th>
                    <th className="px-3 py-2 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.members || []).map((m) => (
                    <tr key={m.name} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{m.name}</td>
                      <td className="px-3 py-2">{m.membership_type}</td>
                      <td className="px-3 py-2">{m.sponsor_name || "SDS"}</td>
                      <td className="px-3 py-2">{m.created_at ? new Date(m.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {(data.members || []).length === 0 && (
                    <tr><td className="px-3 py-3 text-zinc-500" colSpan={4}>No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
