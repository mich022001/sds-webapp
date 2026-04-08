import { useEffect, useMemo, useState } from "react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function formatMoney(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function Reports() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    buyer: "",
    packageType: "",
    product: "",
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

      // IMPORTANT: reports should only include approved sales
      qs.set("status", "approved");

      const res = await fetch(`/api/sales?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load sales data");
      }

      setSalesRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load sales data");
      setSalesRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const packageRows = useMemo(() => {
    return salesRows.filter((row) => {
      const itemType = String(row.item_type || "").trim().toLowerCase();
      return itemType === "package";
    });
  }, [salesRows]);

  const regularSalesRows = useMemo(() => {
    return salesRows.filter((row) => {
      const itemType = String(row.item_type || "").trim().toLowerCase();
      return itemType === "product";
    });
  }, [salesRows]);

  const filteredPackageRows = useMemo(() => {
    return packageRows.filter((row) =>
      filters.packageType
        ? String(row.product_name || "")
            .toLowerCase()
            .includes(filters.packageType.toLowerCase())
        : true
    );
  }, [packageRows, filters.packageType]);

  const totalSalesAmount = useMemo(() => {
    return salesRows.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );
  }, [salesRows]);

  const totalPackagesSold = useMemo(() => {
    return packageRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );
  }, [packageRows]);

  const totalProductsSold = useMemo(() => {
    return regularSalesRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );
  }, [regularSalesRows]);

  const totalBuyers = useMemo(() => {
    const names = new Set(
      salesRows
        .map((row) => String(row.member_name || "").trim())
        .filter(Boolean)
    );
    return names.size;
  }, [salesRows]);

  const topProducts = useMemo(() => {
    const map = new Map();

    for (const row of regularSalesRows) {
      const name = String(row.product_name || "").trim() || "Unknown Product";
      const qty = Number(row.quantity || 0);
      map.set(name, (map.get(name) || 0) + qty);
    }

    return [...map.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [regularSalesRows]);

  const topPackages = useMemo(() => {
    const map = new Map();

    for (const row of packageRows) {
      const name = String(row.product_name || "").trim() || "Unknown Package";
      const qty = Number(row.quantity || 0);
      map.set(name, (map.get(name) || 0) + qty);
    }

    return [...map.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [packageRows]);

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card title="Sales Analytics" className="min-w-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">From Date</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">To Date</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Buyer / Member</span>
            <input
              type="text"
              placeholder="Search buyer or member"
              value={filters.buyer}
              onChange={(e) => setFilters({ ...filters, buyer: e.target.value })}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Package Type</span>
            <input
              type="text"
              placeholder="e.g. Package 1"
              value={filters.packageType}
              onChange={(e) =>
                setFilters({ ...filters, packageType: e.target.value })
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1 xl:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Product</span>
            <input
              type="text"
              placeholder="Search product"
              value={filters.product}
              onChange={(e) =>
                setFilters({ ...filters, product: e.target.value })
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            onClick={() => loadSales(filters)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            onClick={() => {
              const cleared = {
                from: "",
                to: "",
                buyer: "",
                packageType: "",
                product: "",
              };
              setFilters(cleared);
              loadSales(cleared);
            }}
            disabled={loading}
          >
            Clear
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Stat
          label="Total Sales Amount"
          value={formatMoney(totalSalesAmount)}
          hint="Approved regular + package sales only"
        />
        <Stat label="Total Packages Sold" value={String(totalPackagesSold)} />
        <Stat label="Total Products Sold" value={String(totalProductsSold)} />
        <Stat label="Total Buyers / Members" value={String(totalBuyers)} />
      </div>

      <Card title="Membership Package Purchases" className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Member Name</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Package</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Amount</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Encoded By</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Regional Manager</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackageRows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-700">{fmtDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-800">{row.member_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.product_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatMoney(row.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{row.encoded_by || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.regional_manager || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.status || "-"}</td>
                </tr>
              ))}

              {filteredPackageRows.length === 0 && (
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-500" colSpan={7}>
                    No package purchase data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Regular Sales Transactions" className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Buyer / Member</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Product</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Qty</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Amount</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Encoded By</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {regularSalesRows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-700">{fmtDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-800">{row.member_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.product_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.quantity ?? 0}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatMoney(row.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{row.encoded_by || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.status || "-"}</td>
                </tr>
              ))}

              {regularSalesRows.length === 0 && (
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-500" colSpan={7}>
                    No sales transaction data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Top Products" className="min-w-0">
          {topProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No approved product sales yet.
            </div>
          ) : (
            <div className="grid gap-2">
              {topProducts.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-800">{item.name}</span>
                  <span className="font-semibold text-zinc-900">{item.qty}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Top Packages" className="min-w-0">
          {topPackages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No approved package sales yet.
            </div>
          ) : (
            <div className="grid gap-2">
              {topPackages.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-800">{item.name}</span>
                  <span className="font-semibold text-zinc-900">{item.qty}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
