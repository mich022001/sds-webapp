import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Gift,
  PieChart,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  WalletCards,
  XCircle,
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

function fmtQty(value) {
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

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      {label ? (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}

      <textarea
        {...props}
        className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
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

function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>

          {helper ? (
            <div className="mt-1 text-xs text-slate-500">{helper}</div>
          ) : null}
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  const className =
    value === "pending"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : value === "approved"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : value === "released"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : value === "rejected"
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
        className
      )}
    >
      {status || "-"}
    </span>
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

function SimpleBarChart({ rows, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const percent = Math.max(
          5,
          Math.round((Number(row.value || 0) / max) * 100)
        );

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
                <div className="text-xs text-slate-500">{row.helper}</div>
              </div>

              <div className="shrink-0 text-sm font-black text-slate-950">
                {fmtQty(row.value)}
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cls("h-full rounded-full", row.barClass)}
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
    .map((row) => {
      const value = Number(row.value || 0);
      const start = total > 0 ? (running / total) * 100 : 0;
      running += value;
      const end = total > 0 ? (running / total) * 100 : 0;
      return `${row.hex} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div
        className="mx-auto h-52 w-52 rounded-full border border-slate-200 shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
      />

      <div className="space-y-3">
        {rows.map((row, index) => {
          const percent = total > 0 ? (Number(row.value || 0) / total) * 100 : 0;

          return (
            <div
              key={`${row.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cls("h-3 w-3 shrink-0 rounded-full", row.dotClass)} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-950">
                    {row.name}
                  </div>
                  <div className="text-xs text-slate-500">{row.helper}</div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-black text-slate-950">
                  {fmtQty(row.value)}
                </div>
                <div className="text-xs text-slate-500">
                  {percent.toFixed(1)}%
                </div>
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
  if (!rows.length) return;

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

function countBy(rows, key, fallback = "Unknown") {
  const map = new Map();

  rows.forEach((row) => {
    const name = String(row[key] || "").trim() || fallback;
    const current = map.get(name) || {
      name,
      value: 0,
      count: 0,
    };

    map.set(name, {
      ...current,
      value: current.value + Number(row.qty || 0),
      count: current.count + 1,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

export default function Redemptions({ user }) {
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    redeemType: "",
    memberName: "",
  });

  const [form, setForm] = useState({
    redeemType: "Cash",
    qty: "",
    notes: "",
  });

  const [chartTypes, setChartTypes] = useState({
    status: "bar",
    type: "bar",
  });

  const [adminNotesById, setAdminNotesById] = useState({});
  const [openActionId, setOpenActionId] = useState(null);

  const canSubmit = !isAdmin;

  async function loadRows(currentFilters = filters) {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();

      if (currentFilters.status) qs.set("status", currentFilters.status);
      if (currentFilters.redeemType) {
        qs.set("redeem_type", currentFilters.redeemType);
      }
      if (isAdmin && currentFilters.memberName.trim()) {
        qs.set("member_name", currentFilters.memberName.trim());
      }

      const res = await fetch(`/api/redemptions?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load redemptions");

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load redemptions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.redeemType, filters.memberName, isAdmin]);

  const summary = useMemo(() => {
    const statusCounts = {
      pending: 0,
      approved: 0,
      released: 0,
      rejected: 0,
    };

    const typeCounts = {
      Cash: 0,
      Product: 0,
    };

    rows.forEach((row) => {
      const status = String(row.status || "").toLowerCase();
      const type = String(row.redeem_type || "");

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      if (typeCounts[type] !== undefined) {
        typeCounts[type] += Number(row.qty || 0);
      }
    });

    return {
      ...statusCounts,
      cashQty: typeCounts.Cash,
      productQty: typeCounts.Product,
      totalRows: rows.length,
    };
  }, [rows]);

  const statusChartRows = useMemo(
    () => [
      {
        name: "Pending",
        value: summary.pending,
        helper: "Awaiting approval",
        hex: "#eab308",
        barClass: "bg-yellow-500",
        dotClass: "bg-yellow-500",
      },
      {
        name: "Approved",
        value: summary.approved,
        helper: "Approved but not released",
        hex: "#2563eb",
        barClass: "bg-blue-600",
        dotClass: "bg-blue-600",
      },
      {
        name: "Released",
        value: summary.released,
        helper: "Completed redemptions",
        hex: "#059669",
        barClass: "bg-emerald-600",
        dotClass: "bg-emerald-600",
      },
      {
        name: "Rejected",
        value: summary.rejected,
        helper: "Rejected requests",
        hex: "#dc2626",
        barClass: "bg-red-600",
        dotClass: "bg-red-600",
      },
    ].filter((row) => row.value > 0),
    [summary]
  );

  const typeChartRows = useMemo(() => {
    const grouped = countBy(rows, "redeem_type", "Unknown Type");

    const colors = {
      Cash: {
        hex: "#2563eb",
        barClass: "bg-blue-600",
        dotClass: "bg-blue-600",
      },
      Product: {
        hex: "#eab308",
        barClass: "bg-yellow-500",
        dotClass: "bg-yellow-500",
      },
    };

    return grouped.map((row, index) => {
      const fallbackColors = [
        {
          hex: "#475569",
          barClass: "bg-slate-600",
          dotClass: "bg-slate-600",
        },
        {
          hex: "#7c3aed",
          barClass: "bg-violet-600",
          dotClass: "bg-violet-600",
        },
      ];

      const color = colors[row.name] || fallbackColors[index % fallbackColors.length];

      return {
        ...row,
        ...color,
        helper: `${row.count} records`,
      };
    });
  }, [rows]);

  function clearFilters() {
    const cleared = {
      status: "",
      redeemType: "",
      memberName: "",
    };

    setFilters(cleared);
    loadRows(cleared);
  }

  function updateChartType(key, value) {
    setChartTypes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const qtyNum = Number(form.qty);

    if (!form.redeemType) {
      alert("Please select redemption type.");
      return;
    }

    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redeem_type: form.redeemType,
          qty: qtyNum,
          notes: form.notes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to submit redemption");

      setForm({
        redeemType: "Cash",
        qty: "",
        notes: "",
      });

      await loadRows();
    } catch (e) {
      setErr(e?.message || "Failed to submit redemption");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminAction(id, action) {
    try {
      setSaving(true);
      setErr("");

      const res = await fetch("/api/redemptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          admin_notes: adminNotesById[id] || "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to update redemption");

      setOpenActionId(null);
      await loadRows();
    } catch (e) {
      setErr(e?.message || "Failed to update redemption");
    } finally {
      setSaving(false);
    }
  }

  function exportRedemptions() {
    exportRowsCsv(
      "redemptions",
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "member_id", label: "Member ID" },
        { key: "membership_type", label: "Membership Type" },
        { key: "regional_manager", label: "Regional Manager" },
        { key: "type", label: "Type" },
        { key: "qty", label: "Qty / Amount" },
        { key: "status", label: "Status" },
        { key: "notes", label: "Notes" },
        { key: "admin_notes", label: "Admin Notes" },
        { key: "requested_by", label: "Requested By" },
        { key: "approved_by", label: "Approved By" },
        { key: "released_by", label: "Released By" },
        { key: "rejected_by", label: "Rejected By" },
      ],
      rows.map((row) => ({
        date: fmtDate(row.created_at),
        member: row.member_name || "",
        member_id: row.member_id || "",
        membership_type: row.membership_type || "",
        regional_manager: row.regional_manager || "",
        type: row.redeem_type || "",
        qty: fmtQty(row.qty),
        status: row.status || "",
        notes: row.notes || "",
        admin_notes: row.admin_notes || "",
        requested_by: row.requested_by || "",
        approved_by: row.approved_by || "",
        released_by: row.released_by || "",
        rejected_by: row.rejected_by || "",
      }))
    );
  }

  function canApprove(row) {
    return String(row.status || "").toLowerCase() === "pending";
  }

  function canRelease(row) {
    return ["pending", "approved"].includes(String(row.status || "").toLowerCase());
  }

  function canReject(row) {
    return ["pending", "approved"].includes(String(row.status || "").toLowerCase());
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Redemption Center
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {isAdmin ? "Manage Redemptions" : "My Redemptions"}
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                {isAdmin
                  ? "Review member redemption requests, approve, release, reject, export records, and monitor payout movement."
                  : "Submit redemption requests and track your pending, approved, released, or rejected requests."}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <Gift size={22} />
            </div>
          </div>
        </div>
      </div>

      {canSubmit ? (
        <SectionCard
          title="Submit Redemption Request"
          subtitle="Request cash or product redemption from your available balance."
          icon={Send}
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Redemption Type"
                value={form.redeemType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, redeemType: e.target.value }))
                }
              >
                <option value="Cash">Cash</option>
                <option value="Product">Product</option>
              </Select>

              <Input
                label={form.redeemType === "Cash" ? "Cash Amount" : "Product Quantity"}
                type="number"
                min="0.01"
                step="0.01"
                value={form.qty}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, qty: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Optional notes"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
              >
                <Send size={16} />
                {saving ? "Saving..." : "Submit Redemption"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending"
          value={summary.pending}
          helper="Needs admin review"
          icon={WalletCards}
          tone="gold"
        />

        <StatCard
          label="Approved"
          value={summary.approved}
          helper="Approved but unreleased"
          icon={ShieldCheck}
          tone="blue"
        />

        <StatCard
          label="Released"
          value={summary.released}
          helper="Completed redemptions"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="Rejected"
          value={summary.rejected}
          helper={`${summary.totalRows} total records`}
          icon={XCircle}
          tone="red"
        />
      </div>

      <SectionCard
        title="Redemption Filters"
        subtitle="Filter redemption records by status, type, and member name."
        icon={Search}
        right={
          <button
            type="button"
            disabled={!rows.length}
            onClick={exportRedemptions}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
          </Select>

          <Select
            label="Type"
            value={filters.redeemType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, redeemType: e.target.value }))
            }
          >
            <option value="">All</option>
            <option value="Cash">Cash</option>
            <option value="Product">Product</option>
          </Select>

          {isAdmin ? (
            <Input
              label="Member Name"
              value={filters.memberName}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, memberName: e.target.value }))
              }
              placeholder="Search member"
            />
          ) : null}

          <div className="flex items-end">
            <button
              type="button"
              disabled={loading}
              onClick={clearFilters}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw size={16} />
              Clear
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Status Distribution"
          subtitle="Redemption request count by current workflow status."
          icon={BarChart3}
          right={
            <ChartToggle
              value={chartTypes.status}
              onChange={(value) => updateChartType("status", value)}
            />
          }
        >
          {loading ? (
            <EmptyState>Loading status chart...</EmptyState>
          ) : (
            <ReportChart
              rows={statusChartRows}
              type={chartTypes.status}
              emptyText="No status chart data found."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Type Distribution"
          subtitle="Total requested quantity or amount grouped by redemption type."
          icon={PieChart}
          right={
            <ChartToggle
              value={chartTypes.type}
              onChange={(value) => updateChartType("type", value)}
            />
          }
        >
          {loading ? (
            <EmptyState>Loading type chart...</EmptyState>
          ) : (
            <ReportChart
              rows={typeChartRows}
              type={chartTypes.type}
              emptyText="No type chart data found."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={isAdmin ? "Redemption Records" : "My Redemption History"}
        subtitle={`${rows.length} redemption records loaded.`}
        icon={WalletCards}
      >
        {loading ? (
          <EmptyState>Loading redemptions...</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No redemption records found.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Date",
                    "Member",
                    "Type",
                    "Qty / Amount",
                    "Status",
                    "Notes",
                    "Admin Notes",
                    ...(isAdmin ? ["Actions"] : []),
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
                {rows.map((row) => {
                  const isOpen = openActionId === row.id;

                  return (
                    <>
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 align-top transition hover:bg-slate-50"
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
                          {row.redeem_type || "-"}
                        </td>

                        <td className="px-4 py-4 font-black text-slate-950">
                          {fmtQty(row.qty)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={row.status} />
                        </td>

                        <td className="max-w-[220px] px-4 py-4 text-slate-700">
                          <div className="line-clamp-2">{row.notes || "-"}</div>
                        </td>

                        <td className="max-w-[240px] px-4 py-4 text-slate-700">
                          <div className="line-clamp-2">
                            {row.admin_notes || "-"}
                          </div>
                        </td>

                        {isAdmin ? (
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionId((prev) =>
                                  prev === row.id ? null : row.id
                                )
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              {isOpen ? "Close" : "Manage"}
                            </button>
                          </td>
                        ) : null}
                      </tr>

                      {isAdmin && isOpen ? (
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
                              <Textarea
                                label="Admin Notes"
                                value={adminNotesById[row.id] ?? row.admin_notes ?? ""}
                                onChange={(e) =>
                                  setAdminNotesById((prev) => ({
                                    ...prev,
                                    [row.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional admin notes"
                              />

                              <div className="flex flex-wrap items-end gap-2">
                                <button
                                  type="button"
                                  disabled={saving || !canApprove(row)}
                                  onClick={() => handleAdminAction(row.id, "approve")}
                                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={saving || !canRelease(row)}
                                  onClick={() => handleAdminAction(row.id, "release")}
                                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Release
                                </button>

                                <button
                                  type="button"
                                  disabled={saving || !canReject(row)}
                                  onClick={() => handleAdminAction(row.id, "reject")}
                                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
