"use client";

import { Check, Copy, MailCheck, MailWarning, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InviteResult } from "@/types/access";

// Shown after creating an account or re-sending an invite. The link is the user's
// way in (set password → sign in), so it's offered for copying / WhatsApp even when
// the email went out — handy when someone is standing next to you with their phone.
export function InviteDialog({ invite, onClose }: { invite: InviteResult | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually");
    }
  }

  const whatsapp = invite
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hi ${invite.name}, your Vonisha ERP account is ready. Set your password here (valid 7 days): ${invite.link}`,
      )}`
    : "#";

  return (
    <Dialog open={invite !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign-in link for {invite?.name}</DialogTitle>
          <DialogDescription>
            They open this link, choose a password, then sign in with{" "}
            <strong className="break-all">{invite?.email}</strong>, on a phone or a computer.
          </DialogDescription>
        </DialogHeader>

        {invite?.emailSent ? (
          <p className="flex items-start gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <MailCheck className="mt-0.5 size-4 shrink-0" /> Invite email sent.
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <MailWarning className="mt-0.5 size-4 shrink-0" />
            <span>
              The email could not be sent{invite?.emailError ? ` (${invite.emailError})` : ""}. Share
              the link below with them directly.
            </span>
          </p>
        )}

        <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs break-all select-all">
          {invite?.link}
        </div>
        <p className="text-xs text-muted-foreground">Valid for 7 days and works once.</p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" render={<a href={whatsapp} target="_blank" rel="noreferrer" />}>
            <MessageCircle className="size-4" /> WhatsApp
          </Button>
          <Button onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
