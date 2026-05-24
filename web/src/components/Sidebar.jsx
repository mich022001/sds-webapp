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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "logout",
        }),
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <aside
      className={cls(
        "flex h-full flex-col overflow-hidden border border-slate-200 bg-white shadow-sm",
        mobile
          ? "rounded-[28px]"
          : "rounded-[30px]"
      )}
    >
      {/* HEADER */}

      <div className="border-b border-slate-100 bg-white p-4">
        <div className="flex items-start justify-between gap-3">

          <button
            onClick={() => onNavigate?.("dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <img
                src={SDS_LOGO}
                alt="SDS"
                className="h-full w-full object-contain"
              />

            </div>

            <div>

              <div className="text-lg font-extrabold text-slate-950">
                {getShellTitle(user?.role)}
              </div>

              <div className="text-xs font-semibold text-yellow-600">
                Sure-Fit Wellness
              </div>

            </div>
          </button>

          {mobile && (

            <button
              onClick={onClose}
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-2xl
                border border-slate-200
                bg-slate-50
              "
            >
              <X size={20} />
            </button>

          )}

        </div>

        {/* USER CARD */}

        <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">

          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Signed in as
          </div>

          <div className="mt-1 truncate font-bold text-slate-950">
            {user?.full_name ||
              user?.username ||
              "User"}
          </div>

          <div className="
              mt-3 inline-flex
              rounded-full
              bg-blue-700
              px-3 py-1
              text-xs
              font-bold
              text-white
            ">

            {getRoleBadge(user?.role)}

          </div>

        </div>
      </div>


      {/* NAVIGATION */}

      <nav className="flex-1 overflow-y-auto p-3">

        <div className="space-y-1">

          {currentNav.map((item) => {

            const Icon =
              getNavIcon(item.key);

            const activeItem =
              active === item.key;

            return (

              <button
                key={item.key}
                onClick={() =>
                  onNavigate(item.key)
                }
                className={cls(

                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition",

                  activeItem
                    ? "bg-blue-700 text-white shadow-sm"
                    : "hover:bg-slate-50 text-slate-700"

                )}
              >

                <div
                  className={cls(

                    "flex h-10 w-10 items-center justify-center rounded-xl",

                    activeItem
                      ? "bg-yellow-400 text-slate-950"
                      : "bg-slate-100 text-blue-700"

                  )}
                >

                  <Icon size={18} />

                </div>


                <span className="font-semibold">

                  {item.label}

                </span>

              </button>

            );

          })}

        </div>

      </nav>


      {/* FOOTER */}

      <div className="border-t border-slate-100 p-3 space-y-3">

        <button
          onClick={handleLogout}
          className="
            flex w-full
            items-center justify-center
            gap-2
            rounded-2xl
            border border-slate-200
            bg-white
            py-3
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
          "
        >

          <LogOut size={17} />

          Logout

        </button>


        <div
          className="
            flex items-center gap-2
            rounded-2xl
            bg-slate-50
            px-3 py-3
            text-xs
            font-medium
            text-slate-500
          "
        >

          <BookOpen
            size={15}
            className="text-blue-700"
          />

          <span>

            SDS Direct Sales Portal

          </span>

        </div>

      </div>

    </aside>
  );
}
