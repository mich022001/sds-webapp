import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Boxes,
  Coins,
  Gift,
  History,
  Search,
  Wallet,
} from "lucide-react";

function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fmtDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

function fmtAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value ?? "");
  }

  return number.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getRowAmount(row) {
  const rawAmount = row?.amount;
  const amount = Number(rawAmount);

  if (rawAmount !== null && rawAmount !== undefined && Number.isFinite(amount)) {
    return amount;
  }

  const rawAmountNum = row?.amount_num;
  const amountNum = Number(rawAmountNum);

  if (
    rawAmountNum !== null &&
    rawAmountNum !== undefined &&
    Number.isFinite(amountNum)
  ) {
    return amountNum;
  }

  return 0;
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={cls("grid min-w-0 gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
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
          {helper && <div className="mt-1 text-xs text-slate-500">{helper}</div>}
        </div>

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const value = String(type || "").toLowerCase();

  const tone =
    value === "cash"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : value === "product"
        ? "border-blue-100 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={cls(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        tone
      )}
    >
      {type || "-"}
    </span>
  );
}

function RedeemableBadge({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        Redeemable
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
        Not Redeemable
      </span>
    );
  }

  return <span className="text-slate-400">-</span>;
}

export default function BonusLedger() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [qEarner, setQEarner] = useState("");
  const [qReason, setQReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/bonus-ledger/list?limit=200");
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) {
          setRows(data);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load bonus ledger");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const a = qEarner.trim().toLowerCase();
    const r = qReason.trim().toLowerCase();

    return rows.filter((x) => {
      const earner = `${x.earner_name ?? ""} ${
        x.earner_member_id ?? ""
      }`.toLowerCase();
      const reason = `${x.reason ?? ""}`.toLowerCase();

      return (!a || earner.includes(a)) && (!r || reason.includes(r));
    });
  }, [rows, qEarner, qReason]);

  const stats = useMemo(() => {
    const cashTotal = filtered
      .filter((row) => String(row.bonus_type || "").toLowerCase() === "cash")
      .reduce((sum, row) => sum + getRowAmount(row), 0);

    const productTotal = filtered
      .filter((row) => String(row.bonus_type || "").toLowerCase() === "product")
      .reduce((sum, row) => sum + getRowAmount(row), 0);

    const redeemableCount = filtered.filter(
      (row) => row.is_redeemable === true
    ).length;

    return {
      totalEntries: filtered.length,
      cashTotal,
      productTotal,
      redeemableCount,
    };
  }, [filtered]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-yellow-600">
                Bonus Operations
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Bonus Ledger
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review member bonuses, source activity, redeemable status, and
                ledger history.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <BadgeDollarSign size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Visible Entries"
          value={stats.totalEntries}
          helper={`${rows.length} total loaded`}
          icon={History}
          tone="blue"
        />
        <StatCard
          label="Cash Bonus"
          value={`₱${fmtAmount(stats.cashTotal)}`}
          helper="Filtered cash ledger value"
          icon={Wallet}
          tone="green"
        />
        <StatCard
          label="Product Bonus"
          value={fmtAmount(stats.productTotal)}
          helper="Filtered product bonus count"
          icon={Boxes}
          tone="gold"
        />
        <StatCard
          label="Redeemable"
          value={stats.redeemableCount}
          helper="Entries marked redeemable"
          icon={Gift}
          tone="slate"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Coins size={18} />
              </div>

              <div>
                <div className="font-bold text-slate-950">Ledger Records</div>
                <div className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {filtered.length}
                  </span>{" "}
                  of <span className="font-bold text-slate-900">{rows.length}</span>{" "}
                  entries.
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
                />
                <Input
                  label="Filter by Earner"
                  value={qEarner}
                  onChange={(e) => setQEarner(e.target.value)}
                  placeholder="Name or member ID"
                  className="[&_input]:pl-9"
                />
              </div>

              <Input
                label="Filter by Reason"
                value={qReason}
                onChange={(e) => setQReason(e.target.value)}
                placeholder="Reason"
              />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Loading bonus ledger...
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Error: {err}
            </div>
          )}

          {!loading && !err && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[1250px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {[
                      "Date",
                      "Earner",
                      "Member ID",
                      "Bonus Label",
                      "Bonus Type",
                      "Amount",
                      "Redeemable",
                      "Reason",
                      "Source",
                      "Level",
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((x) => {
                      const level = x.relative_level ?? x.level ?? "";
                      const displayAmount = getRowAmount(x);
                      const isCash =
                        String(x.bonus_type || "").toLowerCase() === "cash";

                      return (
                        <tr
                          key={x.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {fmtDate(x.created_at)}
                          </td>

                          <td className="px-4 py-4 font-bold text-slate-950">
                            {x.earner_name ?? "-"}
                          </td>

                          <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                            {x.earner_member_id ?? "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {x.bonus_label ?? "-"}
                          </td>

                          <td className="px-4 py-4">
                            <TypeBadge type={x.bonus_type} />
                          </td>

                          <td className="px-4 py-4 text-right font-black text-slate-950">
                            {isCash
                              ? `₱${fmtAmount(displayAmount)}`
                              : fmtAmount(displayAmount)}
                          </td>

                          <td className="px-4 py-4">
                            <RedeemableBadge value={x.is_redeemable} />
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {x.reason ?? "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {x.source_member_name ??
                              x.source_name ??
                              x.source_member_id ??
                              "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {level || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
