import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Members from "./pages/Members";
import BonusLedger from "./pages/BonusLedger";
import Dashboard from "./pages/Dashboard";
import MemberReport from "./pages/MemberReport";
import RegionalReport from "./pages/RegionalReport";
import Login from "./pages/Login";
import SalesEntry from "./pages/SalesEntry";
import ProductCatalog from "./pages/ProductCatalog";
import RegistrationCodes from "./pages/RegistrationCodes";
import Reports from "./pages/Reports";
import RMRebates from "./pages/RMRebates";
import Registration from "./pages/Registration";
import Profile from "./pages/Profile";
import MyBonuses from "./pages/MyBonuses";
import Redemptions from "./pages/Redemptions";

const navByRole = {
  super_admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "registration_codes", label: "Registration Codes" },
    { key: "members", label: "Members" },
    { key: "ledger", label: "Bonus Ledger" },
    { key: "rm_rebates", label: "RM Rebates" },
    { key: "sales", label: "Sales" },
    { key: "catalog", label: "Product Catalog" },
    { key: "reports", label: "Reports" },
    { key: "report_member", label: "Member Report" },
    { key: "report_regional", label: "Regional Report" },
    { key: "redemptions", label: "Redemptions" },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "members", label: "Members" },
    { key: "ledger", label: "Bonus Ledger" },
    { key: "rm_rebates", label: "RM Rebates" },
    { key: "sales", label: "Sales" },
    { key: "reports", label: "Reports" },
    { key: "report_member", label: "Member Report" },
    { key: "report_regional", label: "Regional Report" },
    { key: "redemptions", label: "Redemptions" },
  ],
  rm: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "my_members", label: "My Members" },
    { key: "my_bonuses", label: "My Bonuses" },
    { key: "my_rebates", label: "My Rebates" },
    { key: "sales", label: "Sales" },
    { key: "redemptions", label: "Redemptions" },
    { key: "profile", label: "Profile" },
  ],
  normal: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "my_bonuses", label: "My Bonuses" },
    { key: "sales", label: "Sales" },
    { key: "redemptions", label: "Redemptions" },
    { key: "profile", label: "Profile" },
  ],
};

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "h-10 rounded-xl px-4 text-sm font-semibold transition",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "ghost" &&
          "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
        className
      )}
    >
      {children}
    </button>
  );
}

function getAllowedNav(role) {
  return navByRole[role] ?? [];
}

function getDefaultPage(role) {
  const allowed = getAllowedNav(role);
  return allowed[0]?.key ?? "dashboard";
}

function hasAccess(role, key) {
  return getAllowedNav(role).some((n) => n.key === key);
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = useMemo(() => getAllowedNav(user?.role), [user?.role]);

  const pageTitle = useMemo(
    () => currentNav.find((n) => n.key === active)?.label ?? "Dashboard",
    [active, currentNav]
  );

  function handleNavigate(key) {
    setActive(key);
    setSidebarOpen(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const json = await res.json().catch(() => ({}));

        if (!cancelled) {
          if (res.ok) setUser(json.user ?? null);
          else setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.role) return;

    if (!hasAccess(user.role, active)) {
      setActive(getDefaultPage(user.role));
    }
  }, [active, user?.role]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <Sidebar
            user={user}
            currentNav={currentNav}
            active={active}
            onNavigate={handleNavigate}
          />
        </aside>

        <aside
          className={cls(
            "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-zinc-50 p-4 transition-transform duration-300 md:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            user={user}
            currentNav={currentNav}
            active={active}
            onNavigate={handleNavigate}
            onClose={() => setSidebarOpen(false)}
            mobile
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden pb-8">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="truncate text-xl font-extrabold text-zinc-900">
                  {pageTitle}
                </div>
                <div className="text-sm text-zinc-500">
                  Logged in as{" "}
                  <span className="font-medium text-zinc-900">
                    {user?.full_name || user?.username || "user"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                className="px-3 md:px-4"
                onClick={async () => {
                  try {
                    await fetch("/api/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "logout" }),
                    });
                  } finally {
                    setUser(null);
                    if (typeof window !== "undefined") {
                      window.location.href = "/";
                    }
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          {active === "dashboard" && <Dashboard user={user} />}
          {active === "registration" && <Registration user={user} />}

          {active === "registration_codes" &&
            user.role === "super_admin" && <RegistrationCodes />}

          {active === "members" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <Members user={user} />
            )}

          {active === "ledger" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <BonusLedger />
            )}

          {active === "rm_rebates" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <RMRebates />
            )}

          {active === "sales" && <SalesEntry user={user} />}

          {active === "catalog" &&
            user.role === "super_admin" && <ProductCatalog />}

          {active === "reports" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <Reports />
            )}

          {active === "report_member" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <MemberReport />
            )}

          {active === "report_regional" &&
            (user.role === "super_admin" || user.role === "admin") && (
              <RegionalReport />
            )}

          {active === "redemptions" && <Redemptions user={user} />}

          {active === "my_members" && user.role === "rm" && (
            <Placeholder
              title="My Members"
              desc="RM-scoped member list and downline view."
            />
          )}

          {active === "my_bonuses" &&
            (user.role === "rm" || user.role === "normal") && (
              <MyBonuses user={user} />
            )}

          {active === "my_rebates" && user.role === "rm" && (
            <Placeholder
              title="My Rebates"
              desc="RM-only rebate summary and history."
            />
          )}

          {active === "profile" &&
            (user.role === "rm" || user.role === "normal") && (
              <Profile user={user} />
            )}
        </main>
      </div>
    </div>
  );
}

function Placeholder({ title, desc }) {
  return (
    <Card title={title}>
      <div className="text-sm text-zinc-600">{desc}</div>
      <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
        UI placeholder — next we connect it to database + API.
      </div>
    </Card>
  );
}
