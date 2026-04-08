import { useMemo, useState } from "react";

export default function ResetPassword() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!token) {
      setErr("Reset token is missing.");
      setMsg("");
      return;
    }

    if (!password) {
      setErr("New password is required.");
      setMsg("");
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      setMsg("");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      setMsg("");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setMsg("");

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to reset password");
      }

      setMsg(json.message || "Password updated. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setErr(e?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-2xl font-extrabold text-zinc-900">
            Reset Password
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Enter your new password below.
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">
              New Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              placeholder="Enter new password"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">
              Confirm Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              placeholder="Confirm new password"
            />
          </label>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          {msg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
