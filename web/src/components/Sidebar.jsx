import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Boxes,
  ClipboardList,
  Coins,
  FileBarChart,
  Gift,
  Home,
  LogOut,
  ReceiptText,
  ScrollText,
  ShoppingCart,
  Ticket,
  UserCircle,
  UserPlus,
  Users,
  X,
} from "lucide-react";

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

const navIcons = {
  dashboard: Home,
  registration: UserPlus,
  registration_codes: Ticket,
  members: Users,
  ledger: Coins,
  rm_rebates: BadgeDollarSign,
  sales: ShoppingCart,
  catalog: Boxes,
  reports: BarChart3,
  report_member: FileBarChart,
  report_regional: ScrollText,
  redemptions: Gift,
  my_members: Users,
  my_bonuses: Coins,
  my_rebates: ReceiptText,
  profile: UserCircle,
};

function getNavIcon(key) {
  return navIcons[key] || ClipboardList;
}

export default function Sidebar({
  user,
  currentNav,
  active,
  onNavigate,
  onClose,
  mobile = false,
}) {
  async function handleLogout() {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <aside
      className={cls(
        "flex h-full flex-col overflow-hidden border border-slate-200 bg-white shadow-sm",
        mobile ? "rounded-[24px]" : "rounded-2xl"
      )}
    >
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <img
                src={SDS_LOGO}
                alt="SDS"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-slate-950">
                {getShellTitle(user?.role)}
              </div>
              <div className="truncate text-xs font-semibold text-yellow-600">
                Sure-Fit Wellness
              </div>
            </div>
          </button>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Signed in
              </div>
              <div className="mt-0.5 truncate text-sm font-bold text-slate-950">
                {user?.full_name || user?.username || "User"}
              </div>
            </div>

            <div className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800">
              {getRoleBadge(user?.role)}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {currentNav.map((item) => {
            const Icon = getNavIcon(item.key);
            const isActive = active === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={cls(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  isActive
                    ? "border border-blue-100 bg-blue-50 text-blue-900"
                    : "border border-transparent text-slate-600 hover:border-slate-100 hover:bg-slate-50 hover:text-blue-800"
                )}
              >
                <span
                  className={cls(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                    isActive
                      ? "bg-blue-700 text-white shadow-sm"
                      : "bg-slate-100 text-blue-700 group-hover:bg-white"
                  )}
                >
                  <Icon size={17} strokeWidth={2.1} />
                </span>

                <span className="min-w-0 flex-1 truncate font-semibold">
                  {item.label}
                </span>

                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-2 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut size={16} />
          Logout
        </button>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <BookOpen size={14} className="text-blue-700" />
          <span className="truncate">Direct Sales Portal</span>
        </div>
      </div>
    </aside>
  );
}
