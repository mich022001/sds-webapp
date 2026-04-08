import { useEffect, useMemo, useState } from "react";

function Card({ title, children, className = "", right }) {
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

function Row({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-zinc-100 py-3 last:border-b-0">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900">{value || "-"}</div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <textarea
        {...props}
        className="min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
      />
    </label>
  );
}

export default function Profile({ user }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [requestErr, setRequestErr] = useState("");
  const [requestSaving, setRequestSaving] = useState(false);

  const isRestrictedUser = user?.role === "rm" || user?.role === "normal";

  const [form, setForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [resetRequestForm, setResetRequestForm] = useState({
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setErr("");

        if (!user?.member_id) {
          if (!cancelled) {
            setMember(null);
            setForm((prev) => ({
              ...prev,
              username: user?.username || "",
            }));
          }
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
          setForm((prev) => ({
            ...prev,
            username: user?.username || "",
          }));
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
  }, [user?.member_id, user?.username]);

  const usernameChanged = useMemo(() => {
    return form.username.trim() !== String(user?.username || "").trim();
  }, [form.username, user?.username]);

  const passwordChanged = useMemo(() => {
    return !!form.newPassword.trim();
  }, [form.newPassword]);

  async function handleSave(e) {
    e.preventDefault();

    if (!usernameChanged && !passwordChanged) {
      setErr("No changes to save.");
      setMsg("");
      return;
    }

    if (!form.currentPassword) {
      setErr("Current password is required.");
      setMsg("");
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setErr("New password must be at least 8 characters.");
      setMsg("");
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setErr("New password and confirm password do not match.");
      setMsg("");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile");
      }

      setMsg(json.message || "Profile updated successfully.");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      alert(
        "Profile updated successfully. Log out and sign in again if you changed your username."
      );
    } catch (e) {
      setErr(e?.message || "Failed to update profile");
      setMsg("");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestPasswordReset(e) {
    e.preventDefault();

    try {
      setRequestSaving(true);
      setRequestErr("");
      setRequestMsg("");

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_password_reset",
          notes: resetRequestForm.notes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit password reset request");
      }

      setRequestMsg(
        json.message || "Password reset request submitted successfully."
      );
      setResetRequestForm({ notes: "" });
    } catch (e) {
      setRequestErr(e?.message || "Failed to submit password reset request");
      setRequestMsg("");
    } finally {
      setRequestSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="Account Profile">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : err && !member ? (
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

      <Card title="Update Login Credentials">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
          <Input
            label="New Username"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
            placeholder="Enter new username"
          />

          <div />

          <Input
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            placeholder="Enter current password"
          />

          <div />

          <Input
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            placeholder="Leave blank if unchanged"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            placeholder="Confirm new password"
          />

          {err && (
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {msg && (
            <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Credentials"}
            </button>
          </div>
        </form>
      </Card>

      {isRestrictedUser && (
        <Card title="Request Password Reset">
          <form className="grid gap-4" onSubmit={handleRequestPasswordReset}>
            <div className="text-sm text-zinc-600">
              Submit a request for admin approval. Once completed by admin, your
              password will be reset to your Member ID.
            </div>

            <Input
              label="Member ID"
              value={user?.member_id || ""}
              readOnly
              disabled
            />

            <Textarea
              label="Notes"
              value={resetRequestForm.notes}
              onChange={(e) =>
                setResetRequestForm({ notes: e.target.value })
              }
              placeholder="Optional reason for password reset request"
            />

            {requestErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {requestErr}
              </div>
            )}

            {requestMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {requestMsg}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={requestSaving}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {requestSaving ? "Submitting..." : "Request Password Reset"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
