import { Metadata } from "next";
import { notFound } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Clock, FileText } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedDate: string;
  readTime: number;
  author?: string;
}

// Sample blog post data - replace with dynamic fetching from database/API
const posts: BlogPost[] = [
  {
    slug: "science-of-hair-growth",
    title: "Science of Hair Growth: What Actually Works (2025 Guide)",
    excerpt:
      "Comprehensive guide to evidence-based hair regrowth treatments, supplements, and lifestyle changes that deliver real results.",
    content: `
# Science of Hair Growth: What Actually Works (2025 Guide)

Hair loss affects millions of people worldwide, but the solutions available can be overwhelming. This comprehensive guide breaks down what science says about each treatment option and which ones deliver real results.

## The Biology of Hair Regrowth

To understand treatments, you need to know how hair grows:

- **Anagen phase**: Active growth phase (2-6 years)
- **Catagen phase**: Transition phase (2-3 weeks)  
- **Telogen phase**: Resting phase (3 months before shedding)

Treatments that extend the anagen phase or wake dormant follicles can regrow hair.

## Treatment Efficacy Rankings

Based on clinical trials and meta-analyses:

### 1. Minoxidil (Topical) - 54% efficacy
- Extends anagen phase
- Works for most users, especially early thinning
- Side effects: scalp irritation, unwanted hair growth

### 2. Finasteride (Oral) - 66% efficacy  
- Blocks DHT hormone causing follicle miniaturization
- More effective than topical treatments
- Requires prescription in many countries

### 3. Low-Level Laser Therapy - 45% efficacy
- Stimulates mitochondrial activity in follicles
- Weekly treatment schedule required
- Works best combined with other treatments

### 4. Nutritional Optimization - Variable efficacy
- Addresses root causes like deficiencies
- Essential but not sufficient alone
- Personalized to individual gaps

### 5. Platelet-Rich Plasma (PRP) - 70% efficacy
- Injects growth factors directly into scalp
- Requires multiple sessions initially
- Expensive but high ROI for serious thinning

## Supplement Evidence Levels

Not all supplements are created equal. Here's what the research says:

### High Evidence (Strong Clinical Support)
- **Iron**: Essential for follicle health, especially in women with deficiency
- **Vitamin D3**: Low levels correlate with alopecia
- **Zinc**: Supports keratin production and cell division

### Moderate Evidence (Mixed Results)
- **Biotin**: Works only if biotin-deficient (rare)
- **Collagen peptides**: May improve hair strength, not necessarily regrowth
- **Saw palmetto**: Weak DHT inhibition compared to finasteride

### Limited/No Evidence
- Most herbal blends without specific active ingredients
- Mega-doses without deficiency exist
- Products claiming "natural" but with no clinical testing

## Lifestyle Factors That Matter

Research-backed lifestyle interventions:

### Stress Management
- Chronic stress → telogen effluvium (shedding)
- Cortisol elevates inflammatory markers that harm follicles
- Recommended: 10+ minutes daily meditation, adequate sleep

### Nutrition Quality
- Protein intake: 0.8-1.0g/kg body weight minimum
- Avoid crash diets that trigger rapid shedding
- Focus on bioavailable iron (red meat or paired with vitamin C)

## Making Your Treatment Plan Work

Combine treatments strategically:

| Condition | Recommended Stack | Expected Timeline |
|-----------|-------------------|-------------------|
| Early thinning | Minoxidil + nutrition optimization | 3-6 months |
| Pattern hair loss | Finasteride + minoxidil + DHT blockers | 6-12 months |
| Postpartum shedding | Iron check + gentle nutrition focus | 3-4 months recovery |
| Stress-related shedding | Sleep optimization + stress management | 2-3 months |

## Conclusion

There's no magic pill, but combining evidence-based treatments with lifestyle optimization delivers the best results. Start with your free assessment to get a personalized plan that addresses YOUR unique factors.

---

*This article is for educational purposes only and not medical advice. Consult your clinician before starting any treatment.*
    `,
    publishedDate: "2025-01-15T10:00:00Z",
    readTime: 12,
  },
];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${post.title} - Custom Hair Plan`,
    description: post.excerpt,
  };
}

// Helper to fetch a single blog post (replace with database lookup)
async function getPost(slug: string): Promise<BlogPost | null> {
  const post = posts.find((p) => p.slug === slug);
  
  if (!post) {
    return null;
  }

  // In production, fetch from database by calling API endpoint here
  
  return post;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Head>
        {/* SEO: Meta description from post */}
        <meta name="description" content={post.excerpt} />
        
        {/* Schema markup for Article/NewsArticle type */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              abstract: post.excerpt,
              image: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=60",
              datePublished: post.publishedDate,
              author: {
                "@type": "Person",
                name: "Custom Hair Plan Editorial Team",
              },
            }),
          }}
        />
      </Head>

      <article className="prose prose-lg dark:prose-invert max-w-none">
        <header className="mb-8 border-b pb-6">
          {/* Breadcrumb navigation */}
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Blog</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} minute read</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Published {new Date(post.publishedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Internal links to related content */}
        <section className="mt-12 border-t pt-8">
          <h3 className="text-lg font-semibold text-primary mb-4">Related Reading</h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/blog/supplements-for-hair-growth"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Best Supplements for Hair Growth: What the Science Says
              </Link>
            </li>
            <li>
              <Link
                href="/blog/stress-and-hair-loss"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                How Stress Affects Your Hair and Ways to Manage It
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                Start Your Personalized Hair Regrowth Plan Today
              </Link>
            </li>
          </ul>
        </section>

        {/* Share and related content */}
        <footer className="mt-8 border-t pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Found this guide helpful? Share it with someone who could benefit from evidence-based hair health information.
          </p>
        </footer>
      </article>
    </>
  );
}
