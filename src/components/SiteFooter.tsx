import React from "react";
import HelpLink from "@/components/HelpLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { openConsentSettings } from "@/lib/consent";
import { POLICY_EFFECTIVE_DATE, SUPPORT_EMAIL } from "@/lib/site";

type Props = {
  /** Props forwarded to the Help/Contact link. */
  help: React.ComponentProps<typeof HelpLink>;
  maxWidthClass?: string;
};

const Term = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <p>
    <span className="font-medium text-foreground">{label}:</span> {children}
  </p>
);

export default function SiteFooter({ help, maxWidthClass = "max-w-7xl" }: Props) {
  return (
    <footer className="border-t">
      <div className={`mx-auto ${maxWidthClass} w-full px-4 py-10 text-sm text-muted-foreground`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Custom Hair Plan by Agile Rant. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-primary">Privacy</button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                  <DialogDescription>How we collect, use, and protect your information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>Custom Hair Plan by Agile Rant (“we”, “us”) respects your privacy. This policy explains what we collect when you use our site, why we collect it, and how we handle it.</p>
                  <Term label="Information we collect">assessment answers (which can include health-related information such as conditions affecting nutrient absorption, diet, stress, and supplements), email address, technical data (like IP address and device info), and payment confirmations from our provider (Stripe). We do not store card numbers.</Term>
                  <Term label="How we use it">to provide your insight and full plan, process payments, send emails you request (like plan delivery), improve the service, and keep the platform secure. We use your health-related answers only to generate your plan.</Term>
                  <Term label="Cookies and analytics">with your consent, we use Google Analytics cookies to understand site usage. You can change your choice anytime via “Cookie settings” in the footer. Essential browser storage used to carry your answers through checkout is always on.</Term>
                  <Term label="Sharing">we share data only with processors we use to operate the service (hosting, database, email delivery, analytics, and payments). Your assessment answers are not sent to our payment provider. We don’t sell your personal information.</Term>
                  <Term label="Retention">we keep data as long as needed to provide the service and for legitimate business or legal reasons, then delete or anonymize it.</Term>
                  <Term label="Your choices">you can request access to or deletion of your data by emailing {SUPPORT_EMAIL}. You can unsubscribe from non-essential emails at any time using the link in those emails.</Term>
                  <Term label="Security">we use reasonable technical and organizational measures to protect your data. No method of transmission or storage is 100% secure.</Term>
                  <Term label="Children">the service isn’t intended for individuals under 18.</Term>
                  <Term label="Contact">use the Contact/Help link in the footer or email {SUPPORT_EMAIL}.</Term>
                  <p className="text-xs">Effective: {POLICY_EFFECTIVE_DATE}</p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-primary">Terms</button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Terms of Service</DialogTitle>
                  <DialogDescription>Your agreement to use our service.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>By using Custom Hair Plan by Agile Rant (“Service”), you agree to these Terms. If you don’t agree, please don’t use the Service.</p>
                  <Term label="Use of Service">You may use the Service for personal, non‑commercial purposes and must comply with applicable laws.</Term>
                  <Term label="No medical advice">Content is for educational purposes only and does not constitute medical advice. Consult your clinician before making changes.</Term>
                  <Term label="Payments and refunds">Payments are processed by Stripe. Access to the full plan is delivered upon successful payment. Taxes may apply. If you’re not satisfied, email {SUPPORT_EMAIL} within 30 days of purchase for a full refund.</Term>
                  <Term label="Communications">You agree to provide accurate information and consent to receive emails related to plan delivery and important updates. You can unsubscribe from non-essential emails at any time.</Term>
                  <Term label="Intellectual property">The Service and content are owned by Agile Rant or its licensors. You may not copy, modify, or resell without permission.</Term>
                  <Term label="Prohibited conduct">Don’t misuse the Service, attempt to access others’ data, or interfere with operation or security.</Term>
                  <Term label="Disclaimers">The Service is provided “as is” without warranties. We do not guarantee outcomes, results, or uninterrupted availability.</Term>
                  <Term label="Limitation of liability">To the fullest extent permitted by law, Agile Rant and its affiliates are not liable for indirect, incidental, or consequential damages.</Term>
                  <Term label="Governing law">These Terms are governed by the laws of the jurisdiction where Agile Rant operates, without regard to conflict of law principles.</Term>
                  <Term label="Changes">We may update these Terms. Material changes will be indicated by updating the Effective date.</Term>
                  <Term label="Contact">use the Contact/Help link in the footer or email {SUPPORT_EMAIL}.</Term>
                  <p className="text-xs">Effective: {POLICY_EFFECTIVE_DATE}</p>
                </div>
              </DialogContent>
            </Dialog>

            <button className="hover:text-primary" onClick={openConsentSettings}>
              Cookie settings
            </button>

            <HelpLink {...help} />
          </div>
        </div>
      </div>
    </footer>
  );
}
