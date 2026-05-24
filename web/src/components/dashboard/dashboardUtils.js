export function levelLabel(level) {
  if (level === 0) return "SDS";
  if (level === 1) return "1st Level";
  if (level === 2) return "2nd Level";
  if (level === 3) return "3rd Level";
  return `${level}th Level`;
}

export function fmtAmount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

export function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function cls(...classes) {
  return classes.filter(Boolean).join(" ");
}
