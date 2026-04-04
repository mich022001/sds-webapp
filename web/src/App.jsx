import { useEffect, useMemo, useState } from "react";
import Members from "./pages/Members";
import BonusLedger from "./pages/BonusLedger";
import Dashboard from "./pages/Dashboard";
import MemberReport from "./pages/MemberReport";
import RegionalReport from "./pages/RegionalReport";
import Login from "./pages/Login";

const nav = [
  { key: "dashboard", label: "Dashboard" },
  { key: "registration", label: "Registration" },
  { key: "members", label: "Members" },
  { key: "ledger", label: "Bonus Ledger" },
  { key: "sales", label: "Sales Entry" },
  { key: "reports", label: "Reports" },
  { key: "report_member", label: "Member Report" },
  { key: "report_regional", label: "Regional Report" },
  { key: "redemptions", label: "Redemptions" },
];

const PH_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
];

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 truncate"
      >
        {children}
      </select>
    </label>
  );
}

function Button({ children, variant = "primary", ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "h-10 rounded-xl px-4 text-sm font-semibold transition",
        variant === "primary" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "ghost" &&
          "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
      )}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const pageTitle = useMemo(
    () => nav.find((n) => n.key === active)?.label ?? "Dashboard",
    [active]
  );

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const json = await res.json().catch(() => ({}));

        if (!cancelled) {
          if (res.ok) {
            setUser(json.user ?? null);
          } else {
            setUser(null);
          }
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-lg font-extrabold text-zinc-900">SDS Admin</div>
            <div className="text-xs text-zinc-500">Direct Sales Web System</div>

            <div className="mt-4 grid gap-1">
              {nav.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setActive(n.key)}
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
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold text-zinc-900">{pageTitle}</div>
              <div className="text-sm text-zinc-500">
                Logged in as {user?.username || "user"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } finally {
                    setUser(null);
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          {active === "dashboard" && <Dashboard />}
          {active === "registration" && <Registration />}
          {active === "members" && <Members />}
          {active === "ledger" && <BonusLedger />}
          {active === "sales" && (
            <Placeholder
              title="Sales Entry"
              desc="Regular sales entry and membership package sales logging"
            />
          )}
          {active === "reports" && <Reports />}
          {active === "report_member" && <MemberReport />}
          {active === "report_regional" && <RegionalReport />}
          {active === "redemptions" && (
            <Placeholder title="Redemptions" desc="List + filter + notes" />
          )}
        </main>
      </div>
    </div>
  );
}

function Registration() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    membershipType: "Member",
    address: "",
    sponsor: "SDS",
    areaRegion: PH_REGIONS[0],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const res = await fetch("/api/members/list");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
        const sorted = [...rows].sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );

        if (!cancelled) {
          setMembers(sorted);
        }
      } catch {
        // no-op for now
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card title="Register New Member">
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();

            const res = await fetch("/api/members/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                contact: form.contact,
                email: form.email,
                membership_type: form.membershipType,
                address: form.address,
                sponsor: form.sponsor,
                area_region: form.areaRegion,
              }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
              alert(json.error || "Failed to save member");
              return;
            }

            alert("Member saved successfully!");

            setForm({
              name: "",
              contact: "",
              email: "",
              membershipType: "Member",
              address: "",
              sponsor: "SDS",
              areaRegion: PH_REGIONS[0],
            });

            try {
              const refreshRes = await fetch("/api/members/list");
              const refreshJson = await refreshRes.json().catch(() => ({}));
              if (refreshRes.ok) {
                const rows = Array.isArray(refreshJson?.data)
                  ? refreshJson.data
                  : [];
                const sorted = [...rows].sort((a, b) =>
                  String(a.name || "").localeCompare(String(b.name || ""))
                );
                setMembers(sorted);
              }
            } catch {
              // ignore refresh failure
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Membership Type"
              value={form.membershipType}
              onChange={(e) =>
                setForm({ ...form, membershipType: e.target.value })
              }
            >
              <option>Member</option>
              <option>Distributor</option>
              <option>Stockiest</option>
              <option>Area Manager</option>
              <option>Regional Manager</option>
            </Select>
          </div>

          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Sponsor"
              value={form.sponsor}
              onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
            >
              <option value="SDS">SDS</option>
              {members.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </Select>

            <Select
              label="Area/Region"
              value={form.areaRegion}
              onChange={(e) => setForm({ ...form, areaRegion: e.target.value })}
            >
              {PH_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-2 flex gap-2">
            <Button type="submit">Save Member</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  name: "",
                  contact: "",
                  email: "",
                  membershipType: "Member",
                  address: "",
                  sponsor: "SDS",
                  areaRegion: PH_REGIONS[0],
                })
              }
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Reports() {
  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card title="Sales Analytics">
        <div className="text-sm text-zinc-600">
          Sales report including:
        </div>

        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600">
          <li>Membership package purchases</li>
          <li>Regular product sales</li>
          <li>Top buyers</li>
          <li>Top products / packages</li>
          <li>Date range filtering</li>
        </ul>

        <div className="mt-4">
          <Button onClick={() => alert("Next: Build Sales Analytics page")}>
            Open Sales Analytics
          </Button>
        </div>
      </Card>
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
