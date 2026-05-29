import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Gift,
  Network,
  PieChart,
  RefreshCcw,
  Search,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fmtAmount(value) {
  const number = Number(value || 0);

  return Number.isFinite(number)
    ? number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function fmtDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
    </label>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, right }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={18} />
            </div>

            <div>
              <div className="font-bold text-slate-950">{title}</div>
              {subtitle ? (
                <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
              ) : null}
            </div>
          </div>

          {right}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
      {children}
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
          {helper ? (
            <div className="mt-1 text-xs text-slate-500">{helper}</div>
          ) : null}
        </div>

        {Icon ? (
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 ring-1 ring-blue-100">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChartToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange("bar")}
        className={cls(
          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
          value === "bar"
            ? "bg-blue-700 text-white"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <BarChart3 size={14} />
        Bar
      </button>

      <button
        type="button"
        onClick={() => onChange("pie")}
        className={cls(
          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
          value === "pie"
            ? "bg-blue-700 text-white"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <PieChart size={14} />
        Pie
      </button>
    </div>
  );
}

function SimpleBarChart({ rows, emptyText, money = true }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.slice(0, 10).map((row, index) => {
        const percent = Math.max(
          5,
          Math.round((Number(row.value || 0) / max) * 100)
        );

        return (
          <div
            key={`${row.name}-${index}`}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-950">
                  {row.name}
                </div>
                {row.helper ? (
                  <div className="text-xs text-slate-500">{row.helper}</div>
                ) : null}
              </div>

              <div className="shrink-0 text-sm font-black text-slate-950">
                {money ? `₱${fmtAmount(row.value)}` : row.value}
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimplePieChart({ rows, emptyText, money = true }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
  let running = 0;

  const hexColors = [
    "#1d4ed8",
    "#eab308",
    "#059669",
    "#7c3aed",
    "#dc2626",
    "#0891b2",
    "#475569",
    "#ea580c",
    "#16a34a",
    "#9333ea",
  ];

  const dotColors = [
    "bg-blue-700",
    "bg-yellow-500",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-red-600",
    "bg-cyan-600",
    "bg-slate-600",
    "bg-orange-600",
    "bg-green-600",
    "bg-purple-600",
  ];

  const gradient = rows
    .slice(0, 10)
    .map((row, index) => {
      const value = Number(row.value || 0);
      const start = total > 0 ? (running / total) * 100 : 0;
      running += value;
      const end = total > 0 ? (running / total) * 100 : 0;
      return `${hexColors[index % hexColors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div
        className="mx-auto h-52 w-52 rounded-full border border-slate-200 shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
      />

      <div className="space-y-3">
        {rows.slice(0, 10).map((row, index) => {
          const percent = total > 0 ? (Number(row.value || 0) / total) * 100 : 0;

          return (
            <div
              key={`${row.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cls(
                    "h-3 w-3 shrink-0 rounded-full",
                    dotColors[index % dotColors.length]
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-950">
                    {row.name}
                  </div>
                  {row.helper ? (
                    <div className="text-xs text-slate-500">{row.helper}</div>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-black text-slate-950">
                  {money ? `₱${fmtAmount(row.value)}` : row.value}
                </div>
                <div className="text-xs text-slate-500">
                  {percent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportChart({ rows, type, emptyText, money = true }) {
  if (type === "pie") {
    return <SimplePieChart rows={rows} emptyText={emptyText} money={money} />;
  }

  return <SimpleBarChart rows={rows} emptyText={emptyText} money={money} />;
}

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

function groupByBonusLabel(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const label =
      String(row.bonus_label || row.rule_applied || row.reason || "").trim() ||
      "Unlabeled Bonus";

    const current = map.get(label) || {
      name: label,
      value: 0,
      count: 0,
      helper: "0 records",
    };

    const next = {
      ...current,
      value: current.value + Number(row.amount || 0),
      count: current.count + 1,
    };

    next.helper = `${next.count} bonus records`;
    map.set(label, next);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function buildLevelRows(levels) {
  return levels
    .map((level) => ({
      name: level.level_title || `Level ${level.level}`,
      value: Number(level.member_count || 0),
      helper: `${fmtAmount(level.bonus_total)} bonus total`,
    }))
    .filter((row) => row.value > 0);
}

function ProfileRow({ label, value }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="break-words text-sm font-bold text-slate-900">
        {value || "-"}
      </div>
    </div>
  );
}

export default function MemberReport() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  const [chartTypes, setChartTypes] = useState({
    bonus: "bar",
    levels: "bar",
  });

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);
        setErr("");

        const res = await fetch("/api/members");
        const json = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(json.error || "Failed to load members");

        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) {
          setMembers(data);
          if (data[0]?.name) setSelected(data[0].name);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadReport(name) {
    if (!name) return;

    try {
      setErr("");
      setLoadingReport(true);
      setReport(null);

      const res = await fetch(
        `/api/reports?type=member&name=${encodeURIComponent(name)}`
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load member report");

      setReport(json);
    } catch (e) {
      setErr(e?.message || "Failed to load member report.");
    } finally {
      setLoadingReport(false);
    }
  }

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
  }, [report]);

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

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;

    return members.filter((member) => {
      const text = [
        member.name,
        member.member_id,
        member.membership_type,
        member.sponsor_name,
        member.regional_manager,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [members, memberSearch]);

  const member = report?.member || null;
  const totals = report?.totals || null;
  const levels = Array.isArray(report?.levels) ? report.levels : [];
  const bonuses = Array.isArray(report?.bonuses) ? report.bonuses : [];
  const redemptions = Array.isArray(report?.redemptions)
    ? report.redemptions
    : [];
  const downlines = Array.isArray(report?.downlines) ? report.downlines : [];

  const bonusChartRows = useMemo(() => groupByBonusLabel(bonuses), [bonuses]);
  const levelChartRows = useMemo(() => buildLevelRows(levels), [levels]);

  const summary = useMemo(() => {
    const totalMembers = downlines.length;
    const activeLevels = levels.filter((level) => Number(level.member_count || 0) > 0)
      .length;

    return {
      totalCash: Number(totals?.total_cash || 0),
      balanceCash: Number(totals?.balance_cash || 0),
      totalProduct: Number(totals?.total_product || 0),
      productBalance: Number(totals?.balance_product || 0),
      totalMembers,
      activeLevels,
      bonusRecords: bonuses.length,
      redemptionRecords: redemptions.length,
    };
  }, [bonuses.length, downlines.length, levels, redemptions.length, totals]);

  function clearReport() {
    setErr("");
    setReport(null);
  }

  function exportBonuses() {
    exportRowsCsv(
      "member-bonus-history",
      [
        { key: "date", label: "Date" },
        { key: "earner", label: "Earner" },
        { key: "source", label: "Source Member" },
        { key: "level", label: "Relative Level" },
        { key: "type", label: "Bonus Type" },
        { key: "label", label: "Bonus Label" },
        { key: "amount", label: "Amount" },
        { key: "redeemable", label: "Redeemable" },
      ],
      bonuses.map((row) => ({
        date: fmtDate(row.created_at),
        earner: row.earner_name || "",
        source: row.source_member_name || "",
        level: row.relative_level ?? "",
        type: row.bonus_type || "",
        label: row.bonus_label || row.rule_applied || row.reason || "",
        amount: fmtAmount(row.amount),
        redeemable: row.is_redeemable === true ? "Yes" : "No",
      }))
    );
  }

  function exportRedemptions() {
    exportRowsCsv(
      "member-redemption-history",
      [
        { key: "date", label: "Date" },
        { key: "member", label: "Member" },
        { key: "type", label: "Redeem Type" },
        { key: "qty", label: "Quantity / Amount" },
        { key: "source", label: "Source" },
        { key: "notes", label: "Notes" },
      ],
      redemptions.map((row) => ({
        date: fmtDate(row.created_at),
        member: row.member_name || "",
        type: row.redeem_type || "",
        qty: row.qty ?? 0,
        source: row.source || "",
        notes: row.notes || "",
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
                Member Intelligence
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Member Report
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                Generate a formal member report covering profile details,
                bonus balances, redemptions, genealogy, and downline network
                activity.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <UserRound size={22} />
            </div>
          </div>
        </div>
      </div>

      <SectionCard
        title="Report Criteria"
        subtitle="Select a member and generate a member-specific report."
        icon={Search}
      >
        <div className="grid items-end gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
          <Input
            label="Search Members"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search by name, ID, membership, sponsor, or RM"
            disabled={loadingMembers}
          />

          <Select
            label="Select Member"
            value={selected}
            disabled={loadingMembers}
            onChange={(e) => setSelected(e.target.value)}
          >
            {filteredMembers.map((m) => (
              <option key={m.member_id || m.name} value={m.name}>
                {m.name} {m.member_id ? `(${m.member_id})` : ""}
              </option>
            ))}
          </Select>

          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            onClick={() => selected && loadReport(selected)}
            disabled={!selected || loadingReport}
          >
            <Search size={16} />
            {loadingReport ? "Loading..." : "Generate"}
          </button>

          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            onClick={clearReport}
            disabled={loadingReport}
          >
            <RefreshCcw size={16} />
            Clear
          </button>
        </div>

        {loadingReport ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Loading member report...
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Cash Issued"
          value={`₱${fmtAmount(summary.totalCash)}`}
          helper={`${summary.bonusRecords} bonus records`}
          icon={Gift}
        />

        <StatCard
          label="Cash Balance"
          value={`₱${fmtAmount(summary.balanceCash)}`}
          helper="Redeemable cash minus redeemed cash"
          icon={WalletCards}
        />

        <StatCard
          label="Product Balance"
          value={summary.productBalance}
          helper={`${summary.totalProduct} total product bonus`}
          icon={FileText}
        />

        <StatCard
          label="Network Size"
          value={summary.totalMembers}
          helper={`${summary.activeLevels} active downline levels`}
          icon={Network}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard
          title="Member Profile"
          subtitle="Core member identity and placement details."
          icon={UserRound}
        >
          {member ? (
            <div className="grid gap-3">
              <ProfileRow label="Name" value={member.name} />
              <ProfileRow label="Member ID" value={member.member_id} />
              <ProfileRow label="Membership" value={member.membership_type} />
              <ProfileRow label="Sponsor" value={member.sponsor_name || "SDS"} />
              <ProfileRow
                label="Regional Manager"
                value={member.regional_manager || "-"}
              />
              <ProfileRow label="Area / Region" value={member.area_region || "-"} />
              <ProfileRow label="Member Since" value={fmtDate(member.created_at)} />
            </div>
          ) : (
            <EmptyState>Generate a report to view member profile.</EmptyState>
          )}
        </SectionCard>

        <SectionCard
          title="Bonus Composition"
          subtitle="Bonus totals grouped by bonus label and compensation source."
          icon={BarChart3}
          right={
            <ChartToggle
              value={chartTypes.bonus}
              onChange={(value) => updateChartType("bonus", value)}
            />
          }
        >
          {loadingReport ? (
            <EmptyState>Loading bonus chart...</EmptyState>
          ) : (
            <ReportChart
              rows={bonusChartRows}
              type={chartTypes.bonus}
              emptyText="Generate a report to view bonus chart."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Downline Distribution"
        subtitle="Network count by relative level."
        icon={Users}
        right={
          <ChartToggle
            value={chartTypes.levels}
            onChange={(value) => updateChartType("levels", value)}
          />
        }
      >
        {loadingReport ? (
          <EmptyState>Loading downline chart...</EmptyState>
        ) : (
          <ReportChart
            rows={levelChartRows}
            type={chartTypes.levels}
            money={false}
            emptyText="Generate a report to view downline distribution."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Bonus History"
        subtitle={`${bonuses.length} bonus and compensation records.`}
        icon={Gift}
        right={
          <button
            type="button"
            disabled={bonuses.length === 0}
            onClick={exportBonuses}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        {!report ? (
          <EmptyState>Generate a report to view bonus history.</EmptyState>
        ) : bonuses.length === 0 ? (
          <EmptyState>No bonus records found for this member.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {[
                    "Date",
                    "Source Member",
                    "Level",
                    "Type",
                    "Label",
                    "Amount",
                    "Redeemable",
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
                {bonuses.map((row, index) => (
                  <tr
                    key={`${row.created_at}-${row.source_member_name}-${index}`}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {row.source_member_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.relative_level ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.bonus_type || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.bonus_label || row.rule_applied || row.reason || "-"}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">
                      ₱{fmtAmount(row.amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.is_redeemable === true ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Redemption History"
        subtitle={`${redemptions.length} redemption records.`}
        icon={WalletCards}
        right={
          <button
            type="button"
            disabled={redemptions.length === 0}
            onClick={exportRedemptions}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      >
        {!report ? (
          <EmptyState>Generate a report to view redemption history.</EmptyState>
        ) : redemptions.length === 0 ? (
          <EmptyState>No redemption records found for this member.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {["Date", "Type", "Qty / Amount", "Source", "Notes"].map(
                    (head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                      >
                        {head}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {redemptions.map((row, index) => (
                  <tr
                    key={`${row.created_at}-${row.redeem_type}-${index}`}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {row.redeem_type || "-"}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-950">
                      {row.qty ?? 0}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.source || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {row.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Downlines by Level"
        subtitle="Detailed genealogy view grouped by relative level."
        icon={Network}
        right={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 md:inline">
              Swipe or use arrows to view more levels
            </span>
            <button
              type="button"
              onClick={() => scrollLevels(-1)}
              disabled={!canScrollLeft}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollLevels(1)}
              disabled={!canScrollRight}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              →
            </button>
          </div>
        }
      >
        {!report ? (
          <EmptyState>Generate a report to view downlines by level.</EmptyState>
        ) : levels.length === 0 ? (
          <EmptyState>No downline levels found for this member.</EmptyState>
        ) : (
          <div className="relative max-w-full overflow-hidden">
            {canScrollLeft ? (
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
            ) : null}

            {canScrollRight ? (
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />
            ) : null}

            <div
              ref={scrollRef}
              className="w-full overflow-x-auto overflow-y-hidden pb-3"
            >
              <div className="flex w-max gap-4 pr-2">
                {levels.map((level) => (
                  <div
                    key={level.level}
                    className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <div className="border-b border-slate-200 bg-white px-4 py-3">
                      <div className="text-sm font-black text-slate-950">
                        {level.level_title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {level.label || "No bonus label"} · Bonus: ₱
                        {fmtAmount(level.bonus_total)}
                      </div>
                    </div>

                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600">
                      Members ({level.member_count})
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {(level.members || []).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">
                          No members
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-slate-200">
                              <th className="px-4 py-2 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                                Bonus
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {level.members.map((m, idx) => (
                              <tr
                                key={`${level.level}-${m.name}-${idx}`}
                                className="border-b border-slate-100"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-950">
                                    {m.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {m.membership_type || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-black text-slate-950">
                                  ₱{fmtAmount(m.bonus_value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
