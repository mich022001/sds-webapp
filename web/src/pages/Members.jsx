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

function Input({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        {...props}
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className="min-h-[78px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
    />
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const className =
    s === "pending"
      ? "bg-amber-100 text-amber-800"
      : s === "completed"
        ? "bg-emerald-100 text-emerald-800"
        : s === "rejected"
          ? "bg-red-100 text-red-800"
          : "bg-zinc-100 text-zinc-700";

  return (
    <span className={cls("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {status || "-"}
    </span>
  );
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [err, setErr] = useState("");
  const [requestErr, setRequestErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [requestFilters, setRequestFilters] = useState({
    status: "",
    search: "",
  });
  const [adminNotesById, setAdminNotesById] = useState({});

  async function loadMembers() {
    try {
      setLoadingMembers(true);
      setErr("");

      const res = await fetch("/api/members");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load members");
      }

      setMembers(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadResetRequests() {
    try {
      setLoadingRequests(true);
      setRequestErr("");

      const qs = new URLSearchParams();
      qs.set("mode", "password_reset_requests");
      if (requestFilters.status) qs.set("status", requestFilters.status);
      if (requestFilters.search.trim()) qs.set("search", requestFilters.search.trim());

      const res = await fetch(`/api/members?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load password reset requests");
      }

      setResetRequests(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setRequestErr(e?.message || "Failed to load password reset requests");
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    loadResetRequests();
  }, [requestFilters.status, requestFilters.search]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;

    return members.filter((row) => {
      return (
        String(row.name || "").toLowerCase().includes(q) ||
        String(row.member_id || "").toLowerCase().includes(q) ||
        String(row.membership_type || "").toLowerCase().includes(q) ||
        String(row.sponsor_name || "").toLowerCase().includes(q) ||
        String(row.regional_manager || "").toLowerCase().includes(q)
      );
    });
  }, [members, memberSearch]);

  async function handleRequestAction(requestId, action) {
    try {
      setSaving(true);
      setRequestErr("");

      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          action,
          admin_notes: adminNotesById[requestId] || "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to process password reset request");
      }

      alert(json.message || "Password reset request updated successfully.");
      await loadResetRequests();
    } catch (e) {
      setRequestErr(e?.message || "Failed to process password reset request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card
        title="Members"
        right={
          <div className="w-full md:w-72">
            <Input
              label="Search Members"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, ID, type"
            />
          </div>
        }
      >
        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {loadingMembers ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-sm text-zinc-500">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-2 font-semibold text-zinc-700">Member ID</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Name</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Type</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Sponsor</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Regional Manager</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Package</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((row) => (
                  <tr key={row.member_id || row.name} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-700">{row.member_id}</td>
                    <td className="px-4 py-3 text-zinc-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.membership_type}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.sponsor_name || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.regional_manager || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">{row.package_name || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">{fmtDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Password Reset Requests"
        right={
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              label="Status"
              value={requestFilters.status}
              onChange={(e) =>
                setRequestFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </Select>

            <Input
              label="Search"
              value={requestFilters.search}
              onChange={(e) =>
                setRequestFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Member, username, or ID"
            />
          </div>
        }
      >
        {requestErr && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {requestErr}
          </div>
        )}

        {loadingRequests ? (
          <div className="text-sm text-zinc-500">Loading...</div>
        ) : resetRequests.length === 0 ? (
          <div className="text-sm text-zinc-500">No password reset requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Username</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Member ID</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Requested By</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Notes</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Status</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Admin Notes</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests.map((row) => {
                  const isPending = String(row.status || "").toLowerCase() === "pending";

                  return (
                    <tr key={row.id} className="border-b border-zinc-100 align-top">
                      <td className="px-4 py-3 text-zinc-700">{fmtDate(row.created_at)}</td>
                      <td className="px-4 py-3 text-zinc-900 font-medium">{row.member_name}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.username}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.member_id}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.requested_by}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {isPending ? (
                          <Textarea
                            value={adminNotesById[row.id] ?? row.admin_notes ?? ""}
                            onChange={(e) =>
                              setAdminNotesById((prev) => ({
                                ...prev,
                                [row.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional admin notes"
                          />
                        ) : (
                          row.admin_notes || "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                handleRequestAction(row.id, "complete_password_reset")
                              }
                              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                            >
                              Reset to Member ID
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                handleRequestAction(row.id, "reject_password_reset")
                              }
                              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500">
                            {row.status === "completed"
                              ? `Completed by ${row.completed_by || "-"}`
                              : row.status === "rejected"
                                ? `Rejected by ${row.rejected_by || "-"}`
                                : "-"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
