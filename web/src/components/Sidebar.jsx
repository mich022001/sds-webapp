import { X } from "lucide-react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function getShellTitle(role) {
  if (role === "super_admin") return "SDS Super Admin";
  if (role === "admin") return "SDS Admin";
  if (role === "rm") return "SDS RM Portal";
  if (role === "normal") return "SDS Member Portal";
  return "SDS Web System";
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 md:block">
        <div>
          <div className="text-lg font-extrabold text-zinc-900">
            {getShellTitle(user?.role)}
          </div>
          <div className="text-xs text-zinc-500">Direct Sales Web System</div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-1">
        {currentNav.map((n) => (
          <button
            key={n.key}
            onClick={() => onNavigate(n.key)}
            className={cls(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm",
              active === n.key
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            )}
          >
            <span className="font-semibold">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
