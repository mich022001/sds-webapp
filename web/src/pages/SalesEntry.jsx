import { useEffect, useMemo, useState } from "react";
import { Package, Search, ShoppingCart } from "lucide-react";

import SalesCatalog from "../components/sales/SalesCatalog";
import {
  Input,
  Select,
  cls,
  fmtAmount,
  getPricingBasis,
  getUnitPrice,
} from "../components/sales/SalesUI";

export default function SalesEntry({ user }) {
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [linkedMember, setLinkedMember] = useState(null);

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [itemTypeFilter, setItemTypeFilter] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const isRestricted = user?.role === "rm" || user?.role === "normal";

  const [form, setForm] = useState({
    memberName: "",
    memberId: "",
    membershipType: "SRP",
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
          setForm({
            memberName: row?.name || "",
            memberId: row?.member_id || "",
            membershipType: row?.membership_type || "Member",
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load linked member");
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

        if (!cancelled) {
          setMembers(Array.isArray(json?.data) ? json.data : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    if (isRestricted) loadLinkedMember();
    else loadMembersForAdmin();

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

        if (!res.ok) {
          throw new Error(json.error || "Failed to load items");
        }

        if (!cancelled) {
          setItems(Array.isArray(json?.data) ? json.data : []);
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
    return members.find((member) => member.name === form.memberName) || null;
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

  const visibleItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();

    return items.filter((item) => {
      const type = String(item.item_type || "").trim().toLowerCase();
      const name = String(item.item_name || "").toLowerCase();
      const code = String(item.item_code || "").toLowerCase();

      return (
        (!itemTypeFilter || type === itemTypeFilter) &&
        (!q || name.includes(q) || code.includes(q))
      );
    });
  }, [items, itemTypeFilter, itemSearch]);

  const selectedItem = useMemo(() => {
    const id = Number(selectedItemId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return items.find((item) => Number(item.id) === id) || null;
  }, [items, selectedItemId]);

  const quantityNum = Math.max(1, Number(quantity || 1));
  const unitPrice = getUnitPrice(selectedItem, form.membershipType);
  const totalAmount = unitPrice * quantityNum;
  const pricingBasis = getPricingBasis(form.membershipType);

  function handleSelectItem(item) {
    if (!isRestricted && !form.memberName) {
      alert("Please select a member before adding an item.");
      return;
    }

    setSelectedItemId(String(item.id));
    setQuantity(1);
  }

  function clearSelection() {
    setSelectedItemId("");
    setQuantity(1);
  }

  async function handleCheckout(e) {
    e.preventDefault();

    if (!form.memberName) {
      alert("Member information is missing.");
      return;
    }

    if (!selectedItem) {
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
          item_id: Number(selectedItem.id),
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
      clearSelection();
    } catch (e) {
      setErr(e?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Sales Operations
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Sales Entry & Checkout
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Browse products and packages, select an item, and checkout sales.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <ShoppingCart size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Package size={18} />
                </div>

                <div>
                  <div className="font-bold text-slate-950">Product Catalog</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-slate-900">
                      {visibleItems.length}
                    </span>{" "}
                    items.
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
                <Select
                  label="Type"
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="product">Products</option>
                  <option value="package">Packages</option>
                </Select>

                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
                  />
                  <Input
                    label="Search"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search item"
                    className="[&_input]:pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {err && (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Error: {err}
              </div>
            )}

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {isRestricted ? (
                <Input label="Member Name" value={form.memberName} readOnly disabled />
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
                  {members.map((member) => (
                    <option key={member.member_id || member.name} value={member.name}>
                      {member.name}
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

              <Input
                label="Pricing Basis"
                value={`${form.membershipType || "SRP"} / ${pricingBasis}`}
                readOnly
                disabled
              />
            </div>

            {loadingItems ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
                Loading products and packages...
              </div>
            ) : (
              <SalesCatalog
                items={visibleItems}
                membershipType={form.membershipType}
                selectedItemId={selectedItemId}
                onSelect={handleSelectItem}
              />
            )}
          </div>
        </div>

        <form
          onSubmit={handleCheckout}
          className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShoppingCart size={18} />
              </div>

              <div>
                <div className="font-bold text-slate-950">Checkout Summary</div>
                <div className="mt-1 text-sm text-slate-500">
                  Review selected item before checkout.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            {selectedItem ? (
              <>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="font-black text-slate-950">
                    {selectedItem.item_name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedItem.item_code || "-"} · {selectedItem.item_type || "-"}
                  </div>
                </div>

                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="font-bold text-slate-500">Unit Price</span>
                    <span className="font-black text-slate-900">
                      ₱{fmtAmount(unitPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="font-bold text-slate-500">Total</span>
                    <span className="font-black text-slate-900">
                      ₱{fmtAmount(totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="font-bold text-slate-500">Basis</span>
                    <span className="font-black text-slate-900">
                      {pricingBasis}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={cls(
                    "h-12 rounded-2xl bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800",
                    saving && "cursor-not-allowed opacity-60"
                  )}
                >
                  {saving
                    ? "Saving..."
                    : isRestricted
                      ? "Submit Sale Request"
                      : "Checkout"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={clearSelection}
                  className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                Select a product or package from the catalog.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
