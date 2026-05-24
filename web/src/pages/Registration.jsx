import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, IdCard, PackageCheck, RotateCcw, Save, ShieldCheck, UserPlus } from "lucide-react";

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

function Input({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        {...props}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

function Button({ children, variant = "primary", icon: Icon, ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition",
        variant === "primary" &&
          "bg-blue-700 text-white shadow-sm hover:bg-blue-800",
        variant === "ghost" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        props.disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function Registration({ user }) {
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [linkedMemberName, setLinkedMemberName] = useState("");
  const [saving, setSaving] = useState(false);

  const isRestrictedRecruiter = user?.role === "rm" || user?.role === "normal";
  const isPrivileged = user?.role === "super_admin" || user?.role === "admin";

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    membershipType: "Member",
    address: "",
    sponsor: "SDS",
    regionalManager: "",
    areaRegion: PH_REGIONS[0],
    packageName: "",
    registrationCode: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const res = await fetch("/api/members");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
        const sorted = [...rows].sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );

        if (!cancelled) setMembers(sorted);
      } catch {
        // no-op
      }
    }

    if (!isRestrictedRecruiter) loadMembers();
    else setMembers([]);

    return () => {
      cancelled = true;
    };
  }, [isRestrictedRecruiter]);

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      try {
        const res = await fetch("/api/products?item_type=package");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
        const sorted = [...rows].sort((a, b) =>
          String(a.item_name || "").localeCompare(String(b.item_name || ""))
        );

        if (!cancelled) setPackages(sorted);
      } catch {
        // no-op
      }
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLinkedMemberName() {
      if (!isRestrictedRecruiter) {
        setLinkedMemberName("");
        return;
      }

      if (!user?.member_id) {
        setLinkedMemberName("");
        return;
      }

      try {
        const res = await fetch(
          `/api/members?member_id=${encodeURIComponent(user.member_id)}`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
        const match = rows[0] || null;

        if (!cancelled) {
          const sponsorName = match?.name || "";
          setLinkedMemberName(sponsorName);
          setForm((prev) => ({
            ...prev,
            sponsor: sponsorName || prev.sponsor,
          }));
        }
      } catch {
        if (!cancelled) setLinkedMemberName("");
      }
    }

    loadLinkedMemberName();

    return () => {
      cancelled = true;
    };
  }, [isRestrictedRecruiter, user?.member_id]);

  const rmOptions = useMemo(() => {
    return members.filter(
      (m) =>
        String(m.membership_type || "").trim().toLowerCase() ===
        "regional manager"
    );
  }, [members]);

  const requiresManualRm =
    isPrivileged &&
    form.sponsor === "SDS" &&
    form.membershipType !== "Regional Manager";

  function resetForm() {
    setForm({
      name: "",
      contact: "",
      email: "",
      membershipType: "Member",
      address: "",
      sponsor: isRestrictedRecruiter && linkedMemberName ? linkedMemberName : "SDS",
      regionalManager: "",
      areaRegion: PH_REGIONS[0],
      packageName: "",
      registrationCode: "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.packageName) {
      alert("Please select a package.");
      return;
    }

    if (!form.registrationCode.trim()) {
      alert("Registration code is required.");
      return;
    }

    if (isRestrictedRecruiter && !form.sponsor.trim()) {
      alert("Your linked sponsor/member account is missing. Contact admin.");
      return;
    }

    if (requiresManualRm && !form.regionalManager.trim()) {
      alert("Regional Manager is required when sponsor is SDS.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name,
        contact: form.contact,
        email: form.email,
        membership_type: form.membershipType,
        address: form.address,
        sponsor: form.sponsor,
        regional_manager: form.regionalManager,
        area_region: form.areaRegion,
        package_name: form.packageName,
        registration_code: form.registrationCode.trim().toUpperCase(),
      };

      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.error || "Failed to save member");
        return;
      }

      const usernameText = json.account_username
        ? `\nUsername: ${json.account_username}`
        : "";
      const passwordText = json.member?.member_id
        ? `\nDefault Password: ${json.member.member_id}`
        : "";
      const rmText = json.regional_manager_used
        ? `\nRegional Manager: ${json.regional_manager_used}`
        : "";

      alert(
        `Member and account created successfully!${usernameText}${passwordText}${rmText}`
      );

      resetForm();

      if (!isRestrictedRecruiter) {
        try {
          const refreshRes = await fetch("/api/members");
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
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Member Registration
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Register New Member
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a member profile, assign sponsor details, and validate the registration package.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <UserPlus size={22} />
            </div>
          </div>
        </div>

        {isRestrictedRecruiter && (
          <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-800 sm:px-6">
            Sponsor is locked to your linked member account.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 p-5 sm:p-6">
          <section>
            <SectionTitle
              icon={IdCard}
              title="Member Information"
              description="Basic details used for the member profile and login account."
            />

            <div className="grid gap-4 md:grid-cols-2">
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
              <Input
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Select
                label="Membership Type"
                value={form.membershipType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    membershipType: e.target.value,
                    regionalManager:
                      e.target.value === "Regional Manager"
                        ? ""
                        : form.regionalManager,
                  })
                }
              >
                <option>Member</option>
                <option>Distributor</option>
                <option>Stockiest</option>
                <option>Area Manager</option>
                <option>Regional Manager</option>
              </Select>
            </div>

            <div className="mt-4">
              <Input
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </section>

          <section>
            <SectionTitle
              icon={ShieldCheck}
              title="Sponsor & Region"
              description="Assign sponsor hierarchy and operating region."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {isRestrictedRecruiter ? (
                <Input label="Sponsor" value={form.sponsor} readOnly disabled />
              ) : (
                <Select
                  label="Sponsor"
                  value={form.sponsor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sponsor: e.target.value,
                      regionalManager:
                        e.target.value === "SDS" ? form.regionalManager : "",
                    })
                  }
                >
                  <option value="SDS">SDS</option>
                  {members.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}

              <Select
                label="Area/Region"
                value={form.areaRegion}
                onChange={(e) =>
                  setForm({ ...form, areaRegion: e.target.value })
                }
              >
                {PH_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>

              {requiresManualRm && (
                <Select
                  label="Regional Manager"
                  value={form.regionalManager}
                  onChange={(e) =>
                    setForm({ ...form, regionalManager: e.target.value })
                  }
                >
                  <option value="">Select Regional Manager</option>
                  {rmOptions.map((m) => (
                    <option key={m.member_id || m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </section>

          <section>
            <SectionTitle
              icon={PackageCheck}
              title="Package & Registration Code"
              description="Select the membership package and enter the issued registration code."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Package"
                value={form.packageName}
                onChange={(e) =>
                  setForm({ ...form, packageName: e.target.value })
                }
              >
                <option value="">Select package</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.item_name}>
                    {p.item_name}
                  </option>
                ))}
              </Select>

              <Input
                label="Registration Code"
                value={form.registrationCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registrationCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter unique registration code"
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Registration creates both member profile and member account.
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" icon={RotateCcw} onClick={resetForm} disabled={saving}>
                Clear
              </Button>
              <Button type="submit" icon={Save} disabled={saving}>
                {saving ? "Saving..." : "Save Member"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
