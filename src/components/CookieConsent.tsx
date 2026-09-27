import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { OPEN_CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";

/** Bottom banner asking for analytics consent. Analytics load only after "Accept". */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (value: "granted" | "denied") => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[70] border-t bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          We use optional analytics cookies (Google Analytics) to understand how the site is used. Essential
          storage needed to deliver your assessment and plan is always on.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => choose("denied")}>
            Decline
          </Button>
          <Button onClick={() => choose("granted")}>Accept analytics</Button>
        </div>
      </div>
    </div>
  );
}
