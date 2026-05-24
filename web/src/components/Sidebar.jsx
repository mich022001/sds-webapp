import { X } from "lucide-react";
import { SDS_LOGO } from "../lib/sdsData";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getShellTitle(role) {
  if (role === "super_admin") return "SDS Super Admin";
  if (role === "admin") return "SDS Admin";
  if (role === "rm") return "SDS RM Portal";
  if (role === "normal") return "SDS Member Portal";
  return "SDS Web System";
}

function getRoleBadge(role) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "rm") return "Regional Manager";
  if (role === "normal") return "Member";
  return "User";
}

function getNavInitial(label) {
  return String(label || "?").trim().slice(0, 1).toUpperCase();
}

export default function Sidebar({
  user,
  currentNav,
  active,
  onNavigate,
  onClose,
  mobile = false,
}) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-3xl border border-blue-100/80 bg-white shadow-xl shadow-blue-950/5">
      <div className="border-b border-blue-50 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-yellow-300/60">
              <img
                src={SDS_LOGO}
                alt="SDS"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold tracking-tight">
                {getShellTitle(user?.role)}
              </div>
              <div className="mt-0.5 text-xs font-medium text-blue-100">
                Sure-Fit Wellness
              </div>
            </div>
          </button>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
          <div className="text-xs uppercase tracking-wide text-blue-100">
            Signed in as
          </div>
          <div className="mt-1 truncate text-sm font-bold text-white">
            {user?.full_name || user?.username || "User"}
          </div>
          <div className="mt-2 inline-flex rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-gray-950">
            {getRoleBadge(user?.role)}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {currentNav.map((item) => {
          const isActive = active === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cls(
                "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
                isActive
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                  : "text-zinc-700 hover:bg-blue-50 hover:text-blue-800"
              )}
            >
              <span
                className={cls(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition",
                  isActive
                    ? "bg-yellow-400 text-gray-950"
                    : "bg-zinc-100 text-blue-800 group-hover:bg-white"
                )}
              >
                {getNavInitial(item.label)}
              </span>

              <span className="min-w-0 flex-1 truncate font-semibold">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-blue-50 p-4">
        <div className="rounded-2xl bg-blue-50 p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-800">
            SDS Direct Sales
          </div>
          <div className="mt-1 text-xs leading-relaxed text-zinc-500">
            Member, sales, bonuses, products, and reports management.
          </div>
        </div>
      </div>
    </aside>
  );
}
