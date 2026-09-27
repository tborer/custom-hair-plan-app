import type { GetServerSideProps } from "next";
import { getPublicSiteUrl } from "@/lib/site";

// Generated at request time so the domain always matches NEXT_PUBLIC_SITE_URL.
const PATHS = [{ path: "/", changefreq: "weekly", priority: "1.0" }];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const site = getPublicSiteUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PATHS.map((p) => `  <url>
    <loc>${site}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
