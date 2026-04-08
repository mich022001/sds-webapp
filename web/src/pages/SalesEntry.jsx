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

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-1", className)}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
      />
    </label>
  );
}

function Select({ label, children, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-1", className)}>
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

function Textarea({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-1", className)}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <textarea
        {...props}
        className="min-h-[88px] w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-900"
      />
    </label>
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

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const className =
    s === "pending"
      ? "bg-amber-100 text-amber-800"
      : s === "approved"
        ? "bg-blue-100 text-blue-800"
        : s === "paid"
          ? "bg-purple-100 text-purple-800"
          : s === "released"
            ? "bg-emerald-100 text-emerald-800"
            : s === "rejected"
              ? "bg-red-100 text-red-800"
              : s === "cancelled"
                ? "bg-zinc-200 text-zinc-700"
                : "bg-zinc-100 text-zinc-700";

  return (
    <span
      className={cls(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        className
      )}
    >
      {status || "-"}
    </span>
  );
}

function normalizeMembershipType(v) {
  return String(v || "").trim().toLowerCase();
}

function getPricingBasis(membershipType) {
  const mt = normalizeMembershipType(membershipType);

  if (mt === "stockiest") return "Stockiest";
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return "Distributor";
  }
  if (mt === "member") return "Member";
  return "SRP";
}

function getUnitPrice(item, membershipType) {
  if (!item) return 0;

  const mt = normalizeMembershipType(membershipType);

  if (mt === "stockiest") return Number(item.stockiest_price ?? 0);
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return Number(item.distributor_price ?? 0);
  }
  if (mt === "member") return Number(item.member_price ?? 0);

  return Number(item.srp_price ?? 0);
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

export default function SalesEntry({ user }) {
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [linkedMember, setLinkedMember] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [queueRows, setQueueRows] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isRestricted = user?.role === "rm" || user?.role === "normal";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [form, setForm] = useState({
    memberName: "",
    memberId: "",
    membershipType: "SRP",
    itemType: "",
    itemId: "",
    unitType: "Per Piece",
    quantity: 1,
  });

  const [cancelRowId, setCancelRowId] = useState(null);
  const [cancelReasonById, setCancelReasonById] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadLinkedMember() {
      if (!isRestricted) {
        setLinkedMember(null);
        setLoadingMembers(false);
        return;
      }

      if (!user?.member_id) {
        setErr("Your account is not linked to a member. Contact admin.");
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const res = await fetch(
          `/api/members?member_id=${encodeURIComponent(user.member_id)}`
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || "Failed to load linked member");
        }

        const row = Array.isArray(json?.data) ? json.data[0] : null;

        if (!cancelled) {
          setLinkedMember(row || null);
          setForm((prev) => ({
            ...prev,
            memberName: row?.name || "",
            memberId: row?.member_id || "",
            membershipType: row?.membership_type || "Member",
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load linked member");
        }
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    async function loadMembersForAdmin() {
      try {
        setLoadingMembers(true);
        const res = await fetch("/api/members");
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || "Failed to load members");
        }

        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) {
          setMembers(data);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load members");
        }
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    if (isRestricted) {
      loadLinkedMember();
    } else {
      loadMembersForAdmin();
    }

    return () => {
      cancelled = true;
    };
  }, [isRestricted, user?.member_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        setLoadingItems(true);

        const res = await fetch("/api/products");
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!res.ok) {
          throw new Error(json.error || "Failed to load items");
        }

        if (!cancelled) {
          setItems(data);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load items");
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/sales");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load sales history");
      }

      setHistoryRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load sales history");
    } finally {
      setLoadingHistory(false);
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

      if (!res.ok) {
        throw new Error(json.error || "Failed to load sales queue");
      }

      setQueueRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load sales queue");
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    loadHistory();
    loadQueue();
  }, [isAdmin]);

  const selectedMember = useMemo(() => {
    if (isRestricted) return linkedMember;
    return members.find((m) => m.name === form.memberName) || null;
  }, [members, form.memberName, isRestricted, linkedMember]);

  useEffect(() => {
    if (!selectedMember) {
      if (!isRestricted) {
        setForm((prev) => ({
          ...prev,
          memberId: "",
          membershipType: "SRP",
        }));
      }
      return;
    }

    setForm((prev) => ({
      ...prev,
      memberId: selectedMember.member_id || "",
      membershipType: selectedMember.membership_type || "Member",
    }));
  }, [selectedMember, isRestricted]);

  const filteredItems = useMemo(() => {
    if (!form.itemType) return items;
    return items.filter(
      (item) =>
        String(item.item_type || "").trim().toLowerCase() === form.itemType
    );
  }, [items, form.itemType]);

  const selectedItem = useMemo(() => {
    const selectedId = Number(form.itemId);
    if (!Number.isFinite(selectedId) || selectedId <= 0) return null;
    return items.find((p) => Number(p.id) === selectedId) || null;
  }, [items, form.itemId]);

  useEffect(() => {
    if (!selectedItem) return;

    setForm((prev) => ({
      ...prev,
      unitType:
        selectedItem.unit_type ||
        (String(selectedItem.item_type).toLowerCase() === "package"
          ? "Package"
          : "Per Piece"),
    }));
  }, [selectedItem]);

  const quantityNum = Math.max(1, Number(form.quantity || 1));
  const unitPrice = getUnitPrice(selectedItem, form.membershipType);
  const totalAmount = unitPrice * quantityNum;
  const pricingBasis = getPricingBasis(form.membershipType);

  async function handleCheckout(e) {
    e.preventDefault();

    if (!form.memberName) {
      alert("Member information is missing.");
      return;
    }

    if (!form.itemId) {
      alert("Please select an item.");
      return;
    }

    if (quantityNum < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          member_name: form.memberName,
          member_id: form.memberId || "",
          membership_type: form.membershipType || "",
          regional_manager: selectedMember?.regional_manager || "",
          item_id: Number(form.itemId),
          item_type: selectedItem?.item_type || "",
          product_name: selectedItem?.item_name || "",
          unit_price: unitPrice,
          total_amount: totalAmount,
          quantity: quantityNum,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to save sale");
      }

      alert(json.message || "Sale saved successfully.");
      clearForm();
      await loadHistory();
      await loadQueue();
    } catch (e) {
      setErr(e?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
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
        body: JSON.stringify({
          id,
          action,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to update sale");
      }

      alert(json.message || "Sale updated successfully.");
      await loadHistory();
      await loadQueue();
    } catch (e) {
      setErr(e?.message || "Failed to update sale");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSale(id) {
    const reason = String(cancelReasonById[id] || "").trim();

    if (!reason) {
      alert("Please provide a cancel reason.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const res = await fetch("/api/sales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action: "cancel",
          cancel_reason: reason,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to cancel sale");
      }

      alert(json.message || "Sale request cancelled successfully.");
      setCancelRowId(null);
      setCancelReasonById((prev) => ({ ...prev, [id]: "" }));
      await loadHistory();
      await loadQueue();
    } catch (e) {
      setErr(e?.message || "Failed to cancel sale");
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setForm((prev) => ({
      ...prev,
      memberName: isRestricted ? linkedMember?.name || "" : "",
      memberId: isRestricted ? linkedMember?.member_id || "" : "",
      membershipType: isRestricted
        ? linkedMember?.membership_type || "Member"
        : "SRP",
      itemType: "",
      itemId: "",
      unitType: "Per Piece",
      quantity: 1,
    }));
  }

  function renderAdminActions(row) {
    const status = String(row.status || "").toLowerCase();

    if (status === "pending") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "approve")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
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
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Mark Paid
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
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
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Release
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQueueAction(row.id, "reject")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      );
    }

    return <div className="text-xs text-zinc-500">No actions</div>;
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card
        title={isRestricted ? "Submit Sale Request" : "Sales Entry"}
        right={
          isRestricted ? (
            <div className="text-xs text-zinc-500">
              Packages are auto-approved. Regular product sales require admin
              approval.
            </div>
          ) : null
        }
        className="min-w-0"
      >
        <form className="grid gap-4" onSubmit={handleCheckout}>
          <div className="grid gap-3 md:grid-cols-2">
            {isRestricted ? (
              <Input
                label="Member Name"
                value={form.memberName}
                readOnly
                disabled
              />
            ) : (
              <Select
                label="Member Name"
                value={form.memberName}
                disabled={loadingMembers}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, memberName: e.target.value }))
                }
              >
                <option value="">
                  {loadingMembers ? "Loading members..." : "Select member"}
                </option>
                {members.map((m) => (
                  <option key={m.member_id || m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </Select>
            )}

            <Input
              label="Member ID"
              value={form.memberId}
              readOnly
              disabled
              placeholder="Auto-filled"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Membership Type"
              value={form.membershipType}
              readOnly
              disabled
              placeholder="Auto-filled"
            />

            <Input
              label="Unit Type"
              value={form.unitType}
              readOnly
              disabled
              placeholder="Auto-filled from item"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Item Type"
              value={form.itemType}
              disabled={loadingItems}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  itemType: e.target.value,
                  itemId: "",
                  unitType: "Per Piece",
                }))
              }
            >
              <option value="">
                {loadingItems ? "Loading items..." : "All"}
              </option>
              <option value="product">Product</option>
              <option value="package">Package</option>
            </Select>

            <Select
              label="Item Name"
              value={form.itemId}
              disabled={loadingItems}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, itemId: e.target.value }))
              }
            >
              <option value="">
                {loadingItems ? "Loading items..." : "Select item"}
              </option>
              {filteredItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.item_name} ({p.item_type})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Unit Price" value={unitPrice.toFixed(2)} />
            <Stat label="Total Amount" value={totalAmount.toFixed(2)} />
            <Stat
              label="Pricing Basis"
              value={pricingBasis}
              hint="Derived from membership type"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isRestricted
                  ? "Submit Sale Request"
                  : "Proceed Checkout"}
            </button>

            <button
              type="button"
              onClick={clearForm}
              disabled={saving}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </Card>

      {isAdmin && (
        <Card title="Sales Approval Queue" className="min-w-0">
          {loadingQueue ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : queueRows.length === 0 ? (
            <div className="text-sm text-zinc-500">
              No sales waiting for action.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Date
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Member
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Item
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Type
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Qty
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Amount
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Requested By
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Status
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queueRows.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3 text-zinc-700">
                        {fmtDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-900">
                        <div className="font-medium">{row.member_name}</div>
                        <div className="text-xs text-zinc-500">
                          {row.member_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.product_name}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.item_type}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {Number(row.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.requested_by_username || row.encoded_by || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">{renderAdminActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card title="Sales History" className="min-w-0">
        {loadingHistory ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : historyRows.length === 0 ? (
          <div className="text-sm text-zinc-500">No sales found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Date
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Member
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Item
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Type
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Qty
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Amount
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Encoded By
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Status
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Cancel Reason
                  </th>
                  {isRestricted && (
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      User Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => {
                  const isPending = String(row.status || "").toLowerCase() === "pending";
                  const canCancel = isRestricted && isPending;

                  return (
                    <tr key={row.id} className="border-b border-zinc-100 align-top">
                      <td className="px-4 py-3 text-zinc-700">
                        {fmtDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-900">
                        <div className="font-medium">{row.member_name}</div>
                        <div className="text-xs text-zinc-500">
                          {row.member_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.product_name}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.item_type}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.quantity}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {Number(row.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {Number(row.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.encoded_by || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.cancel_reason || "-"}
                      </td>

                      {isRestricted && (
                        <td className="px-4 py-3">
                          {canCancel ? (
                            <div className="grid gap-2">
                              {cancelRowId === row.id ? (
                                <>
                                  <Textarea
                                    label="Reason"
                                    value={cancelReasonById[row.id] || ""}
                                    onChange={(e) =>
                                      setCancelReasonById((prev) => ({
                                        ...prev,
                                        [row.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Why are you cancelling this request?"
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => handleCancelSale(row.id)}
                                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      Confirm Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => {
                                        setCancelRowId(null);
                                        setCancelReasonById((prev) => ({
                                          ...prev,
                                          [row.id]: "",
                                        }));
                                      }}
                                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => setCancelRowId(row.id)}
                                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500">No action</div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Item Price Reference" className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Item</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">SRP</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">
                  Member
                </th>
                <th className="px-4 py-2 font-semibold text-zinc-700">
                  Distributor
                </th>
                <th className="px-4 py-2 font-semibold text-zinc-700">
                  Stockiest
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingItems ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={6}>
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={6}>
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-700">{p.item_type}</td>
                    <td className="px-4 py-3 text-zinc-800">{p.item_name}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(p.srp_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(p.member_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(p.distributor_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(p.stockiest_price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
