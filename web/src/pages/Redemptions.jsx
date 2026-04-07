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

function Input({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <textarea
        {...props}
        className="min-h-[88px] w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-900"
      />
    </label>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const className =
    s === "pending"
      ? "bg-amber-100 text-amber-800"
      : s === "approved"
        ? "bg-blue-100 text-blue-800"
        : s === "released"
          ? "bg-emerald-100 text-emerald-800"
          : s === "rejected"
            ? "bg-red-100 text-red-800"
            : "bg-zinc-100 text-zinc-700";

  return (
    <span className={cls("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {status || "-"}
    </span>
  );
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function fmtQty(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
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

  const [adminNotesById, setAdminNotesById] = useState({});

  async function loadRows() {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.redeemType) qs.set("redeem_type", filters.redeemType);
      if (isAdmin && filters.memberName.trim()) {
        qs.set("member_name", filters.memberName.trim());
      }

      const res = await fetch(`/api/redemptions?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load redemptions");
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load redemptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.redeemType, filters.memberName, isAdmin]);

  const canSubmit = useMemo(() => !isAdmin, [isAdmin]);

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

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit redemption");
      }

      alert("Redemption request submitted successfully.");
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

      if (!res.ok) {
        throw new Error(json.error || "Failed to update redemption");
      }

      await loadRows();
    } catch (e) {
      setErr(e?.message || "Failed to update redemption");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      {canSubmit && (
        <Card title="Submit Redemption Request">
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Redemption Type"
                value={form.redeemType}
                onChange={(e) => setForm({ ...form, redeemType: e.target.value })}
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
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </div>

            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Submit Redemption"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title={isAdmin ? "Manage Redemptions" : "My Redemption History"}
        right={
          <div className="grid gap-2 md:grid-cols-3">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                setFilters({ ...filters, redeemType: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="Product">Product</option>
            </Select>

            {isAdmin && (
              <Input
                label="Member Name"
                value={filters.memberName}
                onChange={(e) =>
                  setFilters({ ...filters, memberName: e.target.value })
                }
                placeholder="Search member"
              />
            )}
          </div>
        }
      >
        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-zinc-500">No redemption records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Qty</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Status</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Notes</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Admin Notes</th>
                  {isAdmin && (
                    <th className="px-4 py-2 font-semibold text-zinc-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 align-top">
                    <td className="px-4 py-3 text-zinc-700">{fmtDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-zinc-800">
                      <div className="font-medium">{row.member_name}</div>
                      <div className="text-xs text-zinc-500">{row.member_id}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.redeem_type}</td>
                    <td className="px-4 py-3 text-zinc-700">{fmtQty(row.qty)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.notes || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {isAdmin ? (
                        <Textarea
                          label=""
                          value={adminNotesById[row.id] ?? row.admin_notes ?? ""}
                          onChange={(e) =>
                            setAdminNotesById((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional admin notes"
                        />
                      ) : (
                        row.admin_notes || "-"
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving || row.status === "approved" || row.status === "released" || row.status === "rejected"}
                            onClick={() => handleAdminAction(row.id, "approve")}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={saving || row.status === "released" || row.status === "rejected"}
                            onClick={() => handleAdminAction(row.id, "release")}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                          >
                            Release
                          </button>

                          <button
                            type="button"
                            disabled={saving || row.status === "released" || row.status === "rejected"}
                            onClick={() => handleAdminAction(row.id, "reject")}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
