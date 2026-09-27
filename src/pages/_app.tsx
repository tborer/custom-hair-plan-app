import type { AppProps } from 'next/app'
import '../styles/globals.css';
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import CookieConsent from "@/components/CookieConsent";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // Analytics load only after the visitor accepts analytics cookies.
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    setAnalyticsAllowed(readConsent() === "granted");
    const onChange = (e: Event) => {
      const granted = (e as CustomEvent).detail === "granted";
      setAnalyticsAllowed(granted);
      // @ts-ignore - gtag injected by our inline script
      window.gtag?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    // Get the color-scheme value from :root
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const colorScheme = computedStyle.getPropertyValue('--mode').trim().replace(/"/g, '');
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
    setMounted(true);
  }, []);

  // Send GA4 page_view on route changes (SPA)
  useEffect(() => {
    if (!GA_ID || !analyticsAllowed) return;

    const handleRouteChange = (url: string) => {
      // @ts-ignore - gtag injected by our inline script
      window.gtag?.('config', GA_ID, { page_path: url, transport_type: 'image' });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    // Initial page view is sent once GA script loads (see onLoad on ga4-script)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [GA_ID, analyticsAllowed, router.events]);

  // Prevent flash while theme loads
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Google tag (gtag.js) */}
      {GA_ID && analyticsAllowed && (
        <>
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            onLoad={() => {
              // @ts-ignore
              window.gtag?.('config', GA_ID, { page_path: window.location.pathname + window.location.search, transport_type: 'image' });
            }}
          />
          <Script
            id="ga4-inline"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false, transport_type: 'image' });
            `}
          </Script>
        </>
      )}

      <Component {...pageProps} />
      <Toaster />
      <CookieConsent />
    </div>
  )
}