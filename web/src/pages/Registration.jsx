import { useEffect, useMemo, useState } from "react";

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

function Input({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500 truncate"
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
          "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
        props.disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {children}
    </button>
  );
}

export default function Registration({ user }) {
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [linkedMemberName, setLinkedMemberName] = useState("");
  const [saving, setSaving] = useState(false);

  const isRestrictedRecruiter =
    user?.role === "rm" || user?.role === "normal";
  const isPrivileged =
    user?.role === "super_admin" || user?.role === "admin";

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

        if (!cancelled) {
          setMembers(sorted);
        }
      } catch {
        // no-op
      }
    }

    if (!isRestrictedRecruiter) {
      loadMembers();
    } else {
      setMembers([]);
    }

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

        if (!cancelled) {
          setPackages(sorted);
        }
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
        if (!cancelled) {
          setLinkedMemberName("");
        }
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
      sponsor:
        isRestrictedRecruiter && linkedMemberName ? linkedMemberName : "SDS",
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
    <div className="grid gap-4">
      <Card
        title="Register New Member"
        right={
          isRestrictedRecruiter ? (
            <div className="text-xs text-zinc-500">
              Sponsor is locked to your account
            </div>
          ) : null
        }
      >
        <form className="grid gap-3" onSubmit={handleSubmit}>
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

          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="grid gap-3 md:grid-cols-2">
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
              onChange={(e) => setForm({ ...form, areaRegion: e.target.value })}
            >
              {PH_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          {requiresManualRm && (
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Package"
              value={form.packageName}
              onChange={(e) => setForm({ ...form, packageName: e.target.value })}
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

          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Member"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
