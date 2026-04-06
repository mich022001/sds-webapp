import { useEffect, useState } from "react";

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 text-sm font-semibold text-zinc-900">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-zinc-100 py-3 last:border-b-0">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900">{value || "-"}</div>
    </div>
  );
}

export default function Profile({ user }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setErr("");

        if (!user?.member_id) {
          if (!cancelled) setMember(null);
          return;
        }

        const res = await fetch(
          `/api/members?member_id=${encodeURIComponent(user.member_id)}`
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || "Failed to load profile");
        }

        const row = Array.isArray(json?.data) ? json.data[0] : null;

        if (!cancelled) {
          setMember(row || null);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  return (
    <div className="grid gap-4">
      <Card title="Account Profile">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Account
              </div>
              <Row label="Username" value={user?.username} />
              <Row label="Full Name" value={user?.full_name} />
              <Row label="Role" value={user?.role} />
              <Row label="Linked Member ID" value={user?.member_id} />
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Member
              </div>
              <Row label="Name" value={member?.name} />
              <Row label="Membership Type" value={member?.membership_type} />
              <Row label="Sponsor" value={member?.sponsor_name} />
              <Row label="Regional Manager" value={member?.regional_manager} />
              <Row label="Area / Region" value={member?.area_region} />
              <Row label="Package" value={member?.package_name} />
              <Row label="Contact" value={member?.contact} />
              <Row label="Email" value={member?.email} />
              <Row label="Address" value={member?.address} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
