import { useState } from "react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const username = String(form.username || "").trim();
    const password = String(form.password || "");

    if (!username || !password) {
      setErr("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username,
          password,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Login failed");
      }

      if (typeof onLogin === "function") {
        onLogin(json.user ?? null);
      }
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-2xl font-extrabold text-zinc-900">SDS Admin</div>
          <div className="mt-1 text-sm text-zinc-500">
            Sign in to access the Direct Sales Web System
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              placeholder="Enter username"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              placeholder="Enter password"
            />
          </label>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cls(
              "h-10 rounded-xl px-4 text-sm font-semibold transition",
              "bg-zinc-900 text-white hover:bg-zinc-800",
              loading && "cursor-not-allowed opacity-60"
            )}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
