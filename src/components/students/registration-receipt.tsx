"use client";

import Image from "next/image";

import { ORG } from "@/lib/org";
import { amountInWords } from "@/lib/amount-in-words";
import { formatPaymentDate, type RegistrationPayment, amountOf } from "@/types/registration-fees";

// Print-ready donation receipt — a reproduction of the pre-printed Vonisha Service
// Foundation receipt book (excel_ref/"Donation receipt .jpeg"), filled from a
// recorded registration-fee challan.
//
// Layout notes: the physical book is a half-A4 landscape slip, so the sheet is sized
// 190mm x 128mm and the print stylesheet in globals.css hides everything else on the
// page. Blank lines are kept as dotted rules exactly where the book has them, so a
// printed copy can still be completed by hand if a field wasn't captured.

export interface ReceiptDonor {
  /** "Received from Name" — the parent who paid. */
  name: string;
  address: string;
  email: string;
  phone: string;
  /** "PAN No." on the payment line; the parent's PAN or Aadhaar. */
  pan: string;
  /** Context line, not on the printed book: which student this was collected for. */
  studentName: string;
  studentClass: string;
}

/** A dotted rule that shows `value` when there is one, mimicking the printed book. */
function Filled({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span
      className={`inline-block min-w-0 flex-1 border-b border-dotted border-black px-1 leading-tight ${className}`}
    >
      {value || " "}
    </span>
  );
}

export function RegistrationReceipt({
  payment,
  donor,
}: {
  payment: RegistrationPayment;
  donor: ReceiptDonor;
}) {
  const amount = amountOf(payment);
  // The book's payment line reads "By cash/Cheque/D.D. NO/NEFT ____" — we print the
  // recorded mode and, for UPI/NEFT, the transaction reference.
  const modeLine = [payment.mode, payment.refNo].filter(Boolean).join(" — ");

  return (
    <div
      id="receipt-sheet"
      className="mx-auto box-border bg-white p-5 font-serif text-[10px] leading-snug text-black"
      style={{ width: "190mm", minHeight: "128mm" }}
    >
      <div className="border border-black p-3">
        {/* Header: registration numbers on the left, name + address centred. */}
        <div className="flex items-start gap-3">
          <div className="w-[46mm] shrink-0 space-y-0.5 text-[8px] leading-tight">
            <p className="font-semibold">12A &amp; 80G Unique Registration Number</p>
            <p>{ORG.uniqueRegNo}</p>
            <p>PAN : {ORG.pan}</p>
            <p>CSR REGD NO : {ORG.csrRegNo}</p>
            <p>CIN NO : {ORG.cin}</p>
          </div>
          <div className="flex flex-1 items-start gap-2">
            <div className="relative size-10 shrink-0 overflow-hidden">
              <Image src="/brand/vonisha.jpeg" alt="" width={40} height={40} className="object-contain" />
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[15px] font-bold leading-tight tracking-wide">{ORG.name}</p>
              {ORG.addressLines.map((line) => (
                <p key={line} className="text-[8px] leading-tight">{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Receipt serial + date */}
        <div className="mt-3 flex items-end justify-center gap-8">
          <p className="text-[11px] font-bold underline">RECEIPT</p>
          <p className="text-[10px]">
            S.NO : <span className="font-bold">{payment.challanNo || "—"}</span>
          </p>
          <p className="text-[10px]">
            DATE : <span className="font-semibold">{formatPaymentDate(payment.date) || "—"}</span>
          </p>
        </div>

        {/* Body — same field order as the printed book. */}
        <div className="mt-3 space-y-2.5 text-[10px]">
          <div className="flex items-end gap-1">
            <span className="shrink-0">Received from Name</span>
            <Filled value={donor.name} className="font-semibold" />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">Name of company</span>
            <Filled value="" />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">Address</span>
            <Filled value={donor.address} />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">E-mail</span>
            <Filled value={donor.email} />
            <span className="shrink-0">Contact No.</span>
            <Filled value={donor.phone} className="max-w-[38mm]" />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">Sum Of Rupees</span>
            <Filled value={amountInWords(amount)} className="font-semibold" />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">By cash/Cheque/D.D. NO/NEFT</span>
            <Filled value={modeLine} />
            <span className="shrink-0">PAN No.</span>
            <Filled value={donor.pan} className="max-w-[34mm]" />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">Subject to realization being</span>
            <Filled
              value={
                donor.studentName
                  ? `Nominal registration fee — ${donor.studentName}${donor.studentClass ? ` (${donor.studentClass})` : ""}`
                  : ""
              }
            />
          </div>
          <div className="flex items-end gap-1">
            <span className="shrink-0">
              Nature of donation -{" "}
              <span className={payment.nature === "Corpus" ? "font-bold underline" : ""}>Corpus</span>
              {" / "}
              <span className={payment.nature !== "Corpus" ? "font-bold underline" : ""}>General</span>
            </span>
            <Filled value="" />
          </div>
        </div>

        {/* Footer: amount box on the left, signature on the right. */}
        <div className="mt-5 flex items-end justify-between">
          <p className="text-[12px] font-bold">
            Rs.{" "}
            <span className="border-b border-dotted border-black px-3">
              {amount > 0 ? amount.toLocaleString("en-IN") : "    "}
            </span>
          </p>
          <div className="text-center">
            <div className="h-9" />
            <p className="text-[9px]">{ORG.signatory}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
