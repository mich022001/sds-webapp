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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900"
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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
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
  const mt = String(membershipType || "").trim().toLowerCase();

  if (mt === "stockiest") return "Stockiest";
  if (mt === "distributor" || mt === "area manager" || mt === "regional manager") {
    return "Distributor";
  }
  if (mt === "member") return "Member";
  return "SRP";
}

function getUnitPrice(product, membershipType) {
  if (!product) return 0;

  const mt = String(membershipType || "").trim().toLowerCase();

  if (mt === "stockiest") return Number(product.stockiest_price ?? 0);
  if (mt === "distributor" || mt === "area manager" || mt === "regional manager") {
    return Number(product.distributor_price ?? 0);
  }
  if (mt === "member") return Number(product.member_price ?? 0);

  return Number(product.srp_price ?? 0);
}

export default function SalesEntry() {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    memberName: "",
    memberId: "",
    membershipType: "SRP",
    unitType: "Per Piece",
    productName: "",
    quantity: 1,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);

        const res = await fetch("/api/members/list");
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) {
          setMembers(data);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoadingProducts(true);

        const res = await fetch("/api/products?item_type=product");
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!res.ok) {
          throw new Error(json.error || "Failed to load products");
        }

        if (!cancelled) {
          setProducts(data);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load products");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMember = useMemo(() => {
    return members.find((m) => m.name === form.memberName) || null;
  }, [members, form.memberName]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.item_name === form.productName) || null;
  }, [products, form.productName]);

  useEffect(() => {
    if (!selectedMember) {
      setForm((prev) => ({
        ...prev,
        memberId: "",
        membershipType: "SRP",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      memberId: selectedMember.member_id || "",
      membershipType: selectedMember.membership_type || "Member",
    }));
  }, [selectedMember]);

  useEffect(() => {
    if (!selectedProduct) return;

    setForm((prev) => ({
      ...prev,
      unitType: selectedProduct.unit_type || "Per Piece",
    }));
  }, [selectedProduct]);

  const quantityNum = Math.max(1, Number(form.quantity || 1));
  const unitPrice = getUnitPrice(selectedProduct, form.membershipType);
  const totalAmount = unitPrice * quantityNum;
  const pricingBasis = getPricingBasis(form.membershipType);
 
  async function handleCheckout(e) {
    e.preventDefault();

    if (!form.memberName) {
      alert("Please select a member.");
      return;
    }

    if (!form.productName) {
      alert("Please select a product.");
      return;
    }

    if (quantityNum < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    try {
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
          product_name: form.productName,
          unit_type: form.unitType || "Per Piece",
          quantity: quantityNum,
          unit_price: unitPrice,
          total_amount: totalAmount,
          pricing_basis: pricingBasis,
          encoded_by: "admin",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to save sale");
      }

      alert("Sale saved successfully.");
      clearForm();
    } catch (e) {
      setErr(e?.message || "Failed to save sale");
    }
  }

  function clearForm() {
    setForm({
      memberName: "",
      memberId: "",
      membershipType: "SRP",
      unitType: "Per Piece",
      productName: "",
      quantity: 1,
    });
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card title="Sales Entry" className="min-w-0">
        <form className="grid gap-4" onSubmit={handleCheckout}>
          <div className="grid gap-3 md:grid-cols-2">
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

            <Input
              label="Member ID"
              value={form.memberId}
              readOnly
              placeholder="Auto-filled"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Membership Type"
              value={form.membershipType}
              readOnly
              placeholder="Auto-filled"
            />

            <Input
              label="Unit Type"
              value={form.unitType}
              readOnly
              placeholder="Auto-filled from product"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Product Name"
              value={form.productName}
              disabled={loadingProducts}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productName: e.target.value }))
              }
            >
              <option value="">
                {loadingProducts ? "Loading products..." : "Select product"}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.item_name}>
                  {p.item_name}
                </option>
              ))}
            </Select>

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
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Proceed Checkout
            </button>

            <button
              type="button"
              onClick={clearForm}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Clear
            </button>
          </div>
        </form>
      </Card>

      <Card title="Product Price Reference" className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Product</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">SRP</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Distributor</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Stockiest</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={5}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={5}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
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
