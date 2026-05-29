import { ShoppingCart, CheckCircle2 } from "lucide-react";

import {
  ProductImage,
  ItemTypeBadge,
  fmtAmount,
  getUnitPrice,
  cls,
} from "./SalesUI";

export default function SalesCatalog({
  items = [],
  membershipType = "SRP",
  selectedItemId = "",
  onSelect,
}) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <div className="text-sm text-slate-500">
          No products available.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const selected = String(selectedItemId) === String(item.id);

        const price = getUnitPrice(item, membershipType);

        return (
          <div
            key={item.id}
            className={cls(
              "overflow-hidden rounded-3xl border bg-white shadow-sm transition-all",
              selected
                ? "border-blue-400 ring-4 ring-blue-100"
                : "border-slate-200 hover:-translate-y-1 hover:shadow-lg"
            )}
          >
            <ProductImage item={item} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-950">
                    {item.item_name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {item.item_code}
                  </div>
                </div>

                <ItemTypeBadge type={item.item_type} />
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Your Price
                </div>

                <div className="mt-1 text-3xl font-black text-slate-950">
                  ₱{fmtAmount(price)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">SRP</div>
                  <div className="mt-1 font-bold">
                    ₱{fmtAmount(item.srp_price)}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">Member</div>
                  <div className="mt-1 font-bold">
                    ₱{fmtAmount(item.member_price)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className={cls(
                  "mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold transition",
                  selected
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {selected ? (
                  <>
                    <CheckCircle2 size={18} />
                    Selected
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Add To Cart
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
