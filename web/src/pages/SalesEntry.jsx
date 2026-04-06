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

export default function SalesEntry({ user }) {
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [linkedMember, setLinkedMember] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isRestricted = user?.role === "rm" || user?.role === "normal";

  const [form, setForm] = useState({
    memberName: "",
    memberId: "",
    membershipType: "SRP",
    itemType: "",
    itemId: "",
    unitType: "Per Piece",
    quantity: 1,
  });

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
      (item) => String(item.item_type || "").trim().toLowerCase() === form.itemType
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
          item_id: Number(form.itemId),
          quantity: quantityNum,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to save sale");
      }

      alert(
        isRestricted
          ? "Sale request submitted successfully."
          : "Sale saved successfully."
      );
      clearForm();
    } catch (e) {
      setErr(e?.message || "Failed to save sale");
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

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card
        title={isRestricted ? "Submit Sale Request" : "Sales Entry"}
        right={
          isRestricted ? (
            <div className="text-xs text-zinc-500">
              Products and packages are both available here.
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

      <Card title="Item Price Reference" className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Item</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">SRP</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Distributor</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Stockiest</th>
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
