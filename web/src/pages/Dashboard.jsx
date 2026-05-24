import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Crown,
  Network,
  PackageCheck,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

function levelLabel(level) {
  if (level === 0) return "SDS";
  if (level === 1) return "1st Level";
  if (level === 2) return "2nd Level";
  if (level === 3) return "3rd Level";
  return `${level}th Level`;
}

function fmtAmount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionHeader({ eyebrow, title, description, right }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-600">
            {eyebrow}
          </div>
        )}

        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>

      {right}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone = "blue", helper }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>

          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        <div className={cls("rounded-2xl p-3 ring-1", toneClass)}>
          <Icon size={22} />
        </div>
      </div>

      {helper && <div className="mt-3 text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

function Card({ title, children, right, className = "" }) {
  return (
    <div
      className={cls(
        "max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="font-bold text-slate-950">{title}</div>
          {right}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function LoadingCard({ title = "Loading dashboard..." }) {
  return (
    <Card title={title}>
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </Card>
  );
}

export default function Dashboard({ user }) {
  const isAdminView = user?.role === "super_admin" || user?.role === "admin";

  if (!isAdminView) {
    return <SelfDashboard user={user} />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/members", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setRows(data);
      } catch (error) {
        if (!cancelled) setErr(error?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const norm = (value) => String(value ?? "").trim().toLowerCase();

    const displayNameByNorm = new Map();
    const sponsorByNormName = new Map();

    for (const member of rows) {
      const name = norm(member.name);
      const sponsor = norm(member.sponsor_name);
      if (!name) continue;

      displayNameByNorm.set(name, member.name);
      sponsorByNormName.set(name, sponsor);
    }

    const memo = new Map();

    function computeLevel(normName, seen = new Set()) {
      if (memo.has(normName)) return memo.get(normName);
      if (seen.has(normName)) return 1;

      seen.add(normName);

      const sponsorNorm = sponsorByNormName.get(normName);

      if (!sponsorNorm || sponsorNorm === "sds") {
        memo.set(normName, 1);
        return 1;
      }

      if (!displayNameByNorm.has(sponsorNorm)) {
        memo.set(normName, 1);
        return 1;
      }

      const level = computeLevel(sponsorNorm, seen) + 1;
      memo.set(normName, level);
      return level;
    }

    const map = new Map();
    map.set(0, ["SDS"]);

    for (const normName of displayNameByNorm.keys()) {
      const level = computeLevel(normName);
      if (!map.has(level)) map.set(level, []);
      map.get(level).push(displayNameByNorm.get(normName));
    }

    const levels = Array.from(map.keys()).sort((a, b) => a - b);

    for (const level of levels) {
      map.get(level).sort((a, b) => String(a).localeCompare(String(b)));
    }

    const levelItems = levels
      .filter((level) => level !== 0)
      .map((level) => ({
        level,
        title: levelLabel(level),
        names: map.get(level) || [],
        count: map.get(level)?.length || 0,
      }));

    return { map, levels, levelItems };
  }, [rows]);

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
  }, [grouped]);

  function scrollLevels(direction) {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  const totalMembers = rows.length;
  const totalLevel1 = grouped.map.get(1)?.length ?? 0;
  const totalLevel2 = grouped.map.get(2)?.length ?? 0;
  const totalLevel3 = grouped.map.get(3)?.length ?? 0;
  const totalLevelsShown = grouped.levels.filter((level) => level !== 0).length;

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <SectionHeader
          eyebrow="Admin Dashboard"
          title="SDS Business Overview"
          description="Monitor member growth, direct-sales hierarchy, level distribution, and operating structure in one executive view."
          right={
            <div className="hidden rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right sm:block">
              <div className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Network Depth
              </div>
              <div className="mt-1 text-2xl font-extrabold text-blue-900">
                {totalLevelsShown}
              </div>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Members"
          value={totalMembers}
          icon={Users}
          tone="blue"
          helper="All registered members"
        />
        <MetricCard
          label="1st Level"
          value={totalLevel1}
          icon={Crown}
          tone="gold"
          helper="Direct SDS branch"
        />
        <MetricCard
          label="2nd Level"
          value={totalLevel2}
          icon={Network}
          tone="blue"
          helper="Second layer network"
        />
        <MetricCard
          label="3rd Level"
          value={totalLevel3}
          icon={TrendingUp}
          tone="green"
          helper="Third layer network"
        />
        <MetricCard
          label="Levels Present"
          value={totalLevelsShown}
          icon={BarChart3}
          tone="slate"
          helper="Active genealogy depth"
        />
      </div>

      {loading && <LoadingCard title="Genealogy Overview" />}

      {err && (
        <Card title="Genealogy Overview">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            Error: {err}
          </div>
        </Card>
      )}

      {!loading && !err && (
        <Card
          title="Genealogy by Level"
          right={
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-slate-400 lg:inline">
                Swipe or use arrows
              </span>

              <button
                type="button"
                onClick={() => scrollLevels(-1)}
                disabled={!canScrollLeft}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={15} />
              </button>

              <button
                type="button"
                onClick={() => scrollLevels(1)}
                disabled={!canScrollRight}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          }
        >
          {grouped.levelItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hierarchy data yet.
            </div>
          ) : (
            <div className="relative max-w-full overflow-hidden">
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-white to-transparent" />
              )}
              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white to-transparent" />
              )}

              <div
                ref={scrollRef}
                className="w-full overflow-x-auto overflow-y-hidden pb-3"
              >
                <div className="flex w-max gap-4 pr-2">
                  {grouped.levelItems.map((item) => (
                    <div
                      key={item.level}
                      className="w-[280px] shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                    >
                      <div className="border-b border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-950">
                              {item.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.count} member{item.count === 1 ? "" : "s"}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            L{item.level}
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[520px] overflow-y-auto p-3">
                        {item.names.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                            No members
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.names.map((name, index) => (
                              <div
                                key={`${item.level}-${name}-${index}`}
                                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-sm shadow-sm"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-700">
                                  {String(name).slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0 truncate font-medium text-slate-800">
                                  {name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-center text-xs text-slate-400 md:hidden">
                Swipe horizontally to view more levels
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function SelfDashboard({ user }) {
  const [member, setMember] = useState(null);
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        if (!user?.member_id) {
          throw new Error("Your account is not linked to a member.");
        }

        const memberRes = await fetch(
          `/api/members?member_id=${encodeURIComponent(user.member_id)}`
        );
        const memberJson = await memberRes.json().catch(() => ({}));

        if (!memberRes.ok) {
          throw new Error(memberJson.error || "Failed to load member");
        }

        const memberRow = Array.isArray(memberJson?.data)
          ? memberJson.data[0]
          : null;

        if (!memberRow?.name) {
          throw new Error("Linked member record not found.");
        }

        const [reportRes, salesRes] = await Promise.all([
          fetch(`/api/reports?type=member&name=${encodeURIComponent(memberRow.name)}`),
          fetch("/api/sales"),
        ]);

        const reportJson = await reportRes.json().catch(() => ({}));
        const salesJson = await salesRes.json().catch(() => ({}));

        if (!reportRes.ok) {
          throw new Error(reportJson.error || "Failed to load bonuses");
        }

        if (!salesRes.ok) {
          throw new Error(salesJson.error || "Failed to load sales");
        }

        if (!cancelled) {
          setMember(memberRow);
          setReport(reportJson);
          setSales(Array.isArray(salesJson?.data) ? salesJson.data : []);
        }
      } catch (error) {
        if (!cancelled) setErr(error?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.member_id]);

  const totals = report?.totals || {};

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <SectionHeader
          eyebrow="Personal Dashboard"
          title={`Welcome, ${member?.name || user?.full_name || "Member"}`}
          description="View your membership profile, balances, upline details, and recent sales requests."
        />
      </div>

      {loading ? (
        <LoadingCard title="My Summary" />
      ) : err ? (
        <Card title="My Summary">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {err}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Member ID"
              value={member?.member_id || "-"}
              icon={UserRound}
              tone="blue"
            />
            <MetricCard
              label="Membership Type"
              value={member?.membership_type || "-"}
              icon={PackageCheck}
              tone="gold"
            />
            <MetricCard
              label="Cash Balance"
              value={fmtAmount(totals.balance_cash)}
              icon={Wallet}
              tone="green"
            />
            <MetricCard
              label="Product Balance"
              value={fmtAmount(totals.balance_product)}
              icon={PackageCheck}
              tone="slate"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="My Upline Details">
              <div className="space-y-3">
                {[
                  ["Sponsor", member?.sponsor_name || "-"],
                  ["Regional Manager", member?.regional_manager || "-"],
                  ["Area / Region", member?.area_region || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="My Recent Sales Requests">
              {sales.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No sales yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.slice(0, 5).map((row, index) => (
                    <div
                      key={`${row.id || index}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="text-sm font-bold text-slate-950">
                        {row.product_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Qty {row.quantity} • Total ₱{fmtAmount(row.total_amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
