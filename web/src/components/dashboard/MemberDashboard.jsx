import { useEffect, useState } from "react";
import { PackageCheck, UserRound, Wallet } from "lucide-react";

import { cls, fmtAmount } from "./dashboardUtils";

function MetricCard({ label, value, icon: Icon, tone = "blue", helper }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>

      {helper && (
        <div className="mt-2 truncate text-xs text-slate-500">{helper}</div>
      )}
    </div>
  );
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={cls(
        "max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="font-bold text-slate-950">{title}</div>
          {right}
        </div>
      </div>

      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}

function LoadingCard({ title = "Loading dashboard..." }) {
  return (
    <Card title={title}>
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </Card>
  );
}

export default function MemberDashboard({ user }) {
  const [member, setMember] = useState(null);
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState([]);
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

        const [reportRes, salesRes] = await Promise.all([
          fetch(`/api/reports?type=member&name=${encodeURIComponent(memberRow.name)}`),
          fetch("/api/sales"),
        ]);

        const reportJson = await reportRes.json().catch(() => ({}));
        const salesJson = await salesRes.json().catch(() => ({}));

        if (!reportRes.ok) {
          throw new Error(reportJson.error || "Failed to load bonuses");
        }

        if (!salesRes.ok) {
          throw new Error(salesJson.error || "Failed to load sales");
        }

        if (!cancelled) {
          setMember(memberRow);
          setReport(reportJson);
          setSales(Array.isArray(salesJson?.data) ? salesJson.data : []);
        }
      } catch (error) {
        if (!cancelled) setErr(error?.message || "Failed to load dashboard");
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

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
            Personal Dashboard
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
            Welcome, {member?.name || user?.full_name || "Member"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
            View your membership profile, balances, upline details, and recent sales requests.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingCard title="My Summary" />
      ) : err ? (
        <Card title="My Summary">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {err}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Member ID"
              value={member?.member_id || "-"}
              icon={UserRound}
              tone="blue"
            />
            <MetricCard
              label="Membership Type"
              value={member?.membership_type || "-"}
              icon={PackageCheck}
              tone="gold"
            />
            <MetricCard
              label="Cash Balance"
              value={fmtAmount(totals.balance_cash)}
              icon={Wallet}
              tone="green"
            />
            <MetricCard
              label="Product Balance"
              value={fmtAmount(totals.balance_product)}
              icon={PackageCheck}
              tone="slate"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="My Upline Details">
              <div className="space-y-3">
                {[
                  ["Sponsor", member?.sponsor_name || "-"],
                  ["Regional Manager", member?.regional_manager || "-"],
                  ["Area / Region", member?.area_region || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="My Recent Sales Requests">
              {sales.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No sales yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.slice(0, 5).map((row, index) => (
                    <div
                      key={`${row.id || index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="text-sm font-bold text-slate-950">
                        {row.product_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Qty {row.quantity} • Total ₱{fmtAmount(row.total_amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
