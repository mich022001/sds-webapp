import { useEffect, useMemo, useRef, useState } from "react";

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

export default function MemberReport() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState("");

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        setLoadingMembers(true);
        setErr("");

        const res = await fetch("/api/members/list");
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) {
          setMembers(data);
          if (!selected && data[0]?.name) setSelected(data[0].name);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReport(name) {
    try {
      setErr("");
      setLoadingReport(true);
      setReport(null);

      const res = await fetch(`/api/reports/member?name=${encodeURIComponent(name)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);

      setReport(json);
    } catch (e) {
      setErr(e?.message || "Failed to load report.");
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

  const totals = report?.totals || null;
  const member = report?.member || null;
  const levels = Array.isArray(report?.levels) ? report.levels : [];

  const prettyMoney = (n) => {
    const x = Number(n ?? 0);
    if (!Number.isFinite(x)) return "0.00";
    return x.toFixed(2);
  };

  return (
    <div className="grid max-w-full gap-4 overflow-x-hidden">
      <Card
        title="Member Report"
        right={
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            API: /api/reports/member
          </span>
        }
      >
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-600">Select Member</span>
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900"
              value={selected}
              disabled={loadingMembers}
              onChange={(e) => setSelected(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.member_id || m.name} value={m.name}>
                  {m.name} {m.member_id ? `(${m.member_id})` : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            className={cls(
              "h-10 rounded-xl px-4 text-sm font-semibold transition",
              "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
            onClick={() => selected && loadReport(selected)}
            disabled={!selected || loadingReport}
          >
            Generate
          </button>

          <button
            className={cls(
              "h-10 rounded-xl px-4 text-sm font-semibold transition",
              "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
            )}
            onClick={() => {
              setErr("");
              setReport(null);
            }}
            disabled={loadingReport}
          >
            Clear
          </button>
        </div>

        {loadingReport && <div className="mt-3 text-sm text-zinc-500">Loading report…</div>}
        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Member Profile" className="min-w-0">
          {member ? (
            <div className="grid gap-y-2 text-sm sm:grid-cols-[130px_1fr]">
              <div className="font-medium text-zinc-500">Name</div>
              <div className="text-zinc-800">{member.name}</div>

              <div className="font-medium text-zinc-500">Member ID</div>
              <div className="text-zinc-800">{member.member_id || "-"}</div>

              <div className="font-medium text-zinc-500">Membership</div>
              <div className="text-zinc-800">{member.membership_type || "-"}</div>

              <div className="font-medium text-zinc-500">Sponsor</div>
              <div className="text-zinc-800">{member.sponsor_name || "SDS"}</div>

              <div className="font-medium text-zinc-500">Member Since</div>
              <div className="break-all text-zinc-800">{member.created_at || "-"}</div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">
              Generate a report to view member profile.
            </div>
          )}
        </Card>

        <Card title="Bonus Summary" className="min-w-0">
          {totals ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Total Cash Issued"
                  value={prettyMoney(totals.total_cash)}
                  hint="Includes Outright 600"
                />
                <Stat
                  label="Redeemable Cash"
                  value={prettyMoney(totals.redeemable_cash)}
                  hint="Excludes Outright"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="Cash Redeemed" value={prettyMoney(totals.redeemed_cash)} />
                <Stat
                  label="Cash Balance"
                  value={prettyMoney(totals.balance_cash)}
                  hint="Redeemable - Redeemed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total Product" value={String(totals.total_product ?? 0)} />
                <Stat label="Product Redeemed" value={String(totals.redeemed_product ?? 0)} />
                <Stat label="Product Balance" value={String(totals.balance_product ?? 0)} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">
              Generate a report to view totals.
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Downlines by Level"
        className="min-w-0"
        right={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-zinc-500 md:inline">
              Swipe or use arrows to view more levels
            </span>
            <button
              type="button"
              onClick={() => scrollLevels(-1)}
              disabled={!canScrollLeft}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollLevels(1)}
              disabled={!canScrollRight}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-40"
            >
              →
            </button>
          </div>
        }
      >
        {!report ? (
          <div className="text-sm text-zinc-500">
            Generate a report to view downlines by level.
          </div>
        ) : (
          <div className="relative max-w-full overflow-hidden">
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />
            )}

            <div
              ref={scrollRef}
              className="w-full overflow-x-auto overflow-y-hidden pb-3"
            >
              <div className="flex w-max gap-4 pr-2">
                {levels.map((level) => (
                  <div
                    key={level.level}
                    className="w-[280px] shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50"
                  >
                    <div className="border-b border-zinc-200 bg-white px-4 py-3">
                      <div className="text-sm font-bold text-zinc-900">
                        {level.level_title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {level.label || "No bonus"}
                        {level.level <= 7
                          ? ` • Total: ${prettyMoney(level.bonus_total)}`
                          : ""}
                      </div>
                    </div>

                    <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Names ({level.member_count})
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {(level.members || []).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-zinc-400">
                          No members
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-zinc-200">
                              <th className="px-4 py-2 text-left font-semibold text-zinc-700">
                                Name
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {level.members.map((m, idx) => (
                              <tr
                                key={`${level.level}-${m.name}-${idx}`}
                                className="border-b border-zinc-100"
                              >
                                <td className="px-4 py-2 text-zinc-800">{m.name}</td>
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

            <div className="mt-2 h-2 rounded-full bg-zinc-200">
              <div
                className={`h-2 rounded-full bg-zinc-500 transition-all ${
                  canScrollLeft || canScrollRight ? "opacity-100" : "opacity-0"
                }`}
                style={{ width: "28%" }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
