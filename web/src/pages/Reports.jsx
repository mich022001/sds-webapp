import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Package,
  PieChart,
  RefreshCcw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fmtDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtAmount(value) {
  const number = Number(value || 0);

  return Number.isFinite(number)
    ? number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, right }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={18} />
            </div>

            <div>
              <div className="font-bold text-slate-950">{title}</div>
              {subtitle ? (
                <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
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

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
      {children}
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}

function ChartToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange("bar")}
        className={cls(
          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
          value === "bar"
            ? "bg-blue-700 text-white"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <BarChart3 size={14} />
        Bar
      </button>

      <button
        type="button"
        onClick={() => onChange("pie")}
        className={cls(
          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
          value === "pie"
            ? "bg-blue-700 text-white"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <PieChart size={14} />
        Pie
      </button>
    </div>
  );
}

function SimpleBarChart({ rows, valueLabel = "₱", emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row, index) => {
        const percent = Math.max(5, Math.round((Number(row.value || 0) / max) * 100));

        return (
          <div
            key={`${row.name}-${index}`}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-950">
                  {row.name}
                </div>
                <div className="text-xs text-slate-500">
                  {row.count} records · {row.qty} qty
                </div>
              </div>

              <div className="shrink-0 text-sm font-black text-slate-950">
                {valueLabel}
                {fmtAmount(row.value)}
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimplePieChart({ rows, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
  let running = 0;

  const gradient = rows
    .slice(0, 8)
    .map((row, index) => {
      const value = Number(row.value || 0);
      const start = total > 0 ? (running / total) * 100 : 0;
      running += value;
      const end = total > 0 ? (running / total) * 100 : 0;

      const colors = [
        "#1d4ed8",
        "#eab308",
        "#059669",
        "#7c3aed",
        "#dc2626",
        "#0891b2",
        "#475569",
        "#ea580c",
      ];

      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div
        className="mx-auto h-52 w-52 rounded-full border border-slate-200 shadow-inner"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
      />

      <div className="space-y-3">
        {rows.slice(0, 8).map((row, index) => {
          const percent = total > 0 ? (Number(row.value || 0) / total) * 100 : 0;
          const colors = [
            "bg-blue-700",
            "bg-yellow-500",
            "bg-emerald-600",
            "bg-violet-600",
            "bg-red-600",
            "bg-cyan-600",
            "bg-slate-600",
            "bg-orange-600",
          ];

          return (
            <div
              key={`${row.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cls(
                    "h-3 w-3 shrink-0 rounded-full",
                    colors[index % colors.length]
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-950">
                    {row.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.count} records · {row.qty} qty
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-black text-slate-950">
                  ₱{fmtAmount(row.value)}
                </div>
                <div className="text-xs text-slate-500">{percent.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportChart({ rows, type, emptyText }) {
  if (type === "pie") return <SimplePieChart rows={rows} emptyText={emptyText} />;

  return <SimpleBarChart rows={rows} emptyText={emptyText} />;
}

function exportRowsCsv(filename, headers, rows) {
  const csvRows = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header.key] ?? "";
        return `"${String(value).replaceAll('"', '""')}"`;
      })
      .join(",")
  );

  const csv = [
    headers.map((header) => `"${header.label.replaceAll('"', '""')}"`).join(","),
    ...csvRows,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function groupRows(rows, key, fallback) {
  const map = new Map();

  rows.forEach((row) => {
    const name = String(row[key] || "").trim() || fallback;
    const amount = Number(row.total_amount || 0);
    const qty = Number(row.quantity || 0);

    const current = map.get(name) || {
      name,
      value: 0,
      qty: 0,
      count: 0,
    };

    map.set(name, {
      ...current,
      value: current.value + amount,
      qty: current.qty + qty,
      count: current.count + 1,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

export default function Reports() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    buyer: "",
    packageType: "",
    product: "",
  });

  const [chartTypes, setChartTypes] = useState({
    regional: "bar",
    packages: "bar",
    products: "bar",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [salesRows, setSalesRows] = useState([]);

  async function loadSales(currentFilters = filters) {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();

      if (currentFilters.from) qs.set("from", currentFilters.from);
      if (currentFilters.to) qs.set("to", currentFilters.to);
      if (currentFilters.buyer) qs.set("buyer", currentFilters.buyer);
      if (currentFilters.product) qs.set("product", currentFilters.product);

      qs.set("status", "released");

      const res = await fetch(`/api/sales?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load reports");

      setSalesRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load reports");
      setSalesRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const packageRows = useMemo(() => {
    return salesRows
      .filter(
        (row) => String(row.item_type || "").trim().toLowerCase() === "package"
      )
      .filter((row) =>
        filters.packageType
          ? String(row.product_name || "")
              .toLowerCase()
              .includes(filters.packageType.toLowerCase())
          : true
      );
  }, [salesRows, filters.packageType]);

  const productRows = useMemo(() => {
    return salesRows.filter(
      (row) => String(row.item_type || "").trim().toLowerCase() === "product"
    );
  }, [salesRows]);

  const reportSummary = useMemo(() => {
    const packageAmount = packageRows.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );

    const productAmount = productRows.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );

    const packageQty = packageRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );

    const productQty = productRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );

    const regionalManagers = new Set(
      salesRows
        .map((row) => String(row.regional_manager || "").trim())
        .filter(Boolean)
    );

    return {
      packageAmount,
      productAmount,
      packageQty,
      productQty,
      totalAmount: packageAmount + productAmount,
      totalRecords: packageRows.length + productRows.length,
      regionalManagers: regionalManagers.size,
    };
  }, [packageRows, productRows, salesRows]);

  const regionalChartRows = useMemo(
    () => groupRows(salesRows, "regional_manager", "Unassigned RM"),
    [salesRows]
  );

  const packageChartRows = useMemo(
    () => groupRows(packageRows, "product_name", "Unknown Package"),
    [packageRows]
  );

  const productChartRows = useMemo(
    () => groupRows(productRows, "product_name", "Unknown Product"),
    [productRows]
  );

  function clearFilters() {
    const cleared = {
      from: "",
      to: "",
      buyer: "",
      packageType: "",
      product: "",
    };

    setFilters(cleared);
    loadSales(cleared);
  }

  function updateChartType(key, value) {
    setChartTypes((prev) => ({ ...prev, [key]: value }));
  }

  function exportPackages() {
    exportRowsCsv(
      "membership-package-purchases",
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member Name" },
        { key: "package", label: "Package" },
        { key: "amount", label: "Amount" },
        { key: "encoded_by", label: "Encoded By" },
        { key: "regional_manager", label: "Regional Manager" },
        { key: "status", label: "Status" },
      ],
      packageRows.map((row) => ({
        date: fmtDate(row.created_at),
        member: row.member_name || "",
        package: row.product_name || "",
        amount: fmtAmount(row.total_amount),
        encoded_by: row.encoded_by || "",
        regional_manager: row.regional_manager || "",
        status: row.status || "",
      }))
    );
  }

  function exportProducts() {
    exportRowsCsv(
      "regular-product-sales",
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Buyer / Member" },
        { key: "product", label: "Product" },
        { key: "qty", label: "Quantity" },
        { key: "amount", label: "Amount" },
        { key: "encoded_by", label: "Encoded By" },
        { key: "status", label: "Status" },
      ],
      productRows.map((row) => ({
        date: fmtDate(row.created_at),
        member: row.member_name || "",
        product: row.product_name || "",
        qty: row.quantity ?? 0,
        amount: fmtAmount(row.total_amount),
        encoded_by: row.encoded_by || "",
        status: row.status || "",
      }))
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Report Center
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Business Reports
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                Generate formal report views for released package purchases,
                regular product sales, regional manager coverage, and exportable
                business records.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <FileText size={22} />
            </div>
          </div>
        </div>
      </div>

      <SectionCard
        title="Report Criteria"
        subtitle="Filter released sales records for report generation."
        icon={Search}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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

          <Input
            label="Buyer / Member"
            value={filters.buyer}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, buyer: e.target.value }))
            }
            placeholder="Search buyer"
          />

          <Input
            label="Package Type"
            value={filters.packageType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, packageType: e.target.value }))
            }
            placeholder="Package 1"
          />

          <Input
            label="Product"
            value={filters.product}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, product: e.target.value }))
            }
            placeholder="Search product"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadSales(filters)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            <Search size={16} />
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={clearFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Clear
          </button>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Released Report Value"
          value={`₱${fmtAmount(reportSummary.totalAmount)}`}
          helper="Package + product report value"
        />

        <StatCard
          label="Package Quantity"
          value={reportSummary.packageQty}
          helper="Released package purchases"
        />

        <StatCard
          label="Product Quantity"
          value={reportSummary.productQty}
          helper="Released product movement"
        />

        <StatCard
          label="Regional Managers"
          value={reportSummary.regionalManagers}
          helper={`${reportSummary.totalRecords} report records`}
        />
      </div>

      <SectionCard
        title="Regional Manager Overall"
        subtitle="Overall released sales handled per regional manager."
        icon={Users}
        right={
          <ChartToggle
            value={chartTypes.regional}
            onChange={(value) => updateChartType("regional", value)}
          />
        }
      >
        {loading ? (
          <EmptyState>Loading regional manager chart...</EmptyState>
        ) : (
          <ReportChart
            rows={regionalChartRows}
            type={chartTypes.regional}
            emptyText="No regional manager report data found."
          />
        )}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Package Report Chart"
          subtitle="Released membership package report by package type."
          icon={Package}
          right={
            <ChartToggle
              value={chartTypes.packages}
              onChange={(value) => updateChartType("packages", value)}
            />
          }
        >
          {loading ? (
            <EmptyState>Loading package chart...</EmptyState>
          ) : (
            <ReportChart
              rows={packageChartRows}
              type={chartTypes.packages}
              emptyText="No package chart data found."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Product Report Chart"
          subtitle="Released regular product report by product."
          icon={ShoppingBag}
          right={
            <ChartToggle
              value={chartTypes.products}
              onChange={(value) => updateChartType("products", value)}
            />
          }
        >
          {loading ? (
            <EmptyState>Loading product chart...</EmptyState>
          ) : (
            <ReportChart
              rows={productChartRows}
              type={chartTypes.products}
              emptyText="No product chart data found."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Membership Package Purchases"
        subtitle={`${packageRows.length} released package records.`}
        icon={Package}
        right={
          <button
            type="button"
            disabled={packageRows.length === 0}
            onClick={exportPackages}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        {loading ? (
          <EmptyState>Loading package report...</EmptyState>
        ) : packageRows.length === 0 ? (
          <EmptyState>No package purchase data found.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Date",
                    "Member Name",
                    "Package",
                    "Amount",
                    "Encoded By",
                    "Regional Manager",
                    "Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {packageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {row.member_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.product_name || "-"}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">
                      ₱{fmtAmount(row.total_amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.encoded_by || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.regional_manager || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.status || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Regular Product Sales"
        subtitle={`${productRows.length} released product sales records.`}
        icon={ShoppingBag}
        right={
          <button
            type="button"
            disabled={productRows.length === 0}
            onClick={exportProducts}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        {loading ? (
          <EmptyState>Loading product sales report...</EmptyState>
        ) : productRows.length === 0 ? (
          <EmptyState>No regular product sales data found.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Date",
                    "Buyer / Member",
                    "Product",
                    "Qty",
                    "Amount",
                    "Encoded By",
                    "Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {productRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {row.member_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.product_name || "-"}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {row.quantity ?? 0}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">
                      ₱{fmtAmount(row.total_amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.encoded_by || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.status || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
