import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Filter,
  Image as ImageIcon,
  PackagePlus,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";

import CatalogGrid from "../components/catalog/CatalogGrid";
import {
  CatalogHeader,
  CatalogMiniSummary,
  ImagePreview,
  Input,
  SectionCard,
  Select,
  cls,
} from "../components/catalog/CatalogUI";

const emptyForm = {
  id: "",
  item_code: "",
  item_name: "",
  item_type: "product",
  unit_type: "Per Piece",
  image_url: "",
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
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const isEdit = useMemo(() => !!form.id, [form.id]);

  async function loadRows() {
    try {
      setLoading(true);
      setErr("");

      const qs = new URLSearchParams();
      if (filterType) qs.set("item_type", filterType);
      qs.set("active_only", "false");

      const res = await fetch(`/api/products?${qs.toString()}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (!q) return true;

      return (
        String(row.item_code || "").toLowerCase().includes(q) ||
        String(row.item_name || "").toLowerCase().includes(q) ||
        String(row.item_type || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

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

      const payload = {
        ...form,
        id: isEdit ? Number(form.id) : undefined,
        srp_price: Number(form.srp_price || 0),
        member_price: Number(form.member_price || 0),
        distributor_price: Number(form.distributor_price || 0),
        stockiest_price: Number(form.stockiest_price || 0),
      };

      const res = await fetch("/api/products", {
        method: isEdit ? "PUT" : "POST",
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

  function editRow(row) {
    setForm({
      id: String(row.id),
      item_code: row.item_code || "",
      item_name: row.item_name || "",
      item_type: row.item_type || "product",
      unit_type: row.unit_type || "Per Piece",
      image_url: row.image_url || "",
      srp_price: String(row.srp_price ?? ""),
      member_price: String(row.member_price ?? ""),
      distributor_price: String(row.distributor_price ?? ""),
      stockiest_price: String(row.stockiest_price ?? ""),
      is_active: !!row.is_active,
    });

    setTimeout(() => {
      const el = document.querySelector("#catalog-form");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function clearForm() {
    setForm(emptyForm);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <CatalogHeader
        eyebrow="Catalog Operations"
        title="Product Catalog Management"
        subtitle="Manage SDS products, packages, prices, visibility, and product images used across sales and landing pages."
        icon={Boxes}
      />

      <CatalogMiniSummary rows={rows} />

      <SectionCard
        title="Catalog Browser"
        subtitle={`Showing ${filteredRows.length} of ${rows.length} catalog items.`}
        icon={Filter}
        right={
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <Select
              label="Filter Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name"
                className="[&_input]:pl-9"
              />
            </div>
          </div>
        }
      >
        {err ? (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        ) : null}

        <CatalogGrid
          rows={filteredRows}
          loading={loading}
          onEdit={editRow}
          onDelete={deleteRow}
        />
      </SectionCard>

      <SectionCard
        title={isEdit ? "Edit Catalog Item" : "Add Catalog Item"}
        subtitle={
          isEdit
            ? "Update product information, pricing, status, and image URL."
            : "Create a new product or package for the SDS catalog."
        }
        icon={PackagePlus}
      >
        <form id="catalog-form" className="grid gap-5" onSubmit={handleSave}>
          <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                <ImageIcon size={14} />
                Image Preview
              </div>

              <ImagePreview
                src={form.image_url}
                alt={form.item_name || "Catalog item"}
              />

              <div className="mt-3 text-xs leading-relaxed text-slate-500">
                Use a public path like{" "}
                <span className="font-bold text-slate-700">
                  /products/prommix-plus-v2.png
                </span>{" "}
                or{" "}
                <span className="font-bold text-slate-700">/PackageAv2.png</span>.
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  label="Item Code"
                  value={form.item_code}
                  onChange={(e) =>
                    setForm({ ...form, item_code: e.target.value })
                  }
                  placeholder="e.g. PRD-001"
                />

                <Input
                  label="Item Name"
                  value={form.item_name}
                  onChange={(e) =>
                    setForm({ ...form, item_name: e.target.value })
                  }
                  placeholder="e.g. Prommix Plus"
                />

                <Select
                  label="Item Type"
                  value={form.item_type}
                  onChange={(e) =>
                    setForm({ ...form, item_type: e.target.value })
                  }
                >
                  <option value="product">Product</option>
                  <option value="package">Package</option>
                </Select>

                <Select
                  label="Unit Type"
                  value={form.unit_type}
                  onChange={(e) =>
                    setForm({ ...form, unit_type: e.target.value })
                  }
                >
                  <option>Per Piece</option>
                  <option>Per Box</option>
                  <option>Per Set</option>
                  <option>Per Bottle</option>
                </Select>
              </div>

              <Input
                label="Image URL"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                placeholder="/products/prommix-plus-v2.png"
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  label="SRP Price"
                  type="number"
                  step="0.01"
                  value={form.srp_price}
                  onChange={(e) =>
                    setForm({ ...form, srp_price: e.target.value })
                  }
                />

                <Input
                  label="Member Price"
                  type="number"
                  step="0.01"
                  value={form.member_price}
                  onChange={(e) =>
                    setForm({ ...form, member_price: e.target.value })
                  }
                />

                <Input
                  label="Distributor Price"
                  type="number"
                  step="0.01"
                  value={form.distributor_price}
                  onChange={(e) =>
                    setForm({ ...form, distributor_price: e.target.value })
                  }
                />

                <Input
                  label="Stockiest Price"
                  type="number"
                  step="0.01"
                  value={form.stockiest_price}
                  onChange={(e) =>
                    setForm({ ...form, stockiest_price: e.target.value })
                  }
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Active item
              </label>
            </div>
          </div>

          {err ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Error: {err}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className={cls(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60",
                saving && "cursor-not-allowed"
              )}
            >
              <Save size={16} />
              {saving ? "Saving..." : isEdit ? "Update Item" : "Save Item"}
            </button>

            <button
              type="button"
              onClick={clearForm}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Clear
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
