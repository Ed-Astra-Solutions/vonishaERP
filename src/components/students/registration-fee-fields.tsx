"use client";

import Link from "next/link";
import { Plus, Printer, Trash2 } from "lucide-react";

import {
  DONATION_NATURES,
  PAYMENT_MODES,
  REGISTRATION_STATUSES,
  type DonationNature,
  type PaymentMode,
  type RegistrationPayment,
  amountOf,
  emptyPayment,
  totalPaid,
} from "@/types/registration-fees";
import type { MediaItem } from "@/types/media";
import { inr } from "@/lib/format";
import { MediaUpload } from "@/components/common/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Nominal registration fee capture, embedded in the add/edit student form. Replaces
// the per-centre Google Sheet: one row here == one written challan from the receipt
// book, so a student who paid in instalments gets several rows and the report can
// show both the individual challans and the running total.
//
// Everything is optional — a student can be added before the fee is collected, and
// the incharge fills the challan in later.

export function RegistrationFeeFields({
  status,
  onStatusChange,
  expected,
  onExpectedChange,
  payments,
  onPaymentsChange,
  receiptHref,
}: {
  status: string;
  onStatusChange: (v: string) => void;
  expected: string;
  onExpectedChange: (v: string) => void;
  payments: RegistrationPayment[];
  onPaymentsChange: (next: RegistrationPayment[]) => void;
  /**
   * Link to the printable receipt for challan `i`. Only supplied in edit mode —
   * the receipt page re-reads the saved record, so there is nothing to print until
   * the challan has been saved at least once.
   */
  receiptHref?: (i: number) => string;
}) {
  const paid = totalPaid(payments);
  const expectedNum = Number(expected.replace(/[^0-9.]/g, ""));
  const hasExpected = Number.isFinite(expectedNum) && expectedNum > 0;
  const balance = hasExpected ? expectedNum - paid : 0;

  function patch(i: number, changes: Partial<RegistrationPayment>) {
    onPaymentsChange(payments.map((p, idx) => (idx === i ? { ...p, ...changes } : p)));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nominal Registration Fee</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Registration / Defaulter</Label>
            <Select
              value={status || undefined}
              onValueChange={(v) => onStatusChange(v ?? "")}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {REGISTRATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regExpected">Fee Applicable (₹)</Label>
            <Input
              id="regExpected"
              inputMode="numeric"
              placeholder="e.g. 3000"
              value={expected}
              onChange={(e) => onExpectedChange(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Challans</p>
            <p className="text-xs text-muted-foreground">
              One entry per receipt written in the donation receipt book.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPaymentsChange([...payments, emptyPayment()])}
          >
            <Plus className="size-4" /> Add Challan
          </Button>
        </div>

        {payments.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No payment recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {payments.map((p, i) => (
              <div key={i} className="space-y-4 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Challan {i + 1}</p>
                  <div className="flex items-center gap-1">
                    {receiptHref && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        render={<Link href={receiptHref(i)} />}
                      >
                        <Printer className="size-4" /> Print
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove challan ${i + 1}`}
                      onClick={() => onPaymentsChange(payments.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`regDate-${i}`}>Date of Payment</Label>
                    <Input
                      id={`regDate-${i}`}
                      type="date"
                      value={p.date}
                      onChange={(e) => patch(i, { date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mode of Payment</Label>
                    <Select
                      value={p.mode || undefined}
                      onValueChange={(v) => patch(i, { mode: (v ?? "") as PaymentMode | "" })}
                    >
                      <SelectTrigger><SelectValue placeholder="UPI or Cash" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`regAmount-${i}`}>Amount Paid (₹)</Label>
                    <Input
                      id={`regAmount-${i}`}
                      inputMode="numeric"
                      value={p.amount}
                      onChange={(e) => patch(i, { amount: e.target.value.replace(/[^0-9]/g, "") })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`regChallan-${i}`}>Receipt / Challan No.</Label>
                    <Input
                      id={`regChallan-${i}`}
                      placeholder="S.No on the receipt"
                      value={p.challanNo}
                      onChange={(e) => patch(i, { challanNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`regRef-${i}`}>UPI / NEFT Reference</Label>
                    <Input
                      id={`regRef-${i}`}
                      placeholder="Transaction reference (optional)"
                      value={p.refNo ?? ""}
                      onChange={(e) => patch(i, { refNo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nature of Donation</Label>
                    <Select
                      value={p.nature ?? "General"}
                      onValueChange={(v) => patch(i, { nature: (v ?? "General") as DonationNature })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DONATION_NATURES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`regRemarks-${i}`}>Remarks</Label>
                  <Input
                    id={`regRemarks-${i}`}
                    value={p.remarks}
                    onChange={(e) => patch(i, { remarks: e.target.value })}
                  />
                </div>

                <MediaUpload
                  purpose="challan"
                  module="student"
                  value={p.media ?? []}
                  onChange={(media: MediaItem[]) => patch(i, { media })}
                  label="Challan Copy"
                  description="Photograph the written receipt or upload a scan / PDF."
                  maxItems={1}
                />

                {amountOf(p) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {inr(amountOf(p))}
                    {p.mode ? ` by ${p.mode}` : ""}
                    {p.challanNo ? ` · receipt ${p.challanNo}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {payments.length > 0 && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-semibold">{inr(paid)}</span>
            </div>
            {hasExpected && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">
                  {balance > 0 ? "Balance due" : balance < 0 ? "Excess" : "Balance"}
                </span>
                <span
                  className={
                    balance > 0 ? "font-semibold text-destructive" : "font-semibold"
                  }
                >
                  {inr(Math.abs(balance))}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
