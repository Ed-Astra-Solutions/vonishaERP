"use client";

import type { ReactNode } from "react";

import { toDateInput, fromDateInput } from "@/lib/enrollment-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form/read primitives shared by the enrollment list, the add page and the
// `/enrollment/[id]` detail sub-page.

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <Separator />
      <div className="pt-1">{children}</div>
    </div>
  );
}

export function Field({
  label, value, onChange, type = "text", className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function NumberField({
  label, value, onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </div>
  );
}

export function DateField({
  label, value, onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(fromDateInput(e.target.value))}
      />
    </div>
  );
}

export function SelectField({
  label, value, onChange, options, labels, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange((v as string) ?? "")}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{labels?.[o] ?? o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ViewRow({ label, value }: { label: string; value?: string | number }) {
  const shown = value !== undefined && value !== null && value !== "" ? value : "—";
  return (
    <div className="flex justify-between gap-6 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="break-words text-right font-medium">{shown}</span>
    </div>
  );
}
