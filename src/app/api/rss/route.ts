import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const posts = [
      {
        title: "Science of Hair Growth: What Actually Works (2025 Guide)",
        link: "/blog/science-of-hair-growth",
        description:
          "Comprehensive guide to evidence-based hair regrowth treatments, supplements, and lifestyle changes that deliver real results.",
        pubDate: new Date("2025-01-15T10:00:00Z").toUTCString(),
      },
    ];

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Custom Hair Plan Blog</title>
    <link>https://customhairplan.com/</link>
    <description>Science-backed hair regrowth guides, nutrition tips, success stories, and answers to common questions about treating thinning hair.</description>
    <language>en-us</language>
    <copyright>© 2025 Custom Hair Plan by Agile Rant</copyright>
    <generator>Custom Hair Plan RSS Feed</generator>
    
    ${posts.map(
      (post) => `
    <item>
      <title>${post.title}</title>
      <link>${request.nextUrl.origin}${post.link}</link>
      <description>${post.description}</description>
      <pubDate>${post.pubDate}</pubDate>
      <guid isPermaLink="true">${request.nextUrl.origin}${post.link}</guid>
    </item>`
    ).join("")}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("RSS Feed Error:", error);
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}
