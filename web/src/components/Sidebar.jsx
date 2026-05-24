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
  Package,
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
  return (
    <aside
      className={cls(
        "flex h-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-xl shadow-blue-950/5",
        mobile ? "rounded-[28px]" : "rounded-[24px]"
      )}
    >
      <div
        className={cls(
          "border-b border-slate-100 bg-white",
          mobile ? "p-5" : "p-4"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div
              className={cls(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
                mobile ? "h-14 w-14 p-1.5" : "h-12 w-12 p-1.5"
              )}
            >
              <img
                src={SDS_LOGO}
                alt="SDS"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div
                className={cls(
                  "truncate font-extrabold tracking-tight text-slate-950",
                  mobile ? "text-lg" : "text-base"
                )}
              >
                {getShellTitle(user?.role)}
              </div>
              <div className="mt-0.5 truncate text-xs font-semibold text-yellow-500">
                Sure-Fit Wellness
              </div>
            </div>
          </button>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 md:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div
          className={cls(
            "mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white",
            mobile ? "p-4" : "p-3"
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Signed in as
          </div>

          <div className="mt-1 truncate text-sm font-bold text-slate-900">
            {user?.full_name || user?.username || "User"}
          </div>

          <div className="mt-3 inline-flex rounded-full bg-blue-700 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            {getRoleBadge(user?.role)}
          </div>
        </div>
      </div>

      <nav
        className={cls(
          "flex-1 overflow-y-auto",
          mobile ? "space-y-1.5 p-4" : "space-y-1 p-3"
        )}
      >
        {currentNav.map((item) => {
          const isActive = active === item.key;
          const Icon = getNavIcon(item.key);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cls(
                "group flex w-full items-center gap-3 rounded-2xl text-left transition",
                mobile ? "px-4 py-3.5 text-[15px]" : "px-3 py-2.5 text-sm",
                isActive
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              )}
            >
              <span
                className={cls(
                  "flex shrink-0 items-center justify-center rounded-xl transition",
                  mobile ? "h-10 w-10" : "h-8 w-8",
                  isActive
                    ? "bg-yellow-400 text-slate-950"
                    : "bg-slate-100 text-blue-700 group-hover:bg-white"
                )}
              >
                <Icon size={mobile ? 19 : 17} strokeWidth={2.2} />
              </span>

              <span className="min-w-0 flex-1 truncate font-semibold">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          <BookOpen size={15} className="text-blue-700" />
          <span className="truncate">
            {mobile ? "SDS Direct Sales Portal" : "Direct Sales Portal"}
          </span>
        </div>
      </div>
    </aside>
  );
}
