import { useEffect, useMemo, useState } from "react";

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

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-1", className)}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
      />
    </label>
  );
}

function Select({ label, children, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-1", className)}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <select
        {...props}
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
      >
        {children}
      </select>
    </label>
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

export default function RegistrationCodes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSingle, setSavingSingle] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [singleCode, setSingleCode] = useState("");
  const [bulkQty, setBulkQty] = useState(10);

  async function loadRows() {
    try {
      setLoading(true);
      setErr("");

      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/registration-codes${qs}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load codes");

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [status]);

  const stats = useMemo(() => {
    const total = rows.length;
    const used = rows.filter((r) => r.is_used).length;
    const unused = rows.filter((r) => !r.is_used).length;
    const active = rows.filter((r) => r.is_active).length;
    return { total, used, unused, active };
  }, [rows]);

  async function createSingleCode(e) {
    e.preventDefault();

    try {
      setSavingSingle(true);
      setErr("");

      const res = await fetch("/api/registration-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          code: singleCode.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create code");

      setSingleCode("");
      await loadRows();
      alert("Registration code created.");
    } catch (e) {
      setErr(e?.message || "Failed to create code");
    } finally {
      setSavingSingle(false);
    }
  }

  async function createBulkCodes(e) {
    e.preventDefault();

    try {
      setSavingBulk(true);
      setErr("");

      const qty = Number(bulkQty || 0);
      if (!Number.isFinite(qty) || qty < 1 || qty > 500) {
        throw new Error("Bulk quantity must be between 1 and 500");
      }

      const res = await fetch("/api/registration-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bulk",
          quantity: qty,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to generate codes");

      await loadRows();
      alert(`${qty} registration codes generated.`);
    } catch (e) {
      setErr(e?.message || "Failed to generate codes");
    } finally {
      setSavingBulk(false);
    }
  }

  async function toggleActive(row) {
    try {
      setErr("");

      const res = await fetch("/api/registration-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          is_active: !row.is_active,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update code");

      await loadRows();
    } catch (e) {
      setErr(e?.message || "Failed to update code");
    }
  }

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Codes" value={String(stats.total)} />
        <Stat label="Unused Codes" value={String(stats.unused)} />
        <Stat label="Used Codes" value={String(stats.used)} />
        <Stat label="Active Codes" value={String(stats.active)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Create Single Code" className="min-w-0">
          <form className="grid gap-4" onSubmit={createSingleCode}>
            <Input
              label="Manual Code (optional)"
              placeholder="Leave blank to auto-generate"
              value={singleCode}
              onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={savingSingle}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {savingSingle ? "Saving..." : "Create Code"}
              </button>
            </div>
          </form>
        </Card>

        <Card title="Bulk Generate Codes" className="min-w-0">
          <form className="grid gap-4" onSubmit={createBulkCodes}>
            <Input
              label="Quantity"
              type="number"
              min="1"
              max="500"
              value={bulkQty}
              onChange={(e) => setBulkQty(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={savingBulk}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {savingBulk ? "Generating..." : "Generate Codes"}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card
        title="Registration Code Monitoring"
        right={
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Search"
              placeholder="Code / member / sponsor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">all</option>
              <option value="unused">unused</option>
              <option value="used">used</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </div>
        }
        className="min-w-0"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadRows}
            className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              loadRows();
            }}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Clear Filters
          </button>

          <button
            type="button"
            onClick={loadRows}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Apply Search
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-semibold text-zinc-700">Code</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Active</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Used</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Used By Member ID</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Used By Member Name</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Sponsor</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Recruited By</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Used At</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Created At</th>
                <th className="px-4 py-2 font-semibold text-zinc-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={10}>
                    Loading codes...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-zinc-500" colSpan={10}>
                    No registration codes found.
                  </td>
                </tr>
              ) : (
                rows
                  .filter((r) => {
                    if (!search.trim()) return true;
                    const s = search.trim().toLowerCase();
                    return [
                      r.code,
                      r.used_by_member_id,
                      r.used_by_member_name,
                      r.sponsor_name,
                      r.recruited_by_name,
                    ]
                      .map((x) => String(x || "").toLowerCase())
                      .some((x) => x.includes(s));
                  })
                  .map((r) => (
                    <tr key={r.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-mono text-zinc-800">{r.code}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.is_active ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.is_used ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.used_by_member_id || "-"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.used_by_member_name || "-"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.sponsor_name || "-"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.recruited_by_name || "-"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.used_at || "-"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.created_at || "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(r)}
                          className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          {r.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
