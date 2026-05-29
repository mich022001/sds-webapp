import { Edit3, Trash2 } from "lucide-react";

import {
  ActiveBadge,
  ImagePreview,
  PricePill,
  TypeBadge,
  fmtAmount,
} from "./CatalogUI";

export default function CatalogGrid({ rows = [], loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
        Loading catalog...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
        No catalog items found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="p-4">
            <ImagePreview src={item.image_url} alt={item.item_name} />

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-black text-slate-950">
                  {item.item_name || "-"}
                </div>

                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {item.item_code || "No Code"}
                </div>
              </div>

              <ActiveBadge active={!!item.is_active} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <TypeBadge type={item.item_type} />

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {item.unit_type || "Per Piece"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <PricePill label="SRP" value={item.srp_price} tone="blue" />
              <PricePill label="Member" value={item.member_price} tone="green" />
              <PricePill
                label="Distributor"
                value={item.distributor_price}
                tone="gold"
              />
              <PricePill
                label="Stockiest"
                value={item.stockiest_price}
                tone="slate"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Price Spread
              </div>

              <div className="mt-1 text-sm font-black text-slate-950">
                ₱
                {fmtAmount(
                  Number(item.srp_price || 0) - Number(item.stockiest_price || 0)
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(item)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Edit3 size={14} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete?.(item.id)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
