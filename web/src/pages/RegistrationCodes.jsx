import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  FileCheck2,
  Filter,
  KeyRound,
  Layers3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Ticket,
  TicketCheck,
  TicketX,
} from "lucide-react";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, children, right, className = "", icon: Icon }) {
  return (
    <div
      className={cls(
        "max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
            )}

            <div>
              <div className="font-bold text-slate-950">{title}</div>
            </div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function Select({ label, children, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        {...props}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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
        variant === "dark" &&
          "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
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

function Stat({ label, value, hint, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ row }) {
  if (row.is_used) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        Used
      </span>
    );
  }

  if (row.is_active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
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
    if (row.is_used) return;

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

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
  }

  const filteredRows = rows.filter((r) => {
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
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Code Administration
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Registration Codes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Generate, monitor, and control member registration codes.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <KeyRound size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total Codes"
          value={String(stats.total)}
          hint="All generated codes"
          icon={Ticket}
          tone="blue"
        />
        <Stat
          label="Unused Codes"
          value={String(stats.unused)}
          hint="Ready for registration"
          icon={TicketCheck}
          tone="green"
        />
        <Stat
          label="Used Codes"
          value={String(stats.used)}
          hint="Already assigned"
          icon={FileCheck2}
          tone="gold"
        />
        <Stat
          label="Active Codes"
          value={String(stats.active)}
          hint="Currently valid"
          icon={ShieldCheck}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Create Single Code" icon={Plus} className="min-w-0">
          <form className="grid gap-4" onSubmit={createSingleCode}>
            <Input
              label="Manual Code Optional"
              placeholder="Leave blank to auto-generate"
              value={singleCode}
              onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Use manual code only when admin has a specific code to issue.
              </div>

              <Button type="submit" icon={Ticket} disabled={savingSingle}>
                {savingSingle ? "Saving..." : "Create Code"}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Bulk Generate Codes" icon={Layers3} className="min-w-0">
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
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBulkQty(n)}
                  className={cls(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition",
                    Number(bulkQty) === n
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Bulk generation supports 1 to 500 codes per request.
              </div>

              <Button type="submit" icon={Layers3} disabled={savingBulk}>
                {savingBulk ? "Generating..." : "Generate Codes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card
        title="Registration Code Monitoring"
        icon={Filter}
        right={
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(220px,1fr)_170px]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
              />
              <Input
                label="Search"
                placeholder="Code / member / sponsor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="[&_input]:pl-9"
              />
            </div>

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        }
        className="min-w-0"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {filteredRows.length}
            </span>{" "}
            of <span className="font-bold text-slate-900">{rows.length}</span>{" "}
            codes.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="dark" icon={RefreshCw} onClick={loadRows}>
              Refresh
            </Button>

            <Button
              type="button"
              variant="ghost"
              icon={RotateCcw}
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {err}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[1250px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Member ID
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Member Name
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Sponsor
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Recruited By
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Used At
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Created At
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                    Loading codes...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                    No registration codes found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs font-bold text-slate-800">
                          {r.code}
                        </span>

                        <button
                          type="button"
                          onClick={() => copyCode(r.code)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-white hover:text-blue-700"
                          title="Copy code"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill row={r} />
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {r.used_by_member_id || "-"}
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-800">
                      {r.used_by_member_name || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {r.sponsor_name || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {r.recruited_by_name || "-"}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatDate(r.used_at)}
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatDate(r.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={r.is_used}
                        onClick={() => toggleActive(r)}
                        className={cls(
                          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition",
                          r.is_used
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                            : r.is_active
                              ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        )}
                      >
                        {r.is_used ? (
                          <>
                            <CheckCircle2 size={13} />
                            Used
                          </>
                        ) : r.is_active ? (
                          <>
                            <TicketX size={13} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <TicketCheck size={13} />
                            Activate
                          </>
                        )}
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
