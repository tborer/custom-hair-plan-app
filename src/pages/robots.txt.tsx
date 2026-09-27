import type { GetServerSideProps } from "next";
import { getPublicSiteUrl } from "@/lib/site";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const body = `User-agent: *
Allow: /
Disallow: /plan/success
Disallow: /plan/cancel
Disallow: /api/

Sitemap: ${getPublicSiteUrl()}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  res.write(body);
  res.end();
  return { props: {} };
};

export default function Robots() {
  return null;
}
