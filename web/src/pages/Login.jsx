import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin, onGoForgotPassword }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const username = String(form.username || "").trim();
    const password = String(form.password || "");

    if (!username || !password) {
      setErr("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Login failed");
      }

      if (typeof onLogin === "function") {
        onLogin(json.user || null);
      }
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">
            Surefit Direct Sales
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to your account
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Enter username"
              autoComplete="username"
              className="h-14 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-lg text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter password"
                autoComplete="current-password"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-14 text-lg text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-900"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 rounded-xl bg-black text-xl font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={onGoForgotPassword}
            className="w-fit text-base text-blue-700 underline underline-offset-2 transition hover:text-blue-900"
          >
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  );
}
