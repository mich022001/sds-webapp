import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Coins,
  Download,
  Filter,
  Package,
  RotateCcw,
  Search,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function formatMoney(v) {
  const n = Number(v || 0);

  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n)
    : "0.00";
}

function formatDate(date) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name) {
  return String(name || "-")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function PageHero() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-r from-slate-50 to-[#f7f4e8] shadow-sm">
      <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#b98918]">
            REBATE OPERATIONS
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            RM Rebates Ledger
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
            Monitor rebate distributions, regional manager performance,
            product movement, and transaction-level rebate history.
          </p>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-blue-700 text-white shadow-lg shadow-blue-900/10">
          <Coins size={34} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  className = "",
  right,
}) {
  return (
    <section
      className={cls(
        "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-blue-700">
              {icon}
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                {title}
              </h2>

              {subtitle ? (
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function StatCard({ label, value, hint, icon }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </div>

          <div className="mt-3 break-words text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-sm text-slate-500">{hint}</div>
          ) : null}
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <Coins size={32} className="text-slate-400" />
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">
        No RM rebate data found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        No rebate records matched the current filters.
      </p>
    </div>
  );
}

export default function RMRebates() {
  const [filters, setFilters] = useState({
    receiver: "",
    buyer: "",
    product: "",
    from: "",
    to: "",
  });

  const [rows, setRows] = useState([]);
  const [rmOptions, setRmOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRms, setLoadingRms] = useState(false);
  const [err, setErr] = useState("");

  async function loadData(currentFilters = filters) {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();

      if (currentFilters.receiver) {
        qs.set("receiver", currentFilters.receiver);
      }

      if (currentFilters.buyer) {
        qs.set("buyer", currentFilters.buyer);
      }

      if (currentFilters.product) {
        qs.set("product", currentFilters.product);
      }

      if (currentFilters.from) {
        qs.set("from", currentFilters.from);
      }

      if (currentFilters.to) {
        qs.set("to", currentFilters.to);
      }

      const res = await fetch(`/api/rm-rebates?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load RM rebates");
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load RM rebates");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRmOptions() {
    try {
      setLoadingRms(true);

      const res = await fetch("/api/members");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load RM list");
      }

      const memberRows = Array.isArray(json?.data) ? json.data : [];

      const unique = Array.from(
        new Set(
          memberRows
            .map((row) => String(row.regional_manager || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      setRmOptions(unique);
    } catch (e) {
      setErr(e?.message || "Failed to load RM list");
      setRmOptions([]);
    } finally {
      setLoadingRms(false);
    }
  }

  useEffect(() => {
    loadData();
    loadRmOptions();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analytics = useMemo(() => {
    const totalRebate = rows.reduce(
      (sum, row) => sum + Number(row.rebate || 0),
      0
    );

    const totalQty = rows.reduce(
      (sum, row) => sum + Number(row.qty || 0),
      0
    );

    const receiverMap = new Map();
    const productMap = new Map();

    rows.forEach((row) => {
      const receiver = String(
        row.receiver_name || "Unassigned"
      ).trim();

      const product = String(
        row.product || "Unknown Product"
      ).trim();

      const rebate = Number(row.rebate || 0);
      const qty = Number(row.qty || 0);

      receiverMap.set(receiver, {
        name: receiver,
        rebate: (receiverMap.get(receiver)?.rebate || 0) + rebate,
        qty: (receiverMap.get(receiver)?.qty || 0) + qty,
        count: (receiverMap.get(receiver)?.count || 0) + 1,
      });

      productMap.set(product, {
        name: product,
        rebate: (productMap.get(product)?.rebate || 0) + rebate,
        qty: (productMap.get(product)?.qty || 0) + qty,
        count: (productMap.get(product)?.count || 0) + 1,
      });
    });

    return {
      totalRebate,
      totalQty,
      uniqueReceivers: receiverMap.size,
      avgRebate: rows.length
        ? totalRebate / rows.length
        : 0,
      topReceivers: Array.from(receiverMap.values()).sort(
        (a, b) => b.rebate - a.rebate
      ),
      topProducts: Array.from(productMap.values()).sort(
        (a, b) => b.qty - a.qty
      ),
    };
  }, [rows]);

  function clearFilters() {
    const cleared = {
      receiver: "",
      buyer: "",
      product: "",
      from: "",
      to: "",
    };

    setFilters(cleared);
    loadData(cleared);
  }

  function exportCsv() {
    const headers = [
      "Date",
      "Receiver",
      "Buyer",
      "Product",
      "Qty",
      "Unit Type",
      "Rebate",
    ];

    const csvRows = rows.map((row) =>
      [
        formatDate(row.created_at),
        row.receiver_name || "",
        row.buyer_name || "",
        row.product || "",
        row.qty ?? 0,
        row.unit_type || "",
        formatMoney(row.rebate),
      ]
        .map((value) =>
          `"${String(value).replaceAll('"', '""')}"`
        )
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `rm-rebates-${
      new Date().toISOString().slice(0, 10)
    }.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero />

      <SectionCard
        title="Advanced Filters"
        subtitle="Filter rebate transactions and rebate activity."
        icon={<Filter size={22} />}
        right={
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Receiver Name
            </span>

            <select
              value={filters.receiver}
              disabled={loadingRms}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  receiver: e.target.value,
                }))
              }
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">
                {loadingRms
                  ? "Loading regional managers..."
                  : "All regional managers"}
              </option>

              {rmOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Buyer Name
            </span>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search buyer"
                value={filters.buyer}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    buyer: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Product
            </span>

            <div className="relative">
              <Package
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search product"
                value={filters.product}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    product: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              From Date
            </span>

            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    from: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              To Date
            </span>

            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    to: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className={cls(
              "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 text-sm font-bold text-white transition hover:bg-blue-800",
              loading && "cursor-not-allowed opacity-70"
            )}
            onClick={() => loadData(filters)}
            disabled={loading}
          >
            <Filter size={16} />
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={clearFilters}
            disabled={loading}
          >
            <RotateCcw size={16} />
            Clear Filters
          </button>
        </div>

        {err ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {err}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Rebate Amount"
          value={`₱${formatMoney(analytics.totalRebate)}`}
          hint="Combined rebates from loaded records"
          icon={<Coins size={26} />}
        />

        <StatCard
          label="Total Product Quantity"
          value={String(analytics.totalQty)}
          hint="Total product movement quantity"
          icon={<Package size={26} />}
        />

        <StatCard
          label="Regional Managers"
          value={String(analytics.uniqueReceivers)}
          hint="Unique rebate receivers"
          icon={<Users size={26} />}
        />

        <StatCard
          label="Average Rebate"
          value={`₱${formatMoney(analytics.avgRebate)}`}
          hint="Average rebate per transaction"
          icon={<TrendingUp size={26} />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Top RM Performance"
          subtitle="Highest rebate receivers in the current result set."
          icon={<Trophy size={22} />}
        >
          <div className="space-y-3">
            {analytics.topReceivers.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <div>
                    <div className="font-black text-slate-950">
                      {item.name}
                    </div>

                    <div className="text-xs text-slate-500">
                      {item.count} transactions · {item.qty} units
                    </div>
                  </div>
                </div>

                <div className="text-right font-black text-blue-700">
                  ₱{formatMoney(item.rebate)}
                </div>
              </div>
            ))}

            {analytics.topReceivers.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No RM performance data yet.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Product Movement"
          subtitle="Products ranked by quantity in current rebate records."
          icon={<BarChart3 size={22} />}
        >
          <div className="space-y-3">
            {analytics.topProducts.slice(0, 5).map((item) => {
              const pct =
                analytics.totalQty > 0
                  ? Math.min(100, (item.qty / analytics.totalQty) * 100)
                  : 0;

              return (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-slate-950">
                        {item.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        {item.count} transactions · ₱
                        {formatMoney(item.rebate)}
                      </div>
                    </div>

                    <div className="text-right font-black text-slate-950">
                      {item.qty}
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {analytics.topProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No product movement data yet.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={`RM Rebate Transactions (${rows.length})`}
        subtitle="Detailed transaction-level rebate records and payout tracking."
        icon={<Coins size={22} />}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      {[
                        "Date",
                        "Receiver",
                        "Buyer",
                        "Product",
                        "Qty",
                        "Unit Type",
                        "Rebate",
                      ].map((head) => (
                        <th
                          key={head}
                          className={cls(
                            "px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500",
                            head === "Rebate" && "text-right"
                          )}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={cls(
                          "transition hover:bg-slate-50",
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/40"
                        )}
                      >
                        <td className="px-5 py-4 text-sm font-medium text-slate-600">
                          {formatDate(row.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-blue-700">
                              {getInitials(row.receiver_name)}
                            </div>

                            <div className="font-black text-slate-950">
                              {row.receiver_name || "-"}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {row.buyer_name || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {row.product || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center text-sm font-black text-slate-950">
                          {row.qty ?? 0}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {row.unit_type || "-"}
                        </td>

                        <td className="px-5 py-4 text-right text-base font-black text-blue-700">
                          ₱{formatMoney(row.rebate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 lg:hidden">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-blue-700">
                        {getInitials(row.receiver_name)}
                      </div>

                      <div>
                        <div className="font-black text-slate-950">
                          {row.receiver_name || "-"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {formatDate(row.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-lg font-black text-blue-700">
                      ₱{formatMoney(row.rebate)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Buyer</span>

                      <span className="font-bold text-slate-900">
                        {row.buyer_name || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Product</span>

                      <span className="font-bold text-slate-900">
                        {row.product || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Quantity</span>

                      <span className="font-bold text-slate-900">
                        {row.qty ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Unit Type</span>

                      <span className="font-bold text-slate-900">
                        {row.unit_type || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
