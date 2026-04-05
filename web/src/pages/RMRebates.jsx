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

function formatMoney(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
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
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRebate = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.rebate || 0), 0);
  }, [rows]);

  const totalQty = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  }, [rows]);

  const uniqueReceivers = useMemo(() => {
    return new Set(
      rows.map((row) => String(row.receiver_name || "").trim()).filter(Boolean)
    ).size;
  }, [rows]);

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card title="RM Rebates Ledger" className="min-w-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Receiver Name</span>
            <input
              type="text"
              placeholder="Search regional manager"
              value={filters.receiver}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, receiver: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Buyer Name</span>
            <input
              type="text"
              placeholder="Search buyer"
              value={filters.buyer}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, buyer: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Product</span>
            <input
              type="text"
              placeholder="Search product"
              value={filters.product}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, product: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">From Date</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, from: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">To Date</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={cls(
              "h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800",
              loading && "opacity-60"
            )}
            onClick={() => loadData(filters)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            onClick={() => {
              const cleared = {
                receiver: "",
                buyer: "",
                product: "",
                from: "",
                to: "",
              };
              setFilters(cleared);
              loadData(cleared);
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

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Rebate Amount" value={formatMoney(totalRebate)} />
        <Stat label="Total Quantity" value={String(totalQty)} />
        <Stat label="Receivers Count" value={String(uniqueReceivers)} />
      </div>

      <Card title={`RM Rebates (${rows.length})`} className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Receiver</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Buyer</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Product</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Qty</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Unit Type</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Rebate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-700">{row.created_at || "-"}</td>
                  <td className="px-4 py-3 text-zinc-800">{row.receiver_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.buyer_name || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.product || "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.qty ?? 0}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.unit_type || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {formatMoney(row.rebate)}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-500" colSpan={7}>
                    No RM rebate data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
