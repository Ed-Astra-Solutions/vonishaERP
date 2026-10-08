// Nominal registration fee — the challan-backed payment students make at
// admission, receipted on the Vonisha Service Foundation donation receipt book.
//
// Until now this lived in a per-centre Google Sheet ("Nominal Registration cost
// 2026-27.xlsx", one tab per class) alongside the written challan book. The ERP now
// captures it on the student record so the 10 BD submission report can be generated
// instead of maintained by hand.
//
// Storage: these keys go into the same free-form `data` object every other student
// field uses (students.data[] on the server), so no schema migration is needed:
//   regStatus  -> "Registration" | "Defaulter" | ""
//   regExpected-> expected total for this student, as a string (sheet has no such
//                 column; it exists so the report can show a balance)
//   regPayments-> RegistrationPayment[]
// Older records simply have none of these, which reads as "nothing recorded yet".

import type { MediaItem } from "@/types/media";

/** The sheet's "REGISTRATION \ DEFAULTER" column. */
export type RegistrationStatus = "Registration" | "Defaulter";
export const REGISTRATION_STATUSES: RegistrationStatus[] = ["Registration", "Defaulter"];

/** The sheet's "MODE OF PAYMENT (UPI or CASH)" column. */
export type PaymentMode = "UPI" | "Cash";
export const PAYMENT_MODES: PaymentMode[] = ["UPI", "Cash"];

/** The receipt's "Nature of donation - Corpus / General" line. */
export type DonationNature = "General" | "Corpus";
export const DONATION_NATURES: DonationNature[] = ["General", "Corpus"];

/** One challan — one line in the receipt book, one printed receipt. */
export interface RegistrationPayment {
  /** Date of payment, ISO yyyy-MM-dd (what input[type=date] emits). */
  date: string;
  mode: PaymentMode | "";
  /** Rupees. Kept as a string on the record, mirroring the other numeric fields. */
  amount: string;
  /** Receipt book S.NO, e.g. "817". Printed as the receipt's serial number. */
  challanNo: string;
  remarks: string;
  /** UPI transaction / NEFT reference, for the receipt's "By cash/…/NEFT" line. */
  refNo?: string;
  /** Defaults to "General" when unset — matches how the book is written. */
  nature?: DonationNature;
  /** Optional photo/scan of the written challan (private S3, like Aadhaar docs). */
  media?: MediaItem[];
}

export function emptyPayment(): RegistrationPayment {
  return {
    date: "",
    mode: "",
    amount: "",
    challanNo: "",
    remarks: "",
    refNo: "",
    nature: "General",
    media: [],
  };
}

/** Narrow an unknown `data.regPayments` into a usable array. Tolerant of junk. */
export function asPayments(v: unknown): RegistrationPayment[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      date: String(p.date ?? ""),
      mode: (p.mode === "UPI" || p.mode === "Cash" ? p.mode : "") as PaymentMode | "",
      amount: String(p.amount ?? ""),
      challanNo: String(p.challanNo ?? ""),
      remarks: String(p.remarks ?? ""),
      refNo: String(p.refNo ?? ""),
      // Records written before the receipt-printing feature carry no nature; the
      // book's default is a general donation.
      nature: p.nature === "Corpus" ? "Corpus" : "General",
      media: Array.isArray(p.media)
        ? (p.media.filter((m) => m && typeof m === "object" && "key" in m) as MediaItem[])
        : [],
    }));
}

export function amountOf(p: RegistrationPayment): number {
  const n = Number(String(p.amount).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function totalPaid(payments: RegistrationPayment[]): number {
  return payments.reduce((sum, p) => sum + amountOf(p), 0);
}

/** ISO yyyy-MM-dd -> dd-MM-yyyy, the form the sheet and the challan book use. */
export function formatPaymentDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
}
