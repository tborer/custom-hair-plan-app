import React from "react";
import { Shield, CheckCircle2, Star } from "lucide-react";

interface TrustBadgeProps {
  variant?: "stripe" | "ssl" | "user-count" | "rating" | "guarantee";
}

export const StripeSecureBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
      <Shield className="h-6 w-6 text-green-600" />
      <div className="text-left">
        <p className="text-sm font-semibold text-green-700">Powered by Stripe</p>
        <p className="text-xs text-muted-foreground">Secure checkout encryption</p>
      </div>
    </div>
  );
};

export const SSLEnabledBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
      <CheckCircle2 className="h-6 w-6 text-green-600" />
      <div className="text-left">
        <p className="text-sm font-semibold text-green-700">SSL Encrypted</p>
        <p className="text-xs text-muted-foreground">Secure HTTPS connection</p>
      </div>
    </div>
  );
};

export const TrustBadges: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-8">
      <StripeSecureBadge />
      <SSLEnabledBadge />
    </div>
  );
};

export const FooterTrustSection: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-8 border-t">
      <p className="text-sm text-muted-foreground">© 2025 Custom Hair Plan by Agile Rant. All rights reserved.</p>
      <div className="flex gap-4">
        <a href="/privacy" className="hover:text-primary text-sm transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-primary text-sm transition-colors">Terms of Service</a>
        <a href="/contact" className="hover:text-primary text-sm transition-colors">Help Center</a>
      </div>
    </div>
  );
};

export const SocialProofRow: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-6 mb-4">
      {/* User count badge */}
      <div className="text-center">
        <p className="text-lg font-bold text-primary">2,000+</p>
        <p className="text-xs text-muted-foreground">Happy users</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      {/* Rating badge */}
      <div className="text-center">
        <p className="text-lg font-bold text-primary flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          4.9/5
        </p>
        <p className="text-xs text-muted-foreground">Average rating</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      {/* Guarantee badge */}
      <div className="text-center">
        <p className="text-lg font-bold text-primary">30-day</p>
        <p className="text-xs text-muted-foreground">Money-back guarantee</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      {/* Support badge */}
      <div className="text-center">
        <p className="text-lg font-bold text-primary">2025</p>
        <p className="text-xs text-muted-foreground">Customer support hours</p>
      </div>
    </div>
  );
};

export default { TrustBadges, FooterTrustSection, SocialProofRow };
