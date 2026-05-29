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
import SalesAnalytics from "./pages/SalesAnalytics";
import ProductCatalog from "./pages/ProductCatalog";
import RegistrationCodes from "./pages/RegistrationCodes";
import Reports from "./pages/Reports";
import RMRebates from "./pages/RMRebates";
import Registration from "./pages/Registration";
import Profile from "./pages/Profile";
import MyBonuses from "./pages/MyBonuses";
import Redemptions from "./pages/Redemptions";
import MyMembers from "./pages/MyMembers";
import MyRebates from "./pages/MyRebates";
import LandingPage from "./pages/LandingPage";

const navByRole = {
  super_admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "registration_codes", label: "Registration Codes" },
    { key: "members", label: "Members" },
    { key: "ledger", label: "Bonus Ledger" },
    { key: "rm_rebates", label: "RM Rebates" },
    { key: "sales", label: "Sales" },
    { key: "sales_analytics", label: "Sales Analytics" },
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
    { key: "sales_analytics", label: "Sales Analytics" },
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
    { key: "sales_analytics", label: "Sales Analytics" },
    { key: "redemptions", label: "Redemptions" },
    { key: "profile", label: "Profile" },
  ],
  normal: [
    { key: "dashboard", label: "Dashboard" },
    { key: "registration", label: "Registration" },
    { key: "my_bonuses", label: "My Bonuses" },
    { key: "sales", label: "Sales" },
    { key: "sales_analytics", label: "Sales Analytics" },
    { key: "redemptions", label: "Redemptions" },
    { key: "profile", label: "Profile" },
  ],
};

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getAllowedNav(role) {
  return navByRole[role] ?? [];
}

function getDefaultPage(role) {
  const allowed = getAllowedNav(role);
  return allowed[0]?.key ?? "dashboard";
}

function hasAccess(role, key) {
  return getAllowedNav(role).some((nav) => nav.key === key);
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const currentNav = useMemo(() => getAllowedNav(user?.role), [user?.role]);

  const pageTitle = useMemo(
    () => currentNav.find((nav) => nav.key === active)?.label ?? "Dashboard",
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-semibold text-zinc-600 shadow-xl">
          Loading SDS...
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) return <Login onLogin={setUser} />;
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-zinc-50 to-yellow-50">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-blue-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <div className="mx-auto flex max-w-[1480px] gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5 xl:gap-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-5 h-[calc(100vh-2.5rem)]">
            <Sidebar
              user={user}
              currentNav={currentNav}
              active={active}
              onNavigate={handleNavigate}
            />
          </div>
        </aside>

        <aside
          className={cls(
            "fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] transform p-3 transition-transform duration-300 md:hidden",
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
          <div className="mb-4 flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-800"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 px-3 text-center">
              <div className="truncate text-base font-extrabold text-slate-950">
                {pageTitle}
              </div>
              <div className="truncate text-xs text-slate-500">
                {user?.full_name || user?.username || "user"}
              </div>
            </div>

            <div className="h-11 w-11" />
          </div>

          {active === "dashboard" && <Dashboard user={user} />}
          {active === "registration" && <Registration user={user} />}

          {active === "registration_codes" && user.role === "super_admin" && (
            <RegistrationCodes />
          )}

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

          {active === "sales_analytics" && <SalesAnalytics user={user} />}

          {active === "catalog" && user.role === "super_admin" && (
            <ProductCatalog />
          )}

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
            <MyMembers user={user} />
          )}

          {active === "my_bonuses" &&
            (user.role === "rm" || user.role === "normal") && (
              <MyBonuses user={user} />
            )}

          {active === "my_rebates" && user.role === "rm" && (
            <MyRebates user={user} />
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
