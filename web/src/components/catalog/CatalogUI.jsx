import {
  Boxes,
  CheckCircle2,
  ImageOff,
  Package,
  Tag,
  XCircle,
} from "lucide-react";

export function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function fmtAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getItemImage(item) {
  return String(item?.image_url || "").trim();
}

export function CatalogHeader({ title, subtitle, eyebrow, icon: Icon = Boxes }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {eyebrow ? (
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                {eyebrow}
              </div>
            ) : null}

            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h2>

            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
            <Icon size={22} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, subtitle, icon: Icon, children, right }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
            ) : null}

            <div>
              <div className="font-bold text-slate-950">{title}</div>

              {subtitle ? (
                <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
              ) : null}
            </div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
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

export function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
    red: "bg-red-50 text-red-700 ring-red-100",
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

          {helper ? (
            <div className="mt-1 text-xs text-slate-500">{helper}</div>
          ) : null}
        </div>

        {Icon ? (
          <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TypeBadge({ type }) {
  const value = String(type || "").toLowerCase();

  const tone =
    value === "package"
      ? "border-yellow-100 bg-yellow-50 text-yellow-700"
      : value === "product"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
        tone
      )}
    >
      {type || "-"}
    </span>
  );
}

export function ActiveBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={13} />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
      <XCircle size={13} />
      Inactive
    </span>
  );
}

export function ImagePreview({ src, alt = "Catalog item", className = "" }) {
  const cleanSrc = String(src || "").trim();

  return (
    <div
      className={cls(
        "flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50",
        className
      )}
    >
      {cleanSrc ? (
        <img
          src={cleanSrc}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid justify-items-center gap-2 text-center text-slate-400">
          <ImageOff size={28} />
          <span className="text-xs font-bold uppercase tracking-wide">
            No Image
          </span>
        </div>
      )}
    </div>
  );
}

export function PricePill({ label, value, tone = "slate" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    gold: "bg-yellow-50 text-yellow-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-50 text-slate-700",
  }[tone];

  return (
    <div className={cls("rounded-xl px-3 py-2", toneClass)}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-black">₱{fmtAmount(value)}</div>
    </div>
  );
}

export function CatalogMiniSummary({ rows }) {
  const total = rows.length;
  const products = rows.filter((row) => row.item_type === "product").length;
  const packages = rows.filter((row) => row.item_type === "package").length;
  const active = rows.filter((row) => row.is_active).length;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Items" value={total} icon={Boxes} tone="blue" />
      <StatCard label="Products" value={products} icon={Package} tone="green" />
      <StatCard label="Packages" value={packages} icon={Tag} tone="gold" />
      <StatCard label="Active" value={active} icon={CheckCircle2} tone="slate" />
    </div>
  );
}
