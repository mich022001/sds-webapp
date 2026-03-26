// web/src/pages/RegionalReport.jsx
import { useEffect, useMemo, useState } from "react";

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
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function fmtNumber(value) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
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
        setErr("");
        const res = await fetch("/api/members/list");
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data : [];

        const rms = rows
          .filter((m) => m.membership_type === "Regional Manager")
          .map((m) => m.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setRmList(rms);
          if (!rm && rms[0]) setRm(rms[0]);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load RMs");
      }
    }

    loadRMs();

    return () => {
      cancelled = true;
    };
  }, [rm]);

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
  }, [rm]);

  const levels = useMemo(() => {
    return Array.isArray(data?.levels) ? data.levels : [];
  }, [data]);

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
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        {loading && <div className="text-sm text-zinc-500">Loading...</div>}
        {err && <div className="text-sm text-red-600">Error: {err}</div>}
      </div>

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Regional Manager Profile">
              <div className="grid gap-2 text-sm text-zinc-700">
                <div>
                  <span className="font-medium text-zinc-500">Name:</span> {data.profile?.name || "-"}
                </div>
                <div>
                  <span className="font-medium text-zinc-500">ID Number:</span> {data.profile?.member_id || "-"}
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Address:</span> {data.profile?.address || "-"}
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Contact Number:</span> {data.profile?.contact || "-"}
                </div>
                <div>
                  <span className="font-medium text-zinc-500">Email Address:</span> {data.profile?.email || "-"}
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:col-span-2 md:grid-cols-2 xl:grid-cols-4">
              <Stat label="Total Members" value={fmtNumber(data.totals?.totalMembers)} />
              <Stat label="Total Rebates" value={fmtNumber(data.totals?.totalRebates)} />
              <Stat label="Total Cash Bonus" value={fmtNumber(data.totals?.totalCashBonus)} />
              <Stat label="Total Cash Earned" value={fmtNumber(data.totals?.totalCashEarned)} />
              <Stat label="Redeemed Cash" value={fmtNumber(data.totals?.redeemedCash)} />
              <Stat label="Running Cash Balance" value={fmtNumber(data.totals?.runningBalanceCash)} />
              <Stat label="Total Product Bonus" value={fmtNumber(data.totals?.totalProductBonus)} />
              <Stat label="Remaining Product Balance" value={fmtNumber(data.totals?.remainingProductBalance)} />
            </div>
          </div>

          <Card title="Counts by Membership Type">
            <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(data.byType || {}).map(([k, v]) => (
                <div key={k}>
                  <span className="text-zinc-500">{k}:</span> {v}
                </div>
              ))}
              {Object.keys(data.byType || {}).length === 0 && (
                <div className="text-zinc-500">No data.</div>
              )}
            </div>
          </Card>

          <Card title="Members under this RM by Level">
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
                {levels.map((level) => (
                  <div
                    key={level.level}
                    className="w-72 shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50"
                  >
                    <div className="border-b border-zinc-200 bg-white px-4 py-3">
                      <div className="text-sm font-bold text-zinc-900">
                        {level.level_title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {level.label || "No bonus"}{" "}
                        {level.level <= 7 ? `• Total: ${fmtNumber(level.bonus_total)}` : ""}
                      </div>
                    </div>

                    <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Names ({level.member_count})
                    </div>

                    <div className="max-h-[820px] overflow-y-auto">
                      {(level.members || []).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-zinc-400">No members</div>
                      ) : (
                        <table className="w-full border-collapse text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-zinc-200">
                              <th className="px-4 py-2 text-left font-semibold text-zinc-700">
                                Name
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {level.members.map((member, idx) => (
                              <tr
                                key={`${level.level}-${member.name}-${idx}`}
                                className="border-b border-zinc-100"
                              >
                                <td className="px-4 py-2 text-zinc-800">
                                  {member.name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
