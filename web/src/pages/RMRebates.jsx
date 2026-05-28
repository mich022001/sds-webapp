import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Coins,
  Download,
  Filter,
  Package,
  RotateCcw,
  Search,
  Trophy,
  Users,
} from "lucide-react";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fmtDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

function fmtAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value ?? "0.00");
  }

  return number.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      >
        {children}
      </select>
    </label>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
          {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function ProductBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
      {value || "-"}
    </span>
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
  const [loading, setLoading] = useState(true);
  const [loadingRms, setLoadingRms] = useState(false);
  const [err, setErr] = useState("");

  async function loadData(currentFilters = filters) {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();

      if (currentFilters.receiver) qs.set("receiver", currentFilters.receiver);
      if (currentFilters.buyer) qs.set("buyer", currentFilters.buyer);
      if (currentFilters.product) qs.set("product", currentFilters.product);
      if (currentFilters.from) qs.set("from", currentFilters.from);
      if (currentFilters.to) qs.set("to", currentFilters.to);

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

  const stats = useMemo(() => {
    const totalRebate = rows.reduce(
      (sum, row) => sum + Number(row.rebate || 0),
      0
    );

    const totalQty = rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);

    const receiverMap = new Map();
    const productMap = new Map();

    rows.forEach((row) => {
      const receiver = String(row.receiver_name || "Unassigned").trim();
      const product = String(row.product || "Unknown Product").trim();
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
      totalEntries: rows.length,
      totalRebate,
      totalQty,
      receiversCount: receiverMap.size,
      averageRebate: rows.length ? totalRebate / rows.length : 0,
      topReceivers: Array.from(receiverMap.values()).sort(
        (a, b) => b.rebate - a.rebate
      ),
      topProducts: Array.from(productMap.values()).sort((a, b) => b.qty - a.qty),
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
        fmtDate(row.created_at),
        row.receiver_name || "",
        row.buyer_name || "",
        row.product || "",
        row.qty ?? 0,
        row.unit_type || "",
        fmtAmount(row.rebate),
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rm-rebates-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Rebate Operations
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                RM Rebates Ledger
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review regional manager rebates, buyer activity, product
                movement, and transaction history.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <Coins size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Visible Entries"
          value={stats.totalEntries}
          helper="Loaded rebate records"
          icon={Filter}
          tone="blue"
        />
        <StatCard
          label="Total Rebate"
          value={`₱${fmtAmount(stats.totalRebate)}`}
          helper="Filtered rebate value"
          icon={Coins}
          tone="green"
        />
        <StatCard
          label="Product Quantity"
          value={stats.totalQty}
          helper="Total product movement"
          icon={Package}
          tone="gold"
        />
        <StatCard
          label="Receivers"
          value={stats.receiversCount}
          helper="Unique rebate receivers"
          icon={Users}
          tone="slate"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Filter size={18} />
              </div>

              <div>
                <div className="font-bold text-slate-950">Rebate Filters</div>
                <div className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-900">{rows.length}</span>{" "}
                  rebate entries.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              label="Receiver Name"
              value={filters.receiver}
              disabled={loadingRms}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, receiver: e.target.value }))
              }
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
            </Select>

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
              />
              <Input
                label="Buyer Name"
                value={filters.buyer}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, buyer: e.target.value }))
                }
                placeholder="Search buyer"
                className="[&_input]:pl-9"
              />
            </div>

            <Input
              label="Product"
              value={filters.product}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, product: e.target.value }))
              }
              placeholder="Search product"
            />

            <Input
              label="From Date"
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, from: e.target.value }))
              }
            />

            <Input
              label="To Date"
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadData(filters)}
              disabled={loading}
              className={cls(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800",
                loading && "cursor-not-allowed opacity-70"
              )}
            >
              <Filter size={16} />
              {loading ? "Loading..." : "Apply Filters"}
            </button>

            <button
              type="button"
              onClick={clearFilters}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Clear
            </button>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Error: {err}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Trophy size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-950">Top RM Performance</div>
                <div className="mt-1 text-sm text-slate-500">
                  Highest rebate receivers.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            {stats.topReceivers.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-950">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.count} transactions · {item.qty} units
                    </div>
                  </div>
                </div>

                <div className="text-right font-black text-slate-950">
                  ₱{fmtAmount(item.rebate)}
                </div>
              </div>
            ))}

            {stats.topReceivers.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No RM performance data yet.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <BarChart3 size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-950">Product Movement</div>
                <div className="mt-1 text-sm text-slate-500">
                  Products ranked by quantity.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            {stats.topProducts.slice(0, 5).map((item) => {
              const pct =
                stats.totalQty > 0
                  ? Math.min(100, (item.qty / stats.totalQty) * 100)
                  : 0;

              return (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-950">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.count} transactions · ₱{fmtAmount(item.rebate)}
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

            {stats.topProducts.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                No product movement data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Coins size={18} />
            </div>

            <div>
              <div className="font-bold text-slate-950">
                RM Rebate Transactions
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-900">{rows.length}</span>{" "}
                transactions.
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Loading RM rebates...
            </div>
          )}

          {!loading && !err && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
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
                          "px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500",
                          head === "Rebate" && "text-right"
                        )}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No RM rebate entries found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {fmtDate(row.created_at)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                              {getInitials(row.receiver_name)}
                            </div>
                            <div className="font-bold text-slate-950">
                              {row.receiver_name || "-"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {row.buyer_name || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <ProductBadge value={row.product} />
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {row.qty ?? 0}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {row.unit_type || "-"}
                        </td>

                        <td className="px-4 py-4 text-right font-black text-slate-950">
                          ₱{fmtAmount(row.rebate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
