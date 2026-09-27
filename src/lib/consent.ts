/** Analytics cookie consent, stored per browser. */
export type ConsentValue = "granted" | "denied";

const KEY = "cookie_consent";
export const CONSENT_EVENT = "cookie-consent-change";
export const OPEN_CONSENT_EVENT = "cookie-consent-open";

export function readConsent(): ConsentValue | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // storage blocked - consent applies to this page view only
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
