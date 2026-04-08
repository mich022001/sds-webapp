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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
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
        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="grid min-w-0 gap-1">
      {label ? (
        <span className="text-xs font-medium text-zinc-600">{label}</span>
      ) : null}
      <textarea
        {...props}
        className="min-h-[78px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
      />
    </label>
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
    <span
      className={cls("rounded-full px-2.5 py-1 text-xs font-semibold", className)}
    >
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

export default function Members({ user }) {
  const [members, setMembers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSelectedMember, setLoadingSelectedMember] = useState(false);

  const [err, setErr] = useState("");
  const [requestErr, setRequestErr] = useState("");
  const [memberEditErr, setMemberEditErr] = useState("");
  const [memberEditMsg, setMemberEditMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [requestFilters, setRequestFilters] = useState({
    status: "",
    search: "",
  });
  const [adminNotesById, setAdminNotesById] = useState({});

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    area_region: "",
    membership_type: "Member",
  });

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

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
      if (requestFilters.search.trim()) {
        qs.set("search", requestFilters.search.trim());
      }

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

  async function loadSelectedMember(memberId) {
    if (!memberId) {
      setSelectedMemberId("");
      setSelectedMember(null);
      setMemberForm({
        name: "",
        contact: "",
        email: "",
        address: "",
        area_region: "",
        membership_type: "Member",
      });
      setMemberEditErr("");
      setMemberEditMsg("");
      return;
    }

    try {
      setLoadingSelectedMember(true);
      setMemberEditErr("");
      setMemberEditMsg("");

      const res = await fetch(
        `/api/members?member_id=${encodeURIComponent(memberId)}`
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load selected member");
      }

      const row = Array.isArray(json?.data) ? json.data[0] : null;

      setSelectedMemberId(memberId);
      setSelectedMember(row || null);
      setMemberForm({
        name: row?.name || "",
        contact: row?.contact || "",
        email: row?.email || "",
        address: row?.address || "",
        area_region: row?.area_region || "",
        membership_type: row?.membership_type || "Member",
      });
    } catch (e) {
      setMemberEditErr(e?.message || "Failed to load selected member");
      setSelectedMemberId(memberId);
      setSelectedMember(null);
    } finally {
      setLoadingSelectedMember(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadResetRequests();
    }
  }, [requestFilters.status, requestFilters.search, isAdmin]);

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

  function resetMemberFormFromSelected() {
    setMemberForm({
      name: selectedMember?.name || "",
      contact: selectedMember?.contact || "",
      email: selectedMember?.email || "",
      address: selectedMember?.address || "",
      area_region: selectedMember?.area_region || "",
      membership_type: selectedMember?.membership_type || "Member",
    });
    setMemberEditErr("");
    setMemberEditMsg("");
  }

  async function handleSaveMember(e) {
    e.preventDefault();

    if (!selectedMember?.member_id) {
      setMemberEditErr("No member selected.");
      setMemberEditMsg("");
      return;
    }

    try {
      setSavingMember(true);
      setMemberEditErr("");
      setMemberEditMsg("");

      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "update_member",
          member_id: selectedMember.member_id,
          name: memberForm.name,
          contact: memberForm.contact,
          email: memberForm.email,
          address: memberForm.address,
          area_region: memberForm.area_region,
          membership_type: memberForm.membership_type,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to update member");
      }

      setMemberEditMsg(json.message || "Member updated successfully.");

      const updated =
        json?.data && typeof json.data === "object" ? json.data : selectedMember;

      setSelectedMember(updated);
      setMemberForm({
        name: updated?.name || "",
        contact: updated?.contact || "",
        email: updated?.email || "",
        address: updated?.address || "",
        area_region: updated?.area_region || "",
        membership_type: updated?.membership_type || "Member",
      });

      await loadMembers();
    } catch (e) {
      setMemberEditErr(e?.message || "Failed to update member");
      setMemberEditMsg("");
    } finally {
      setSavingMember(false);
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
                  <th className="px-4 py-2 font-semibold text-zinc-700">
                    Regional Manager
                  </th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Package</th>
                  <th className="px-4 py-2 font-semibold text-zinc-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((row) => {
                  const isSelected = selectedMemberId === row.member_id;

                  return (
                    <tr
                      key={row.member_id || row.name}
                      className={cls(
                        "cursor-pointer border-b border-zinc-100 transition hover:bg-zinc-50",
                        isSelected && "bg-zinc-50"
                      )}
                      onClick={() => loadSelectedMember(row.member_id)}
                    >
                      <td className="px-4 py-3 text-zinc-700">{row.member_id}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.membership_type}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.sponsor_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.regional_manager || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.package_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {fmtDate(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedMemberId && (
        <Card
          title={
            isSuperAdmin ? "Selected Member — Edit Details" : "Selected Member Details"
          }
        >
          {loadingSelectedMember ? (
            <div className="text-sm text-zinc-500">Loading member details...</div>
          ) : !selectedMember ? (
            <div className="text-sm text-zinc-500">Member details not found.</div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSaveMember}>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="Member ID"
                  value={selectedMember.member_id || ""}
                  disabled
                  readOnly
                />
                <Input
                  label="Sponsor"
                  value={selectedMember.sponsor_name || ""}
                  disabled
                  readOnly
                />
                <Input
                  label="Regional Manager"
                  value={selectedMember.regional_manager || ""}
                  disabled
                  readOnly
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Name"
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={!isSuperAdmin || savingMember}
                />

                <Select
                  label="Membership Type"
                  value={memberForm.membership_type}
                  onChange={(e) =>
                    setMemberForm((prev) => ({
                      ...prev,
                      membership_type: e.target.value,
                    }))
                  }
                  disabled={!isSuperAdmin || savingMember}
                >
                  <option value="Member">Member</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Stockiest">Stockiest</option>
                  <option value="Area Manager">Area Manager</option>
                  <option value="Regional Manager">Regional Manager</option>
                </Select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Contact"
                  value={memberForm.contact}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, contact: e.target.value }))
                  }
                  disabled={!isSuperAdmin || savingMember}
                />
                <Input
                  label="Email"
                  value={memberForm.email}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={!isSuperAdmin || savingMember}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Area / Region"
                  value={memberForm.area_region}
                  onChange={(e) =>
                    setMemberForm((prev) => ({
                      ...prev,
                      area_region: e.target.value,
                    }))
                  }
                  disabled={!isSuperAdmin || savingMember}
                />
                <Input
                  label="Package"
                  value={selectedMember.package_name || ""}
                  disabled
                  readOnly
                />
              </div>

              <Textarea
                label="Address"
                value={memberForm.address}
                onChange={(e) =>
                  setMemberForm((prev) => ({ ...prev, address: e.target.value }))
                }
                disabled={!isSuperAdmin || savingMember}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Created"
                  value={fmtDate(selectedMember.created_at)}
                  disabled
                  readOnly
                />
                <Input
                  label="Level"
                  value={String(selectedMember.level ?? "")}
                  disabled
                  readOnly
                />
              </div>

              {!isSuperAdmin && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                  Only super admin can edit member details.
                </div>
              )}

              {memberEditErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {memberEditErr}
                </div>
              )}

              {memberEditMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {memberEditMsg}
                </div>
              )}

              {isSuperAdmin && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={savingMember}
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {savingMember ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    disabled={savingMember}
                    onClick={resetMemberFormFromSelected}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Reset Form
                  </button>
                </div>
              )}
            </form>
          )}
        </Card>
      )}

      {isAdmin && (
        <Card
          title="Password Reset Requests"
          right={
            <div className="grid gap-2 md:grid-cols-2">
              <Select
                label="Status"
                value={requestFilters.status}
                onChange={(e) =>
                  setRequestFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
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
                  setRequestFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
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
            <div className="text-sm text-zinc-500">
              No password reset requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2 font-semibold text-zinc-700">Date</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Member</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Username
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Member ID
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Requested By
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Notes</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">Status</th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Admin Notes
                    </th>
                    <th className="px-4 py-2 font-semibold text-zinc-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.map((row) => {
                    const isPending =
                      String(row.status || "").toLowerCase() === "pending";

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-zinc-100 align-top"
                      >
                        <td className="px-4 py-3 text-zinc-700">
                          {fmtDate(row.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {row.member_name}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.username}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.member_id}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.requested_by}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.notes || "-"}
                        </td>
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
                                  handleRequestAction(
                                    row.id,
                                    "complete_password_reset"
                                  )
                                }
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                              >
                                Reset to Member ID
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleRequestAction(
                                    row.id,
                                    "reject_password_reset"
                                  )
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
      )}
    </div>
  );
}
