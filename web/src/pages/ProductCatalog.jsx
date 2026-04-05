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
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
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
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
      >
        {children}
      </select>
    </label>
  );
}

const emptyForm = {
  id: "",
  item_code: "",
  item_name: "",
  item_type: "product",
  unit_type: "Per Piece",
  srp_price: "",
  member_price: "",
  distributor_price: "",
  stockiest_price: "",
  is_active: true,
};

export default function ProductCatalog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [filterType, setFilterType] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadRows() {
    try {
      setLoading(true);
      setErr("");

      const qs = filterType ? `?item_type=${encodeURIComponent(filterType)}` : "";
      const res = await fetch(`/api/products${qs}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load catalog");

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [filterType]);

  const isEdit = useMemo(() => !!form.id, [form.id]);

  async function handleSave(e) {
    e.preventDefault();

    if (!form.item_name.trim()) {
      alert("Item name is required.");
      return;
    }

    if (!["product", "package"].includes(form.item_type)) {
      alert("Item type must be product or package.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const endpoint = "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...form,
        id: isEdit ? Number(form.id) : undefined,
        srp_price: Number(form.srp_price || 0),
        member_price: Number(form.member_price || 0),
        distributor_price: Number(form.distributor_price || 0),
        stockiest_price: Number(form.stockiest_price || 0),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Save failed");

      setForm(emptyForm);
      await loadRows();
      alert(isEdit ? "Catalog item updated." : "Catalog item created.");
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id) {
    const ok = window.confirm("Delete this catalog item?");
    if (!ok) return;

    try {
      setErr("");

      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");

      if (String(form.id) === String(id)) {
        setForm(emptyForm);
      }

      await loadRows();
      alert("Catalog item deleted.");
    } catch (e) {
      setErr(e?.message || "Delete failed");
    }
  }

  function editRow(r) {
    setForm({
      id: String(r.id),
      item_code: r.item_code || "",
      item_name: r.item_name || "",
      item_type: r.item_type || "product",
      unit_type: r.unit_type || "Per Piece",
      srp_price: String(r.srp_price ?? ""),
      member_price: String(r.member_price ?? ""),
      distributor_price: String(r.distributor_price ?? ""),
      stockiest_price: String(r.stockiest_price ?? ""),
      is_active: !!r.is_active,
    });
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card title={isEdit ? "Edit Catalog Item" : "Add Catalog Item"}>
        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Item Code"
              value={form.item_code}
              onChange={(e) => setForm({ ...form, item_code: e.target.value })}
              placeholder="e.g. PRD-001"
            />

            <Input
              label="Item Name"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="e.g. Coffee Mix"
            />

            <Select
              label="Item Type"
              value={form.item_type}
              onChange={(e) => setForm({ ...form, item_type: e.target.value })}
            >
              <option value="product">product</option>
              <option value="package">package</option>
            </Select>

            <Select
              label="Unit Type"
              value={form.unit_type}
              onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
            >
              <option>Per Piece</option>
              <option>Per Box</option>
              <option>Per Set</option>
              <option>Per Bottle</option>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="SRP Price"
              type="number"
              step="0.01"
              value={form.srp_price}
              onChange={(e) => setForm({ ...form, srp_price: e.target.value })}
            />

            <Input
              label="Member Price"
              type="number"
              step="0.01"
              value={form.member_price}
              onChange={(e) => setForm({ ...form, member_price: e.target.value })}
            />

            <Input
              label="Distributor Price"
              type="number"
              step="0.01"
              value={form.distributor_price}
              onChange={(e) => setForm({ ...form, distributor_price: e.target.value })}
            />

            <Input
              label="Stockiest Price"
              type="number"
              step="0.01"
              value={form.stockiest_price}
              onChange={(e) => setForm({ ...form, stockiest_price: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active item
          </label>

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
              {saving ? "Saving..." : isEdit ? "Update Item" : "Save Item"}
            </button>

            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Clear
            </button>
          </div>
        </form>
      </Card>

      <Card
        title="Catalog Records"
        right={
          <Select
            label="Filter Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="min-w-[160px]"
          >
            <option value="">all</option>
            <option value="product">product</option>
            <option value="package">package</option>
          </Select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Code</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Name</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Unit</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">SRP</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Distributor</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Stockiest</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Active</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={10}>
                    Loading catalog...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={10}>
                    No catalog items found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-800">{r.item_code || "-"}</td>
                    <td className="px-4 py-3 text-zinc-800">{r.item_name}</td>
                    <td className="px-4 py-3 text-zinc-700">{r.item_type}</td>
                    <td className="px-4 py-3 text-zinc-700">{r.unit_type}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(r.srp_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(r.member_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(r.distributor_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {Number(r.stockiest_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {r.is_active ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editRow(r)}
                          className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRow(r.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
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
