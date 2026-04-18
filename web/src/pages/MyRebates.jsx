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

function fmtAmount(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

export default function MyRebates({ user }) {
  const [rmMember, setRmMember] = useState(null);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState("");
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
          throw new Error(reportJson.error || "Failed to load RM rebates.");
        }

        if (!cancelled) {
          setRmMember(memberRow);
          setReport(reportJson);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load rebates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  const rebateRows = Array.isArray(report?.rm_rebates) ? report.rm_rebates : [];
  const totals = report?.totals || {};

  const filteredRows = useMemo(() => {
    const q = norm(search);

    return rebateRows.filter((row) => {
      if (!q) return true;

      return (
        norm(row.buyer_name).includes(q) ||
        norm(row.product).includes(q) ||
        norm(row.unit_type).includes(q)
      );
    });
  }, [rebateRows, search]);

  return (
    <div className="grid gap-4">
      {loading ? (
        <Card title="My Rebates">
          <div className="text-sm text-zinc-500">Loading...</div>
        </Card>
      ) : err ? (
        <Card title="My Rebates">
          <div className="text-sm text-red-600">{err}</div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Regional Manager" value={rmMember?.name || "-"} />
            <Stat label="Total Rebates" value={fmtAmount(totals.totalRebates)} />
            <Stat
              label="Redeemed Cash"
              value={fmtAmount(totals.redeemedCash)}
            />
            <Stat
              label="Cash Balance"
              value={fmtAmount(totals.runningBalanceCash)}
            />
          </div>

          <Card title="My Rebates">
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by buyer, product, unit type"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Buyer</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Product</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Qty</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Unit Type</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Rebate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500" colSpan={6}>
                        No rebate entries yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={`${row.created_at || "row"}-${idx}`}
                        className="border-b border-zinc-100"
                      >
                        <td className="px-4 py-3 text-zinc-700">
                          {row.created_at || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.buyer_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.product || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.qty ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.unit_type || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {fmtAmount(row.rebate)}
                        </td>
                      </tr>
                    ))
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
