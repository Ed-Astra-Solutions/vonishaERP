// Rupee amounts spelled out for the "Sum Of Rupees" line on the printed donation
// receipt. Uses the Indian numbering system (lakh / crore), which is what the
// receipt book is written in — 150000 reads "One Lakh Fifty Thousand", not
// "One Hundred Fifty Thousand".

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

/** 0–99. */
function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

/** 0–999. */
function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/**
 * Spell out a whole-rupee amount, e.g. 3000 -> "Three Thousand Only".
 * Paise are ignored — the registration fee is always whole rupees, and the
 * receipt book is written the same way. Returns "" for zero/invalid input.
 */
export function amountInWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (!Number.isFinite(n) || n === 0) return "";

  // Indian grouping: crore | lakh | thousand | last three digits.
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  return `${parts.join(" ")} Only`;
}
