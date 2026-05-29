import {
  BarChart3,
  PieChart,
} from "lucide-react";

export function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function fmtNumber(value) {
  const number = Number(value || 0);

  return Number.isFinite(number)
    ? number.toLocaleString("en-PH", {
        minimumFractionDigits: number % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })
    : "0";
}

export function fmtAmount(value) {
  const number = Number(value || 0);

  return Number.isFinite(number)
    ? number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

export function fmtDate(value) {
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

export function Select({ label, className = "", children, ...props }) {
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

export function SectionCard({ title, subtitle, icon: Icon, children, right }) {
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

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
      {children}
    </div>
  );
}

export function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  }[tone];

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

        <div className={cls("rounded-xl p-2.5 ring-1", toneClass)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function ChartToggle({ value, onChange }) {
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

export function SimpleBarChart({ rows, emptyText, money = false }) {
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
                {money ? `₱${fmtAmount(row.value)}` : fmtNumber(row.value)}
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

export function SimplePieChart({ rows, emptyText, money = false }) {
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
                  {money ? `₱${fmtAmount(row.value)}` : fmtNumber(row.value)}
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

export function ReportChart({ rows, type, emptyText, money = false }) {
  if (type === "pie") {
    return <SimplePieChart rows={rows} emptyText={emptyText} money={money} />;
  }

  return <SimpleBarChart rows={rows} emptyText={emptyText} money={money} />;
}

export function ProfileRow({ label, value }) {
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
