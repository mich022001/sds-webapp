import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Network,
  PieChart,
  RefreshCcw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import {
  ChartToggle,
  EmptyState,
  ProfileRow,
  ReportChart,
  SectionCard,
  Select,
  StatCard,
  fmtAmount,
  fmtDate,
  fmtNumber,
} from "../components/reports/RegionalReportUI";

function exportRowsCsv(filename, headers, rows) {
  if (!rows.length) return;

  const csvRows = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header.key] ?? "";
        return `"${String(value).replaceAll('"', '""')}"`;
      })
      .join(",")
  );

  const csv = [
    headers.map((header) => `"${header.label.replaceAll('"', '""')}"`).join(","),
    ...csvRows,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function buildMembershipRows(byType) {
  return Object.entries(byType || {})
    .map(([name, value]) => ({
      name,
      value: Number(value || 0),
      helper: `${fmtNumber(value)} members`,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildLevelRows(levels) {
  return levels
    .map((level) => ({
      name: level.level_title || `Level ${level.level}`,
      value: Number(level.member_count || 0),
      helper: `₱${fmtAmount(level.bonus_total)} bonus total`,
    }))
    .filter((row) => row.value > 0);
}

function buildBonusRows(data) {
  const totals = data?.totals || {};

  return [
    {
      name: "RM Rebates",
      value: Number(totals.totalRmRebates || totals.totalRebates || 0),
      helper: "Regional rebate earnings",
    },
    {
      name: "Group Sales Bonus",
      value: Number(totals.totalGroupSalesBonus || 0),
      helper: "Group sales compensation",
    },
    {
      name: "Redeemable Cash Bonus",
      value: Number(totals.redeemableCashBonus || totals.totalCashBonus || 0),
      helper: "Cash bonus from ledger",
    },
    {
      name: "Product Bonus",
      value: Number(totals.totalProductBonus || 0),
      helper: "Product incentive balance basis",
    },
  ].filter((row) => row.value > 0);
}

export default function RegionalReport() {
  const [rmList, setRmList] = useState([]);
  const [rm, setRm] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const [chartTypes, setChartTypes] = useState({
    membership: "bar",
    levels: "bar",
    bonuses: "bar",
  });

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRMs() {
      try {
        setLoadingMembers(true);
        setErr("");

        const res = await fetch("/api/members");
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || "Failed to load regional managers");
        }

        const rows = Array.isArray(json?.data) ? json.data : [];

        const rms = rows
          .filter((member) => member.membership_type === "Regional Manager")
          .map((member) => member.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setRmList(rms);
          if (rms[0]) setRm(rms[0]);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load regional managers");
        }
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadRMs();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadReport(rmName) {
    if (!rmName) return;

    try {
      setErr("");
      setLoadingReport(true);
      setData(null);

      const res = await fetch(
        `/api/reports?type=regional&rm=${encodeURIComponent(rmName)}`
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Failed to load regional report");
      }

      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load regional report");
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    if (rm) loadReport(rm);
  }, [rm]);

  const profile = data?.profile || null;
  const totals = data?.totals || null;
  const levels = Array.isArray(data?.levels) ? data.levels : [];
  const members = Array.isArray(data?.members) ? data.members : [];
  const rmRebates = Array.isArray(data?.rm_rebates) ? data.rm_rebates : [];
  const groupSalesBonus = Array.isArray(data?.group_sales_bonus)
    ? data.group_sales_bonus
    : [];

  const membershipChartRows = useMemo(
    () => buildMembershipRows(data?.byType),
    [data]
  );

  const levelChartRows = useMemo(() => buildLevelRows(levels), [levels]);

  const bonusChartRows = useMemo(() => buildBonusRows(data), [data]);

  useEffect(() => {
    function updateScrollState() {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [levels, data]);

  function scrollLevels(direction) {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  function updateChartType(key, value) {
    setChartTypes((prev) => ({ ...prev, [key]: value }));
  }

  function exportMembers() {
    exportRowsCsv(
      "regional-members",
      [
        { key: "name", label: "Name" },
        { key: "member_id", label: "Member ID" },
        { key: "membership_type", label: "Membership Type" },
        { key: "sponsor_name", label: "Sponsor" },
        { key: "relative_level", label: "Relative Level" },
        { key: "area_region", label: "Area / Region" },
        { key: "created_at", label: "Date Joined" },
      ],
      members.map((member) => ({
        name: member.name || "",
        member_id: member.member_id || "",
        membership_type: member.membership_type || "",
        sponsor_name: member.sponsor_name || "",
        relative_level: member.relative_level ?? "",
        area_region: member.area_region || "",
        created_at: fmtDate(member.created_at),
      }))
    );
  }

  function exportRebates() {
    exportRowsCsv(
      "regional-rebates",
      [
        { key: "date", label: "Date" },
        { key: "receiver", label: "Receiver" },
        { key: "buyer", label: "Buyer" },
        { key: "product", label: "Product" },
        { key: "qty", label: "Qty" },
        { key: "unit_type", label: "Unit Type" },
        { key: "rebate", label: "Rebate" },
      ],
      rmRebates.map((row) => ({
        date: fmtDate(row.created_at),
        receiver: row.receiver_name || "",
        buyer: row.buyer_name || "",
        product: row.product || "",
        qty: row.qty ?? "",
        unit_type: row.unit_type || "",
        rebate: fmtAmount(row.rebate),
      }))
    );
  }

  function exportGroupSales() {
    exportRowsCsv(
      "regional-group-sales-bonus",
      [
        { key: "date", label: "Date" },
        { key: "receiver", label: "Receiver" },
        { key: "buyer", label: "Buyer" },
        { key: "product", label: "Product" },
        { key: "qty", label: "Qty" },
        { key: "unit_type", label: "Unit Type" },
        { key: "bonus", label: "Bonus" },
      ],
      groupSalesBonus.map((row) => ({
        date: fmtDate(row.created_at),
        receiver: row.receiver_name || "",
        buyer: row.buyer_name || "",
        product: row.product || "",
        qty: row.qty ?? "",
        unit_type: row.unit_type || "",
        bonus: fmtAmount(row.bonus),
      }))
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Regional Intelligence
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Regional Report
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                Analyze regional manager network size, downline distribution,
                membership mix, rebates, group sales bonus, balances, and
                exportable regional records.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>
      </div>

      <SectionCard
        title="Report Criteria"
        subtitle="Select a regional manager to generate regional-level reporting."
        icon={Search}
      >
        <div className="grid items-end gap-3 md:grid-cols-[minmax(0,420px)_auto_auto]">
          <Select
            label="Regional Manager"
            value={rm}
            disabled={loadingMembers}
            onChange={(e) => setRm(e.target.value)}
          >
            {rmList.length === 0 ? <option value="">No RMs yet</option> : null}
            {rmList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <button
            type="button"
            disabled={!rm || loadingReport}
            onClick={() => loadReport(rm)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            <Search size={16} />
            {loadingReport ? "Loading..." : "Generate"}
          </button>

          <button
            type="button"
            disabled={loadingReport}
            onClick={() => {
              setErr("");
              setData(null);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Clear
          </button>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Members"
          value={fmtNumber(totals?.totalMembers)}
          helper="Downlines under selected RM"
          icon={Users}
          tone="blue"
        />

        <StatCard
          label="Total Cash Earned"
          value={`₱${fmtAmount(totals?.totalCashEarned)}`}
          helper="Rebates + group sales + cash bonus"
          icon={TrendingUp}
          tone="green"
        />

        <StatCard
          label="Cash Balance"
          value={`₱${fmtAmount(totals?.runningBalanceCash)}`}
          helper="Total cash earned minus redeemed cash"
          icon={WalletCards}
          tone="gold"
        />

        <StatCard
          label="Product Balance"
          value={fmtNumber(totals?.remainingProductBalance)}
          helper="Product bonus less redeemed product"
          icon={FileText}
          tone="purple"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard
          title="Regional Manager Profile"
          subtitle="Regional manager identity and assignment details."
          icon={UserRound}
        >
          {profile ? (
            <div className="grid gap-3">
              <ProfileRow label="Name" value={profile.name} />
              <ProfileRow label="ID Number" value={profile.member_id} />
              <ProfileRow label="Membership" value={profile.membership_type} />
              <ProfileRow label="Area / Region" value={profile.area_region} />
              <ProfileRow label="Address" value={profile.address} />
              <ProfileRow label="Contact Number" value={profile.contact} />
              <ProfileRow label="Email Address" value={profile.email} />
            </div>
          ) : (
            <EmptyState>Select a regional manager to view profile.</EmptyState>
          )}
        </SectionCard>

        <SectionCard
          title="Compensation Breakdown"
          subtitle="Rebates, group sales bonus, cash bonus, and product bonus."
          icon={BarChart3}
          right={
            <ChartToggle
              value={chartTypes.bonuses}
              onChange={(value) => updateChartType("bonuses", value)}
            />
          }
        >
          {loadingReport ? (
            <EmptyState>Loading compensation chart...</EmptyState>
          ) : (
            <ReportChart
              rows={bonusChartRows}
              type={chartTypes.bonuses}
              money
              emptyText="No compensation data found."
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Membership Type Distribution"
          subtitle="Counts grouped by downline membership type."
          icon={PieChart}
          right={
            <ChartToggle
              value={chartTypes.membership}
              onChange={(value) => updateChartType("membership", value)}
            />
          }
        >
          {loadingReport ? (
            <EmptyState>Loading membership chart...</EmptyState>
          ) : (
            <ReportChart
              rows={membershipChartRows}
              type={chartTypes.membership}
              emptyText="No membership type data found."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Downline Level Distribution"
          subtitle="Network count grouped by relative level under this RM."
          icon={Network}
          right={
            <ChartToggle
              value={chartTypes.levels}
              onChange={(value) => updateChartType("levels", value)}
            />
          }
        >
          {loadingReport ? (
            <EmptyState>Loading level chart...</EmptyState>
          ) : (
            <ReportChart
              rows={levelChartRows}
              type={chartTypes.levels}
              emptyText="No downline level data found."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Regional Members"
        subtitle={`${members.length} members under this regional manager.`}
        icon={Users}
        right={
          <button
            type="button"
            disabled={!members.length}
            onClick={exportMembers}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        {!data ? (
          <EmptyState>Select a regional manager to view member records.</EmptyState>
        ) : members.length === 0 ? (
          <EmptyState>No members found under this regional manager.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Name",
                    "Member ID",
                    "Membership",
                    "Sponsor",
                    "Level",
                    "Area / Region",
                    "Joined",
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
                {members.map((member, index) => (
                  <tr
                    key={`${member.member_id || member.name}-${index}`}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {member.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {member.member_id || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {member.membership_type || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {member.sponsor_name || "-"}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">
                      {member.relative_level ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {member.area_region || "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(member.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
