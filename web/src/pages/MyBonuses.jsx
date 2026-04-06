import { useEffect, useState } from "react";

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

export default function MyBonuses({ user }) {
  const [member, setMember] = useState(null);
  const [report, setReport] = useState(null);
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
          throw new Error(memberJson.error || "Failed to load member");
        }

        const memberRow = Array.isArray(memberJson?.data)
          ? memberJson.data[0]
          : null;

        if (!memberRow?.name) {
          throw new Error("Linked member record not found.");
        }

        const reportRes = await fetch(
          `/api/reports?type=member&name=${encodeURIComponent(memberRow.name)}`
        );
        const reportJson = await reportRes.json().catch(() => ({}));

        if (!reportRes.ok) {
          throw new Error(reportJson.error || "Failed to load bonuses");
        }

        if (!cancelled) {
          setMember(memberRow);
          setReport(reportJson);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load bonuses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  const totals = report?.totals || {};
  const bonuses = Array.isArray(report?.bonuses) ? report.bonuses : [];

  return (
    <div className="grid gap-4">
      {loading ? (
        <Card title="My Bonuses">
          <div className="text-sm text-zinc-500">Loading...</div>
        </Card>
      ) : err ? (
        <Card title="My Bonuses">
          <div className="text-sm text-red-600">{err}</div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Total Cash" value={fmtAmount(totals.total_cash)} />
            <Stat
              label="Redeemable Cash"
              value={fmtAmount(totals.redeemable_cash)}
            />
            <Stat label="Cash Balance" value={fmtAmount(totals.balance_cash)} />
            <Stat
              label="Total Product"
              value={fmtAmount(totals.total_product)}
            />
            <Stat
              label="Redeemed Product"
              value={fmtAmount(totals.redeemed_product)}
            />
            <Stat
              label="Product Balance"
              value={fmtAmount(totals.balance_product)}
            />
          </div>

          <Card title={`Bonus Ledger — ${member?.name || ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Source</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Level</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Label</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Amount</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Redeemable</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500" colSpan={7}>
                        No bonus entries yet.
                      </td>
                    </tr>
                  ) : (
                    bonuses.map((row, idx) => (
                      <tr
                        key={`${row.created_at || "row"}-${idx}`}
                        className="border-b border-zinc-100"
                      >
                        <td className="px-4 py-3 text-zinc-700">
                          {row.created_at || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.source_member_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.relative_level ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.bonus_label || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.bonus_type || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {fmtAmount(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.is_redeemable === true
                            ? "Yes"
                            : row.is_redeemable === false
                              ? "No"
                              : "-"}
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
