import { useMemo, useState } from "react";
import Members from "./pages/Members";
import BonusLedger from "./pages/BonusLedger"; 

const nav = [
  { key: "dashboard", label: "Dashboard" },
  { key: "registration", label: "Registration" },
  { key: "members", label: "Members" },
  { key: "ledger", label: "Bonus Ledger" },
  { key: "sales", label: "Sales Entry" },
  { key: "reports", label: "Reports" },
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
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        {...props}
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
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
        variant === "ghost" && "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
      )}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");

  const pageTitle = useMemo(() => nav.find(n => n.key === active)?.label ?? "Dashboard", [active]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
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

        {/* Main */}
        <main className="flex-1">
          {/* Top bar */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold text-zinc-900">{pageTitle}</div>
              <div className="text-sm text-zinc-500">
                Website UI first — next we connect database + reports.
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => alert("Next: add login + roles")}>Login (next)</Button>
              <Button onClick={() => alert("Next: connect Supabase API")}>Connect DB (next)</Button>
            </div>
          </div>

          {active === "dashboard" && <Dashboard />}
          {active === "registration" && <Registration />}
          {/*{active === "members" && <Placeholder title="Members" desc="Search, view profile, genealogy, promotion" />}*/}
          {active === "members" && <Members />}
          {/*active === "ledger" && <Placeholder title="Bonus Ledger" desc="Filter by earner, reason, date range" />*/}
          {active === "ledger" && <BonusLedger />}
          {active === "sales" && <Placeholder title="Sales Entry" desc="Checkout + RM rebates + upline bonuses" />}
          {active === "reports" && <Reports />}
          {active === "redemptions" && <Placeholder title="Redemptions" desc="List + filter + notes" />}
        </main>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Members" value="—" hint="From members table" />
        <Stat label="Cash Issued" value="—" hint="From bonus ledger" />
        <Stat label="Cash Redeemed" value="—" hint="From redemptions" />
        <Stat label="Total Sales" value="—" hint="From sales ledger" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Recent Members">
          <div className="text-sm text-zinc-500">We’ll load last 20 from the database.</div>
        </Card>
        <Card title="Recent Bonus Entries">
          <div className="text-sm text-zinc-500">We’ll load last 50 from the database.</div>
        </Card>
      </div>
    </div>
  );
}

function Registration() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    membershipType: "Member",
    address: "",
    sponsor: "",
    areaRegion: PH_REGIONS[0],
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card
        title="Register New Member"
        right={
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            Sheet: Registration_Sheet
          </span>
        }
      >
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
              sponsor: "",
              areaRegion: "",
            });
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
            <Input
              label="Sponsor (name or SDS)"
              value={form.sponsor}
              onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
            />
            <Select
              label="Area/Region"
              value={form.areaRegion}
              onChange={(e) => setForm({ ...form, areaRegion: e.target.value })}
            >
              {PH_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
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
                  sponsor: "",
                  areaRegion: "",
                })
              }
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      <Card title="What happens when you save (same as Apps Script)">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>Creates Member ID (2026EM000001...)</li>
          <li>Assigns level based on sponsor</li>
          <li>Assigns Regional Manager</li>
          <li>Promotes sponsor after first recruit</li>
          <li>Distributes bonuses up to 7 uplines</li>
          <li>Updates Members_Bonuses balances</li>
        </ul>
      </Card>
    </div>
  );
}

function Reports() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Member Report" right={<span className="text-xs font-semibold text-zinc-500">Sheet: Member_Report</span>}>
        <div className="text-sm text-zinc-600">
          Shows profile + summary + bonus tree (levels 1–7) + genealogy.
        </div>
        <div className="mt-4">
          <Button onClick={() => alert("Next: /api/reports/member?name=...")}>Open (next)</Button>
        </div>
      </Card>

      <Card title="Regional Report" right={<span className="text-xs font-semibold text-zinc-500">Sheet: Regional_Report</span>}>
        <div className="text-sm text-zinc-600">
          RM summary + rebates + genealogy by level + bonus totals (1–7).
        </div>
        <div className="mt-4">
          <Button onClick={() => alert("Next: /api/reports/regional?rm=...")}>Open (next)</Button>
        </div>
      </Card>

      <Card title="Sales Analytics" right={<span className="text-xs font-semibold text-zinc-500">Sheet: Sales_Analytics</span>}>
        <div className="text-sm text-zinc-600">
          Highest products sold, top buyers, per package, per product (date range).
        </div>
        <div className="mt-4">
          <Button onClick={() => alert("Next: /api/reports/sales?from=...&to=...")}>Open (next)</Button>
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
