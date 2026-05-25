import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Lock,
  RotateCcw,
  Save,
  Search,
  Select,
  StatusBadge,
  Textarea,
  UserCog,
  Users,
  cls,
} from "../components/members/MembersUI";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function MembershipBadge({ type }) {
  return (
    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
      {type || "-"}
    </span>
  );
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

      if (!res.ok) throw new Error(json.error || "Failed to load members");

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

      if (!res.ok) throw new Error(json.error || "Failed to load selected member");

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
    if (isAdmin) loadResetRequests();
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

  const memberStats = useMemo(() => {
    const total = members.length;
    const regionalManagers = members.filter(
      (m) =>
        String(m.membership_type || "").trim().toLowerCase() ===
        "regional manager"
    ).length;
    const areaManagers = members.filter(
      (m) =>
        String(m.membership_type || "").trim().toLowerCase() === "area manager"
    ).length;
    const distributors = members.filter(
      (m) =>
        String(m.membership_type || "").trim().toLowerCase() === "distributor"
    ).length;

    return { total, regionalManagers, areaManagers, distributors };
  }, [members]);

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

      if (!res.ok) throw new Error(json.error || "Failed to update member");

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
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Member Administration
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Members Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monitor SDS members, hierarchy ownership, packages, and account
                support requests.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <Users size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Members", memberStats.total],
          ["Regional Managers", memberStats.regionalManagers],
          ["Area Managers", memberStats.areaManagers],
          ["Distributors", memberStats.distributors],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {label}
            </div>
            <div className="mt-2 text-3xl font-black text-slate-950">
              {value}
            </div>
          </div>
        ))}
      </div>

      <Card
        title="Members"
        icon={Users}
        right={
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
            />
            <Input
              label="Search Members"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, ID, type"
              className="[&_input]:pl-9"
            />
          </div>
        }
      >
        {err && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {err}
          </div>
        )}

        {loadingMembers ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            No members found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Member ID",
                    "Name",
                    "Type",
                    "Sponsor",
                    "Regional Manager",
                    "Package",
                    "Created",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((row) => {
                  const isSelected = selectedMemberId === row.member_id;

                  return (
                    <tr
                      key={row.member_id || row.name}
                      className={cls(
                        "cursor-pointer border-b border-slate-100 transition hover:bg-slate-50",
                        isSelected && "bg-blue-50/60"
                      )}
                      onClick={() => loadSelectedMember(row.member_id)}
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                        {row.member_id}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-950">
                        {row.name}
                      </td>
                      <td className="px-4 py-4">
                        <MembershipBadge type={row.membership_type} />
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {row.sponsor_name || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {row.regional_manager || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {row.package_name || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
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
          icon={UserCog}
        >
          {loadingSelectedMember ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Loading member details...
            </div>
          ) : !selectedMember ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Member details not found.
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleSaveMember}>
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="Member ID" value={selectedMember.member_id || ""} disabled readOnly />
                <Input label="Sponsor" value={selectedMember.sponsor_name || ""} disabled readOnly />
                <Input label="Regional Manager" value={selectedMember.regional_manager || ""} disabled readOnly />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Contact"
                  value={memberForm.contact}
                  onChange={(e) =>
                    setMemberForm((prev) => ({
                      ...prev,
                      contact: e.target.value,
                    }))
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

              <div className="grid gap-4 md:grid-cols-2">
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
                <Input label="Package" value={selectedMember.package_name || ""} disabled readOnly />
              </div>

              <Textarea
                label="Address"
                value={memberForm.address}
                onChange={(e) =>
                  setMemberForm((prev) => ({ ...prev, address: e.target.value }))
                }
                disabled={!isSuperAdmin || savingMember}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Created" value={fmtDate(selectedMember.created_at)} disabled readOnly />
                <Input label="Level" value={String(selectedMember.level ?? "")} disabled readOnly />
              </div>

              {!isSuperAdmin && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Only super admin can edit member details.
                </div>
              )}

              {memberEditErr && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {memberEditErr}
                </div>
              )}

              {memberEditMsg && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {memberEditMsg}
                </div>
              )}

              {isSuperAdmin && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <Button type="submit" icon={Save} disabled={savingMember}>
                    {savingMember ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    icon={RotateCcw}
                    disabled={savingMember}
                    onClick={resetMemberFormFromSelected}
                  >
                    Reset Form
                  </Button>
                </div>
              )}
            </form>
          )}
        </Card>
      )}

      {isAdmin && (
        <Card
          title="Password Reset Requests"
          icon={Lock}
          right={
            <div className="grid w-full gap-3 sm:w-auto md:grid-cols-2">
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
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {requestErr}
            </div>
          )}

          {loadingRequests ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Loading password reset requests...
            </div>
          ) : resetRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              No password reset requests found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[1280px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {[
                      "Date",
                      "Member",
                      "Username",
                      "Member ID",
                      "Requested By",
                      "Notes",
                      "Status",
                      "Admin Notes",
                      "Actions",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {resetRequests.map((row) => {
                    const isPending =
                      String(row.status || "").toLowerCase() === "pending";

                    return (
                      <tr key={row.id} className="border-b border-slate-100 align-top">
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {fmtDate(row.created_at)}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-950">
                          {row.member_name}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.username}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                          {row.member_id}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.requested_by}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {row.notes || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-4 text-slate-700">
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
                        <td className="px-4 py-4">
                          {isPending ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={saving}
                                onClick={() =>
                                  handleRequestAction(
                                    row.id,
                                    "complete_password_reset"
                                  )
                                }
                              >
                                Reset to Member ID
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                disabled={saving}
                                onClick={() =>
                                  handleRequestAction(
                                    row.id,
                                    "reject_password_reset"
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">
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
