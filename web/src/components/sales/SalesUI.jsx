import { Package } from "lucide-react";

export function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function fmtAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0.00";

  return number.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

export function normalizeMembershipType(value) {
  return String(value || "").trim().toLowerCase();
}

export function getPricingBasis(membershipType) {
  const type = normalizeMembershipType(membershipType);

  if (type === "stockiest") return "Stockiest";

  if (
    type === "distributor" ||
    type === "area manager" ||
    type === "regional manager"
  ) {
    return "Distributor";
  }

  if (type === "member") return "Member";

  return "SRP";
}

export function getUnitPrice(item, membershipType) {
  if (!item) return 0;

  const type = normalizeMembershipType(membershipType);

  if (type === "stockiest") return Number(item.stockiest_price ?? 0);

  if (
    type === "distributor" ||
    type === "area manager" ||
    type === "regional manager"
  ) {
    return Number(item.distributor_price ?? 0);
  }

  if (type === "member") return Number(item.member_price ?? 0);

  return Number(item.srp_price ?? 0);
}

export function getInitials(name) {
  return String(name || "-")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <textarea
        {...props}
        className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

export function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>

          {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  const className =
    value === "pending"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : value === "approved"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : value === "paid"
          ? "border-purple-100 bg-purple-50 text-purple-700"
          : value === "released"
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : value === "rejected"
              ? "border-red-100 bg-red-50 text-red-700"
              : value === "cancelled"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        className
      )}
    >
      {status || "-"}
    </span>
  );
}

export function ItemTypeBadge({ type }) {
  const value = String(type || "").toLowerCase();

  const tone =
    value === "package"
      ? "border-yellow-100 bg-yellow-50 text-yellow-700"
      : "border-blue-100 bg-blue-50 text-blue-700";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        tone
      )}
    >
      {type || "-"}
    </span>
  );
}

export function ProductImage({ item }) {
  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {item?.image_url ? (
        <img
          src={item.image_url}
          alt={item.item_name}
          className="h-full w-full object-contain p-3"
        />
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <Package size={42} />
          <div className="mt-2 text-xs font-bold uppercase tracking-wide">
            No Image
          </div>
        </div>
      )}
    </div>
  );
}
