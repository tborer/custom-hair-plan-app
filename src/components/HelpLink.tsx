import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  page?: string;
  sessionId?: string;
  email?: string;
  className?: string;
  label?: string;
  endpoint?: string;
  title?: string;
};

export default function HelpLink({
  page,
  sessionId,
  email,
  className,
  label = "Help",
  endpoint = "/api/help",
  title = "Need help?",
}: Props) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [replyEmail, setReplyEmail] = useState(email || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email && !replyEmail) setReplyEmail(email);
  }, [email]);

  const remaining = useMemo(() => Math.max(0, 500 - msg.length), [msg]);

  const onSend = async () => {
    setError(null);
    const text = msg.trim();
    if (!text) {
      setError("Please enter a message.");
      return;
    }
    setSending(true);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        } as any,
        body: JSON.stringify({
          message: text.length > 500 ? text.slice(0, 500) : text,
          email: replyEmail?.trim() || undefined,
          page,
          sessionId,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.ok) {
        setSent(true);
      } else {
        throw new Error(data?.message || "Failed to send");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setMsg("");
    setError(null);
    setSending(false);
    setSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button type="button" className={["hover:text-primary text-sm", className].filter(Boolean).join(" ")}>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="text-sm text-foreground">
            Thanks! Your message has been sent. We’ll get back to you soon.
            <div className="mt-4">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="help-message">How can we help?</Label>
              <Textarea
                id="help-message"
                placeholder="Describe your issue (max 500 characters)"
                value={msg}
                onChange={(e) => setMsg(e.target.value.slice(0, 500))}
                className="min-h-28"
              />
              <div className="text-xs text-muted-foreground text-right">
                {remaining} characters left
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="help-email">Your email (optional, for reply)</Label>
              <Input
                id="help-email"
                type="email"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={onSend} disabled={sending || msg.trim().length === 0}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}