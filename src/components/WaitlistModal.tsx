import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  className?: string;
};

export default function WaitlistModal({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const resp = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.ok) {
        setSent(true);
      } else {
        throw new Error(data?.message || "Failed to join waitlist");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to join waitlist. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setEmail("");
    setError(null);
    setSending(false);
    setSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          Join Waitlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Join the waitlist</DialogTitle>
          <DialogDescription>
            Leave your email and we'll let you know as soon as we're ready for you.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-sm text-foreground">
            Thanks! You're on the list — we'll be in touch soon.
            <div className="mt-4">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="waitlist-email">Your email</Label>
              <Input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onSend} disabled={sending || email.trim().length === 0}>
                {sending ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
