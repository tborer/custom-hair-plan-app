/**
 * Support address shown to users and used as Reply-To. Defaults to the SMTP
 * sender (SMTP_FROM, then SMTP_USER) so no extra env var is needed; set
 * NEXT_PUBLIC_SUPPORT_EMAIL only to override it. Resolved at build time so the
 * client bundle gets the same value.
 */
function resolveSupportEmail() {
  const isEmail = (v) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v || "");
  const fromAddress = (v) => (v || "").match(/<([^>]+)>/)?.[1]?.trim() || (v || "").trim();
  const candidates = [
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    fromAddress(process.env.SMTP_FROM),
    process.env.SMTP_USER,
    fromAddress(process.env.RESEND_FROM),
  ];
  return candidates.find(isEmail) || "ar@agilerant.info";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPPORT_EMAIL: resolveSupportEmail(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["assets.co.dev", "images.unsplash.com"],
  },
  webpack: (config, context) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    return config;
  }
};

export default nextConfig;
