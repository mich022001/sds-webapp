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

const PRODUCT_CATALOG = [
  { name: "Coffee Mix", srp: 250, distributor: 220, stockiest: 200 },
  { name: "Collagen Drink", srp: 450, distributor: 400, stockiest: 370 },
  { name: "Slim Tea", srp: 300, distributor: 260, stockiest: 240 },
  { name: "Soap Bar", srp: 150, distributor: 130, stockiest: 115 },
];

function normalizeMembershipType(v) {
  return String(v || "").trim().toLowerCase();
}

function getUnitPrice(product, membershipType) {
  if (!product) return 0;
  const mt = normalizeMembershipType(membershipType);

  if (mt === "stockiest") return Number(product.stockiest ?? product.distributor ?? product.srp ?? 0);
  if (
    mt === "distributor" ||
    mt === "area manager" ||
    mt === "regional manager"
  ) {
    return Number(product.distributor ?? product.srp ?? 0);
  }

  return Number(product.srp ?? 0);
}

export default function SalesEntry() {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    memberName: "",
    memberId: "",
    membershipType: "SRP",
    unitType: "Per Piece",
    productName: "",
    quantity: 1,
  });

  const selectedMember = useMemo(() => {
    return members.find((m) => m.name === form.memberName) || null;
  }, [members, form.memberName]);

  const selectedProduct = useMemo(() => {
    return PRODUCT_CATALOG.find((p) => p.name === form.productName) || null;
  }, [form.productName]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);
        setErr("");

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

  const quantityNum = Math.max(1, Number(form.quantity || 1));
  const unitPrice = getUnitPrice(selectedProduct, form.membershipType);
  const totalAmount = unitPrice * quantityNum;

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

    if (!quantityNum || quantityNum < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    // Placeholder until API is built
    alert(
      [
        "Sales checkout preview",
        `Member: ${form.memberName}`,
        `Member ID: ${form.memberId || "-"}`,
        `Membership Type: ${form.membershipType}`,
        `Unit Type: ${form.unitType}`,
        `Product: ${form.productName}`,
        `Quantity: ${quantityNum}`,
        `Unit Price: ${unitPrice.toFixed(2)}`,
        `Total Amount: ${totalAmount.toFixed(2)}`,
      ].join("\n")
    );
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
      <Card title="Sales Entry">
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

            <Select
              label="Unit Type"
              value={form.unitType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unitType: e.target.value }))
              }
            >
              <option>Per Piece</option>
              <option>Per Box</option>
              <option>Per Set</option>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Product Name"
              value={form.productName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productName: e.target.value }))
              }
            >
              <option value="">Select product</option>
              {PRODUCT_CATALOG.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
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
              value={
                normalizeMembershipType(form.membershipType) === "stockiest"
                  ? "Stockiest"
                  : normalizeMembershipType(form.membershipType) === "distributor" ||
                    normalizeMembershipType(form.membershipType) === "area manager" ||
                    normalizeMembershipType(form.membershipType) === "regional manager"
                  ? "Distributor"
                  : "SRP"
              }
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

      <Card title="Product Price Reference">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Product</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">SRP</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Distributor</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Stockiest</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_CATALOG.map((p) => (
                <tr key={p.name} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-zinc-800">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{Number(p.srp).toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-700">{Number(p.distributor).toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-700">{Number(p.stockiest).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
