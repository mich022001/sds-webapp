import { useState } from "react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setErr("");

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Login failed");
      }

      onLogin(json.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();

    try {
      setResetErr("");
      setResetMsg("");

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_password_reset",
          username: resetUsername,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed");
      }

      setResetMsg(json.message);
      setResetUsername("");
    } catch (e) {
      setResetErr(e.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">SDS Admin Login</h1>

        {!forgotMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              className="w-full rounded border px-3 py-2"
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded border px-3 py-2"
            />

            {err && <div className="text-sm text-red-500">{err}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-black py-2 text-white"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="text-sm text-blue-600 underline"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />

            <div className="text-xs text-zinc-500">
              Your request will be reviewed by admin. Once approved, your
              password will be reset to your Member ID.
            </div>

            {resetErr && <div className="text-sm text-red-500">{resetErr}</div>}
            {resetMsg && (
              <div className="text-sm text-green-600">{resetMsg}</div>
            )}

            <button
              type="submit"
              className="w-full rounded bg-black py-2 text-white"
            >
              Submit Request
            </button>

            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="text-sm underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
