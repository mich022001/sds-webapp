import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  Boxes,
  CheckCircle2,
  Clock,
  Network,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Wallet,
} from "lucide-react";

import { cls, fmtAmount, norm } from "./dashboardUtils";

function MetricCard({ label, value, icon: Icon, tone = "blue", helper }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
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

function StatusPill({ status }) {
  const clean = norm(status) || "unknown";

  const tone =
    clean === "released"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : clean === "pending"
        ? "bg-yellow-50 text-yellow-700 border-yellow-100"
        : clean === "approved" || clean === "paid"
          ? "bg-blue-50 text-blue-700 border-blue-100"
          : "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone
      )}
    >
      {clean.replace(/_/g, " ")}
    </span>
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

  const memberAnalytics = useMemo(() => {
    const levels = Array.isArray(report?.levels) ? report.levels : [];
    const bonuses = Array.isArray(report?.bonuses) ? report.bonuses : [];
    const redemptions = Array.isArray(report?.redemptions)
      ? report.redemptions
      : [];
    const downlines = Array.isArray(report?.downlines) ? report.downlines : [];

    const directDownlines =
      levels.find((level) => Number(level.level) === 1)?.member_count || 0;

    const totalDownlines = downlines.length;

    const salesTotal = sales.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );

    const productsSold = sales.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );

    const pendingSales = sales.filter((row) =>
      ["pending", "approved", "paid"].includes(norm(row.status))
    ).length;

    const releasedSales = sales.filter((row) => norm(row.status) === "released");

    const recentBonuses = bonuses.slice(-5).reverse();
    const recentRedemptions = redemptions.slice(0, 5);
    const recentSales = sales.slice(0, 5);

    const cashEarned = Number(totals.total_cash || 0);
    const productEarned = Number(totals.total_product || 0);
    const redeemableCash = Number(totals.redeemable_cash || 0);
    const redeemedCash = Number(totals.redeemed_cash || 0);
    const redeemedProduct = Number(totals.redeemed_product || 0);

    return {
      directDownlines,
      totalDownlines,
      salesTotal,
      productsSold,
      pendingSales,
      releasedSales,
      recentBonuses,
      recentRedemptions,
      recentSales,
      cashEarned,
      productEarned,
      redeemableCash,
      redeemedCash,
      redeemedProduct,
    };
  }, [report, sales, totals]);

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
              Personal Dashboard
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              Welcome, {member?.name || user?.full_name || "Member"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Track your earnings, redeemable balances, sales requests, and personal network.
            </p>
          </div>

          {!loading && !err && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Cash Balance
                </div>
                <div className="mt-1 text-xl font-extrabold text-emerald-900">
                  ₱{fmtAmount(totals.balance_cash)}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  Downlines
                </div>
                <div className="mt-1 text-xl font-extrabold text-blue-950">
                  {memberAnalytics.totalDownlines}
                </div>
              </div>
            </div>
          )}
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Cash Balance"
              value={`₱${fmtAmount(totals.balance_cash)}`}
              icon={Wallet}
              tone="green"
              helper="Available redeemable cash"
            />
            <MetricCard
              label="Product Balance"
              value={fmtAmount(totals.balance_product)}
              icon={PackageCheck}
              tone="blue"
              helper="Available product balance"
            />
            <MetricCard
              label="Cash Earned"
              value={`₱${fmtAmount(memberAnalytics.cashEarned)}`}
              icon={Banknote}
              tone="gold"
              helper="Total cash bonuses earned"
            />
            <MetricCard
              label="My Downlines"
              value={memberAnalytics.totalDownlines}
              icon={Network}
              tone="slate"
              helper={`${memberAnalytics.directDownlines} direct recruits`}
            />
            <MetricCard
              label="Pending Sales"
              value={memberAnalytics.pendingSales}
              icon={Clock}
              tone={memberAnalytics.pendingSales > 0 ? "red" : "slate"}
              helper="Needs approval/payment/release"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card title="Earnings Overview">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Redeemable Cash
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    ₱{fmtAmount(memberAnalytics.redeemableCash)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Redeemed Cash
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    ₱{fmtAmount(memberAnalytics.redeemedCash)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Product Earned
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    {fmtAmount(memberAnalytics.productEarned)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                  <Activity size={16} className="text-blue-700" />
                  Recent Bonuses
                </div>

                <div className="space-y-2">
                  {memberAnalytics.recentBonuses.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      No bonuses yet.
                    </div>
                  ) : (
                    memberAnalytics.recentBonuses.map((bonus, index) => (
                      <div
                        key={`${bonus.created_at || index}-${bonus.bonus_label || index}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {bonus.bonus_label || bonus.reason || "Bonus"}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            From {bonus.source_member_name || bonus.product || "-"}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-black text-blue-700">
                          {norm(bonus.bonus_type) === "cash" ? "₱" : ""}
                          {fmtAmount(bonus.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card title="My Profile">
              <div className="space-y-3">
                {[
                  ["Member ID", member?.member_id || "-"],
                  ["Membership", member?.membership_type || "-"],
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
                    <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card title="My Sales Operations">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Sales Volume
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    ₱{fmtAmount(memberAnalytics.salesTotal)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Products Sold
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    {memberAnalytics.productsSold}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Released Sales
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-950">
                    {memberAnalytics.releasedSales.length}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {memberAnalytics.recentSales.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No sales yet.
                  </div>
                ) : (
                  memberAnalytics.recentSales.map((row, index) => (
                    <div
                      key={`${row.id || index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-950">
                          {row.product_name}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          Qty {row.quantity} • Total ₱{fmtAmount(row.total_amount)}
                        </div>
                      </div>
                      <StatusPill status={row.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Redemption Activity">
              <div className="space-y-2">
                {memberAnalytics.recentRedemptions.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No redemptions yet.
                  </div>
                ) : (
                  memberAnalytics.recentRedemptions.map((row, index) => (
                    <div
                      key={`${row.created_at || index}-${row.redeem_type || index}`}
                      className="rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {row.redeem_type || "Redemption"}
                        </div>
                        <div className="text-sm font-black text-blue-700">
                          {fmtAmount(row.qty)}
                        </div>
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {row.source || row.notes || "Processed redemption"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
