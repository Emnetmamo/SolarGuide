// Dates and numbers are always formatted with an explicit locale and time zone,
// so the server render and the browser render can never disagree.

export function fmtDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", ...opts });
}

export function fmtShort(iso) {
  if (!iso) return "—";
  return fmtDate(iso, { year: undefined });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtNum(n, d = 1) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtInt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-GB");
}

export function fmtGap(gap) {
  if (gap == null) return "—";
  const v = Math.abs(gap);
  return gap > 0 ? `${fmtNum(v, 1)}% below` : gap < 0 ? `${fmtNum(v, 1)}% above` : "on target";
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}