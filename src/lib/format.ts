// Shared formatting helpers.

// Today's date as ddMMyyyy (matches admissions_desktop.dart `date` construction).
export function todayDDMMYYYY(d = new Date()): string {
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${day}${month}${d.getFullYear()}`;
}

// Parse a ddMMyyyy string into a readable date (e.g. "05 Jul 2026"). Falls back
// to the raw string when it isn't 8 digits.
export function formatDDMMYYYY(s: string | undefined | null): string {
  if (!s || !/^\d{8}$/.test(s)) return s ?? "";
  const day = s.slice(0, 2);
  const month = Number(s.slice(2, 4));
  const year = s.slice(4);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[month - 1] ?? month} ${year}`;
}

export function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
