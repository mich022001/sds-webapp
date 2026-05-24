import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Crown,
  Network,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { cls, fmtAmount, levelLabel, norm } from "./dashboardUtils";

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

function MemberPill({ member, index, selected, onSelect }) {
  const name = member?.name || "-";

  return (
    <button
      type="button"
      onClick={() => onSelect(member)}
      className={cls(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-blue-200 bg-blue-50 text-blue-950"
          : "border-slate-100 bg-white/90 text-slate-800"
      )}
    >
      <div
        className={cls(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold",
          selected
            ? "bg-blue-700 text-white"
            : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700"
        )}
      >
        {String(name).slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{name}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">
          Sponsor: {member?.sponsor_name || "SDS"}
        </div>
      </div>

      <div className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-300 sm:block">
        #{index + 1}
      </div>
    </button>
  );
}

function SelectedMemberPanel({ member }) {
  if (!member) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Select a member to view details.
      </div>
    );
  }

  const details = [
    ["Member", member.name || "-"],
    ["Sponsor", member.sponsor_name || "SDS"],
    ["Membership", member.membership_type || "-"],
    ["Area / Region", member.area_region || "-"],
    ["Regional Manager", member.regional_manager || "-"],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-base font-black text-white shadow-sm">
          {String(member.name || "?").slice(0, 1).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="truncate text-base font-extrabold text-slate-950">
            {member.name || "-"}
          </div>
          <div className="mt-0.5 text-xs font-medium text-slate-500">
            Member profile
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white px-3 py-2.5"
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function saleStatusLabel(status) {
  const clean = norm(status);
  if (!clean) return "unknown";
  return clean.replace(/_/g, " ");
}

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const [membersRes, salesRes] = await Promise.all([
          fetch("/api/members", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/sales", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
        ]);

        if (!membersRes.ok) {
          const txt = await membersRes.text().catch(() => "");
          throw new Error(`Members API ${membersRes.status}: ${txt || membersRes.statusText}`);
        }

        if (!salesRes.ok) {
          const txt = await salesRes.text().catch(() => "");
          throw new Error(`Sales API ${salesRes.status}: ${txt || salesRes.statusText}`);
        }

        const membersJson = await membersRes.json();
        const salesJson = await salesRes.json();

        if (!cancelled) {
          setRows(Array.isArray(membersJson?.data) ? membersJson.data : []);
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
  }, []);

  const grouped = useMemo(() => {
    const displayNameByNorm = new Map();
    const sponsorByNormName = new Map();
    const rowByNormName = new Map();

    for (const member of rows) {
      const name = norm(member.name);
      const sponsor = norm(member.sponsor_name);
      if (!name) continue;

      displayNameByNorm.set(name, member.name);
      sponsorByNormName.set(name, sponsor);
      rowByNormName.set(name, member);
    }

    const memo = new Map();

    function computeLevel(normName, seen = new Set()) {
      if (memo.has(normName)) return memo.get(normName);
      if (seen.has(normName)) return 1;

      seen.add(normName);

      const sponsorNorm = sponsorByNormName.get(normName);

      if (!sponsorNorm || sponsorNorm === "sds") {
        memo.set(normName, 1);
        return 1;
      }

      if (!displayNameByNorm.has(sponsorNorm)) {
        memo.set(normName, 1);
        return 1;
      }

      const level = computeLevel(sponsorNorm, seen) + 1;
      memo.set(normName, level);
      return level;
    }

    const map = new Map();
    map.set(0, [{ name: "SDS", level: 0 }]);

    for (const normName of displayNameByNorm.keys()) {
      const level = computeLevel(normName);
      const row = rowByNormName.get(normName) || {};
      const enriched = {
        ...row,
        name: displayNameByNorm.get(normName),
        level,
      };

      if (!map.has(level)) map.set(level, []);
      map.get(level).push(enriched);
    }

    const levels = Array.from(map.keys()).sort((a, b) => a - b);

    for (const level of levels) {
      map
        .get(level)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    const levelItems = levels
      .filter((level) => level !== 0)
      .map((level) => ({
        level,
        title: levelLabel(level),
        members: map.get(level) || [],
        count: map.get(level)?.length || 0,
      }));

    return { map, levels, levelItems };
  }, [rows]);

  const filteredLevelItems = useMemo(() => {
    const term = norm(search);

    return grouped.levelItems
      .filter((item) => activeLevel === "all" || item.level === activeLevel)
      .map((item) => ({
        ...item,
        members: item.members.filter((member) => {
          if (!term) return true;

          return [
            member.name,
            member.sponsor_name,
            member.membership_type,
            member.area_region,
            member.regional_manager,
          ]
            .map(norm)
            .some((value) => value.includes(term));
        }),
      }))
      .filter((item) => item.members.length > 0 || !term);
  }, [grouped.levelItems, search, activeLevel]);

  const salesAnalytics = useMemo(() => {
    const productMap = new Map();
    const statusMap = new Map();

    let totalSales = 0;
    let releasedSales = 0;
    let pendingCount = 0;
    let productsSold = 0;

    for (const sale of sales) {
      const qty = Number(sale.quantity || 0);
      const amount = Number(sale.total_amount || 0);
      const status = norm(sale.status) || "unknown";
      const productName = String(sale.product_name || "Unknown Product").trim();

      if (Number.isFinite(amount)) totalSales += amount;
      if (Number.isFinite(qty)) productsSold += qty;

      if (status === "released") releasedSales += amount;
      if (["pending", "approved", "paid"].includes(status)) pendingCount += 1;

      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const current = productMap.get(productName) || {
        name: productName,
        qty: 0,
        amount: 0,
      };

      productMap.set(productName, {
        ...current,
        qty: current.qty + (Number.isFinite(qty) ? qty : 0),
        amount: current.amount + (Number.isFinite(amount) ? amount : 0),
      });
    }

    const avgOrder = sales.length > 0 ? totalSales / sales.length : 0;

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const recentSales = sales.slice(0, 5).map((sale) => ({
      title: sale.product_name || "Sale",
      detail: `${sale.member_name || "Unknown buyer"} • Qty ${
        sale.quantity || 0
      } • ${saleStatusLabel(sale.status)}`,
      amount: Number(sale.total_amount || 0),
    }));

    return {
      totalSales,
      releasedSales,
      pendingCount,
      productsSold,
      avgOrder,
      topProducts,
      statusBreakdown,
      recentSales,
    };
  }, [sales]);

  const analytics = useMemo(() => {
    const sponsorCounts = new Map();
    const membershipCounts = new Map();

    for (const member of rows) {
      const sponsor = String(member.sponsor_name || "SDS").trim() || "SDS";
      sponsorCounts.set(sponsor, (sponsorCounts.get(sponsor) || 0) + 1);

      const membership = String(member.membership_type || "Unassigned").trim();
      membershipCounts.set(
        membership,
        (membershipCounts.get(membership) || 0) + 1
      );
    }

    const topSponsors = Array.from(sponsorCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const membershipMix = Array.from(membershipCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const level1 = grouped.map.get(1)?.length ?? 0;
    const level3 = grouped.map.get(3)?.length ?? 0;

    const alerts = [
      {
        type: "Sales",
        title:
          salesAnalytics.pendingCount > 0
            ? "Sales queue needs review"
            : "Sales queue is clear",
        detail: `${salesAnalytics.pendingCount} sale${
          salesAnalytics.pendingCount === 1 ? "" : "s"
        } currently pending approval/payment/release.`,
        tone: salesAnalytics.pendingCount > 0 ? "gold" : "green",
      },
      {
        type: "Network",
        title:
          level1 <= 3
            ? "Direct branch is still concentrated"
            : "Direct branch is expanding",
        detail: `${level1} member${level1 === 1 ? "" : "s"} in 1st level.`,
        tone: level1 <= 3 ? "gold" : "green",
      },
      {
        type: "Distribution",
        title:
          level3 > level1
            ? "Lower levels are carrying growth"
            : "Growth is mostly near the top",
        detail: `${level3} members currently sit in 3rd level.`,
        tone: level3 > level1 ? "blue" : "gold",
      },
    ];

    const recentMembers = rows.slice(-3).reverse().map((member) => ({
      title: member.name || "New member",
      detail: `${member.membership_type || "Member"} under ${
        member.sponsor_name || "SDS"
      }`,
    }));

    return { topSponsors, membershipMix, alerts, recentMembers };
  }, [rows, grouped, salesAnalytics.pendingCount]);

  useEffect(() => {
    function updateScrollState() {
      const el = scrollRef.current;
      if (!el) return;

      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [filteredLevelItems]);

  function scrollLevels(direction) {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  const totalMembers = rows.length;
  const totalLevel1 = grouped.map.get(1)?.length ?? 0;
  const totalLevel2 = grouped.map.get(2)?.length ?? 0;
  const totalLevel3 = grouped.map.get(3)?.length ?? 0;
  const totalLevelsShown = grouped.levels.filter((level) => level !== 0).length;

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
              Executive Dashboard
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              SDS Business Overview
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Monitor member growth, sales volume, sponsor performance, and
              network distribution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Sales Volume
              </div>
              <div className="mt-1 text-xl font-extrabold text-blue-950">
                ₱{fmtAmount(salesAnalytics.totalSales)}
              </div>
            </div>

            <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-yellow-700">
                Pending Sales
              </div>
              <div className="mt-1 text-xl font-extrabold text-yellow-800">
                {salesAnalytics.pendingCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <MetricCard
          label="Sales Volume"
          value={`₱${fmtAmount(salesAnalytics.totalSales)}`}
          icon={Wallet}
          tone="green"
          helper="All sales ledger value"
        />
        <MetricCard
          label="Released Sales"
          value={`₱${fmtAmount(salesAnalytics.releasedSales)}`}
          icon={ShieldCheck}
          tone="blue"
          helper="Completed and released sales"
        />
        <MetricCard
          label="Products Sold"
          value={salesAnalytics.productsSold}
          icon={PackageCheck}
          tone="gold"
          helper="Total quantity sold"
        />
        <MetricCard
          label="Pending Sales"
          value={salesAnalytics.pendingCount}
          icon={ShoppingCart}
          tone={salesAnalytics.pendingCount > 0 ? "red" : "slate"}
          helper="Pending, approved, or paid"
        />
        <MetricCard
          label="Total Members"
          value={totalMembers}
          icon={Users}
          tone="blue"
          helper="All registered members"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card title="Sales Operations">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Average Order
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                ₱{fmtAmount(salesAnalytics.avgOrder)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Sales Records
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                {sales.length}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Network Depth
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                {totalLevelsShown}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                <PackageCheck size={16} className="text-blue-700" />
                Top Products
              </div>

              <div className="space-y-2">
                {salesAnalytics.topProducts.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No sales data yet.
                  </div>
                ) : (
                  salesAnalytics.topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {index + 1}. {product.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Qty {product.qty}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-black text-blue-700">
                        ₱{fmtAmount(product.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                <Activity size={16} className="text-blue-700" />
                Recent Sales
              </div>

              <div className="space-y-2">
                {salesAnalytics.recentSales.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No sales activity yet.
                  </div>
                ) : (
                  salesAnalytics.recentSales.map((sale, index) => (
                    <div
                      key={`${sale.title}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {sale.title}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {sale.detail}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-black text-blue-700">
                        ₱{fmtAmount(sale.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Executive Alerts">
          <div className="space-y-3">
            {analytics.alerts.map((alert) => (
              <div
                key={alert.title}
                className={cls(
                  "rounded-xl border px-4 py-3",
                  alert.tone === "gold" &&
                    "border-yellow-100 bg-yellow-50 text-yellow-900",
                  alert.tone === "blue" &&
                    "border-blue-100 bg-blue-50 text-blue-900",
                  alert.tone === "green" &&
                    "border-emerald-100 bg-emerald-50 text-emerald-900"
                )}
              >
                <div className="flex items-start gap-3">
                  {alert.tone === "gold" ? (
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  ) : (
                    <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wide opacity-70">
                      {alert.type}
                    </div>
                    <div className="mt-0.5 text-sm font-extrabold">
                      {alert.title}
                    </div>
                    <div className="mt-1 text-xs opacity-80">
                      {alert.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card title="Network Intelligence">
          <div className="grid gap-3 sm:grid-cols-3">
            {analytics.membershipMix.slice(0, 3).map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {item.name}
                </div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {item.count}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
              <Crown size={16} className="text-yellow-600" />
              Top Sponsors
            </div>

            <div className="space-y-2">
              {analytics.topSponsors.map((sponsor, index) => (
                <div
                  key={sponsor.name}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {index + 1}. {sponsor.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Direct network count
                    </div>
                  </div>
                  <div className="text-sm font-black text-blue-700">
                    {sponsor.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Recent Member Activity">
          <div className="space-y-2">
            {analytics.recentMembers.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No recent member activity yet.
              </div>
            ) : (
              analytics.recentMembers.map((activity, index) => (
                <div
                  key={`${activity.title}-${index}`}
                  className="rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {activity.title}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {activity.detail}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {loading && <LoadingCard title="Genealogy Explorer" />}

      {err && (
        <Card title="Genealogy Explorer">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        </Card>
      )}

      {!loading && !err && (
        <Card
          title="Genealogy Explorer"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollLevels(-1)}
                disabled={!canScrollLeft}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={15} />
              </button>

              <button
                type="button"
                onClick={() => scrollLevels(1)}
                disabled={!canScrollRight}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          }
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member, sponsor, area..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setActiveLevel("all")}
                className={cls(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition",
                  activeLevel === "all"
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                All Levels
              </button>

              {grouped.levelItems.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setActiveLevel(item.level)}
                  className={cls(
                    "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition",
                    activeLevel === item.level
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  L{item.level} · {item.count}
                </button>
              ))}
            </div>
          </div>

          {filteredLevelItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No members found for this search.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative max-w-full overflow-hidden">
                {canScrollLeft && (
                  <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
                )}
                {canScrollRight && (
                  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />
                )}

                <div
                  ref={scrollRef}
                  className="w-full overflow-x-auto overflow-y-hidden pb-2"
                >
                  <div className="flex w-max gap-3 pr-2">
                    {filteredLevelItems.map((item) => (
                      <div
                        key={item.level}
                        className="w-[270px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 sm:w-[310px]"
                      >
                        <div className="border-b border-slate-200 bg-white px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-extrabold text-slate-950">
                                {item.title}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {item.members.length} shown / {item.count} total
                              </div>
                            </div>

                            <div className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              L{item.level}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-[380px] overflow-y-auto p-2.5">
                          {item.members.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                              No matching members
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {item.members.map((member, index) => (
                                <MemberPill
                                  key={`${item.level}-${member.name}-${index}`}
                                  member={member}
                                  index={index}
                                  selected={
                                    norm(selectedMember?.name) ===
                                    norm(member.name)
                                  }
                                  onSelect={setSelectedMember}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 text-center text-xs text-slate-400 md:hidden">
                  Swipe horizontally to view more levels
                </div>
              </div>

              <SelectedMemberPanel member={selectedMember} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
