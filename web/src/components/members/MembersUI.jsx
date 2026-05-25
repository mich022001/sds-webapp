import {
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Shield,
  UserCog,
  Users,
} from "lucide-react";

export function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  title,
  children,
  right,
  icon: Icon,
  className = "",
}) {
  return (
    <div
      className={cls(
        "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={20} />
              </div>
            )}

            <div className="text-lg font-black text-slate-950">{title}</div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className={cls("grid gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        {...props}
        className="h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className={cls("grid gap-2", className)}>
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}

      <textarea
        {...props}
        className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

export function StatusBadge({ status }) {
  const cleanStatus = String(status || "").toLowerCase();

  const tone =
    cleanStatus === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
      : cleanStatus === "completed"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : cleanStatus === "rejected"
          ? "bg-red-50 text-red-700 border-red-100"
          : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
        tone
      )}
    >
      {status || "-"}
    </span>
  );
}

export function Button({
  children,
  icon: Icon,
  variant = "primary",
  ...props
}) {
  return (
    <button
      {...props}
      className={cls(
        "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-slate-950 text-white hover:bg-slate-800",
        variant === "ghost" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "danger" &&
          "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export { Lock, RefreshCw, RotateCcw, Save, Search, Shield, UserCog, Users };
