import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Package,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  Input,
  Select,
  StatCard,
  StatusBadge,
  cls,
  fmtAmount,
  fmtDate,
} from "../components/sales/SalesUI";

function PageHeader({ isAdmin }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
              Sales Intelligence
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Sales Analytics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Monitor total sales, approval queue, released transactions, product performance, and member sales activity."
                : "Review your own sales history, pending requests, released sales, and product activity."}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>
    </div>
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

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
      {text}
    </div>
  );
}

function buildTopRows(rows, key) {
  const map = new Map();

  rows.forEach((row) => {
    const name = String(row[key] || "Unknown").trim();
    const amount = Number(row.total_amount || 0);
    const qty = Number(row.quantity || 0);

    const current = map.get(name) || {
      name,
      amount: 0,
      qty: 0,
      count: 0,
    };

    map.set(name, {
      ...current,
      amount: current.amount + amount,
      qty: current.qty + qty,
      count: current.count + 1,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function TopList({ rows, emptyText }) {
  if (!rows.length) return <EmptyState text={emptyText} />;

  return (
    <div className="space-y-3">
      {rows.slice(0, 6).map((row, index) => (
        <div
          key={`${row.name}-${index}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xs font-black text-white">
              {index + 1}
            </div>

            <div className="min-w-0">
              <div className="truncate font-black text-slate-950">
                {row.name}
              </div>
              <div className="text-xs text-slate-500">
                {row.count} sales · {row.qty} qty
              </div>
            </div>
          </div>

          <div className="text-right font-black text-slate-950">
            ₱{fmtAmount(row.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SalesAnalytics({ user }) {
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [rows, setRows] = useState([]);
  const [queueRows, setQueueRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [filters, setFilters] = useState({
    buyer: "",
    product: "",
    status: "",
    item_type: "",
    from: "",
    to: "",
  });

  async function loadRows(currentFilters = filters) {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();

      if (currentFilters.buyer) qs.set("buyer", currentFilters.buyer);
      if (currentFilters.product) qs.set("product", currentFilters.product);
      if (currentFilters.status) qs.set("status", currentFilters.status);
      if (currentFilters.item_type) qs.set("item_type", currentFilters.item_type);
      if (currentFilters.from) qs.set("from", currentFilters.from);
      if (currentFilters.to) qs.set("to", currentFilters.to);

      const res = await fetch(`/api/sales?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load sales");

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load sales");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadQueue() {
    if (!isAdmin) {
      setQueueRows([]);
      return;
    }

    try {
      setLoadingQueue(true);

      const res = await fetch("/api/sales?status=queue");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load queue");

      setQueueRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load queue");
      setQueueRows([]);
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    loadRows();
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const analytics = useMemo(() => {
    const releasedRows = rows.filter(
      (row) => String(row.status || "").toLowerCase() === "released"
    );

    const pendingRows = rows.filter(
      (row) => String(row.status || "").toLowerCase() === "pending"
    );

    const rejectedRows = rows.filter(
      (row) => String(row.status || "").toLowerCase() === "rejected"
    );

    const cancelledRows = rows.filter(
      (row) => String(row.status || "").toLowerCase() === "cancelled"
    );

    const salesValue = rows.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );

    const releasedValue = releasedRows.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    );

    const totalQty = rows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );

    return {
      salesValue,
      releasedValue,
      totalQty,
      totalRows: rows.length,
      pending: pendingRows.length,
      released: releasedRows.length,
      rejected: rejectedRows.length,
      cancelled: cancelledRows.length,
      topProducts: buildTopRows(rows, "product_name"),
      topMembers: buildTopRows(rows, "member_name"),
    };
  }, [rows]);

  function clearFilters() {
    const cleared = {
      buyer: "",
      product: "",
      status: "",
      item_type: "",
      from: "",
      to: "",
    };

    setFilters(cleared);
    loadRows(cleared);
  }

  async function handleQueueAction(id, action) {
    try {
      setSaving(true);
      setErr("");

      const res = await fetch("/api/sales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to update sale");

      await loadRows();
      await loadQueue();
    } catch (e) {
      setErr(e?.message || "Failed to update sale");
    } finally {
      setSaving(false);
    }
  }

  function renderQueueActions(row) {
    const status = String(row.status || "").toLowerCase();

    if (status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "approve")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      );
    }

    if (status === "approved") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "paid")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            Mark Paid
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      );
    }

    if (status === "paid") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "release")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            Release
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      );
    }

    return <span className="text-xs text-slate-400">-</span>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <PageHeader isAdmin={isAdmin} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAdmin ? "Total Sales Value" : "My Sales Value"}
          value={`₱${fmtAmount(analytics.salesValue)}`}
          helper={`${analytics.totalRows} loaded sales`}
          icon={ReceiptText}
          tone="blue"
        />

        <StatCard
          label="Released Value"
          value={`₱${fmtAmount(analytics.releasedValue)}`}
          helper={`${analytics.released} released records`}
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="Pending"
          value={analytics.pending}
          helper={isAdmin ? "Needs review" : "Awaiting approval"}
          icon={Clock3}
          tone="gold"
        />

        <StatCard
          label="Quantity Sold"
          value={analytics.totalQty}
          helper="Total product movement"
          icon={ShoppingCart}
          tone="slate"
        />
      </div>

      <SectionCard
        title="Sales Filters"
        subtitle="Filter sales analytics by buyer, product, type, status, and date range."
        icon={Search}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {isAdmin ? (
            <Input
              label="Buyer"
              value={filters.buyer}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, buyer: e.target.value }))
              }
              placeholder="Search buyer"
            />
          ) : null}

          <Input
            label="Product"
            value={filters.product}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, product: e.target.value }))
            }
            placeholder="Search product"
          />

          <Select
            label="Item Type"
            value={filters.item_type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, item_type: e.target.value }))
            }
          >
            <option value="">All</option>
            <option value="product">Product</option>
            <option value="package">Package</option>
          </Select>

          <Select
            label="Status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, from: e.target.value }))
            }
          />

          <Input
            label="To"
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
            disabled={loading}
            onClick={() => loadRows(filters)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            <Search size={16} />
            Apply Filters
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

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Top Products"
          subtitle="Products ranked by sales value."
          icon={Package}
        >
          <TopList rows={analytics.topProducts} emptyText="No product data yet." />
        </SectionCard>

        <SectionCard
          title={isAdmin ? "Top Members" : "My Sales Buyers"}
          subtitle={
            isAdmin
              ? "Members ranked by sales value."
              : "Your member-linked sales activity."
          }
          icon={TrendingUp}
        >
          <TopList rows={analytics.topMembers} emptyText="No member data yet." />
        </SectionCard>
      </div>

      {isAdmin ? (
        <SectionCard
          title={`Approval Queue (${queueRows.length})`}
          subtitle="Pending, approved, and paid sales waiting for admin action."
          icon={Clock3}
        >
          {loadingQueue ? (
            <EmptyState text="Loading approval queue..." />
          ) : queueRows.length === 0 ? (
            <EmptyState text="No sales waiting for action." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {["Date", "Member", "Item", "Amount", "Status", "Action"].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {queueRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {fmtDate(row.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-950">
                          {row.member_name || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {row.member_id || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">
                          {row.product_name || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Qty {row.quantity ?? 0} · {row.item_type || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-black text-slate-950">
                        ₱{fmtAmount(row.total_amount)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={row.status} />
                      </td>

                      <td className="px-4 py-4">{renderQueueActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard
        title={isAdmin ? "Sales History" : "My Sales History"}
        subtitle={`Showing ${rows.length} sales records.`}
        icon={ReceiptText}
      >
        {loading ? (
          <EmptyState text="Loading sales history..." />
        ) : rows.length === 0 ? (
          <EmptyState text="No sales records found." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Date",
                    "Member",
                    "Product",
                    "Type",
                    "Qty",
                    "Amount",
                    "Context",
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
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(row.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-950">
                        {row.member_name || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.member_id || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      {row.product_name || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {row.item_type || "-"}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      {row.quantity ?? 0}
                    </td>

                    <td className="px-4 py-4 font-black text-slate-950">
                      ₱{fmtAmount(row.total_amount)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {row.sale_context || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
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
