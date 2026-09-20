import type { Metadata } from "next";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Custom Hair Plan",
  description:
    "Science-backed hair regrowth guides, nutrition tips, success stories, and answers to common questions about treating thinning hair.",
};

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        {/* Additional blog-specific SEO */}
        <meta name="robots" content="noarchive" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          ← Back to homepage
        </Link>

        {/* Blog header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
            Latest Insights & Guides
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Science-backed hair regrowth guides, nutrition tips, success stories, and answers to common questions about treating thinning hair.
          </p>
        </div>

        {/* Blog content */}
        <main>{children}</main>

        {/* Recent posts widget */}
        <section className="mt-12 pt-8 border-t">
          <h3 className="text-lg font-semibold text-primary mb-4">Subscribe to our newsletter</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get weekly hair health tips, science updates, and exclusive content delivered to your inbox.
          </p>
          {/* Email signup form - connect to /api/email-subscribe endpoint */}
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md text-sm">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            No spam, unsubscribe anytime. Join 1,500+ subscribers.
          </p>
        </section>
      </div>
    </>
  );
}
