import { useMemo, useRef } from "react";
import { Clock, ArrowRight, Tag, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { useArticles } from "@/hooks/use-articles";
import { blogPosts as staticBlogPosts } from "@/data/blog";
import { env } from "@/config/env";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleStatus } from "@/types/api";
import type { Article } from "@/types/api";

import { revealOnScroll, useAnime } from "@/lib/use-anime";

// Map API Article to the shape the blog template expects
interface DisplayBlogPost {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  imageUrl: string;
  url: string;
}

function mapArticle(article: Article): DisplayBlogPost {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt || "",
    publishedAt: article.publishedAt
      ? format(new Date(article.publishedAt), "MMM d, yyyy")
      : "Draft",
    readTime: `${article.readingTime} min read`,
    tags: article.tags?.map((t) => t.name) || [],
    imageUrl: article.coverImage || "https://placehold.co/400x250/1e293b/94a3b8?text=Article",
    url: `/blog/${article.slug}`,
  };
}

function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
    </div>
  );
}

export function BlogSection() {
  const rootRef = useRef<HTMLElement>(null);

  // Fetch latest 3 published articles
  const {
    data: apiResponse,
    isLoading,
    isError,
    refetch,
  } = useArticles({
    status: ArticleStatus.PUBLISHED,
    limit: 3,
    sortBy: "publishedAt",
    sortOrder: "desc",
  });

  const blogPosts: DisplayBlogPost[] = useMemo(() => {
    if (!env.useApi && !apiResponse) return staticBlogPosts;

    if (apiResponse?.data && apiResponse.data.length > 0) {
      return apiResponse.data.map(mapArticle);
    }

    // Fallback to static on error or empty
    return staticBlogPosts;
  }, [apiResponse]);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 90 });
    },
    // Re-run after blogPosts changes from skeleton → real list so the
    // newly-mounted card refs are picked up by querySelectorAll.
    [blogPosts.length, isLoading],
  );

  return (
    <section
      ref={rootRef}
      id="blog"
      aria-labelledby="blog-heading"
      className="py-20 section-mesh"
      style={{ background: "oklch(var(--muted) / var(--opacity-soft))" }}
    >
      <div className="section-container">
        {/* Section Header */}
        <div data-anime className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Blog
          </span>
          <h2 id="blog-heading" className="section-title">
            Notes
          </h2>
          <p className="section-subtitle mx-auto">Working notes on software I&apos;ve shipped.</p>
        </div>

        {/* Error State */}
        {isError && env.useApi && (
          <div className="flex items-center justify-center gap-2 mb-8 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load latest articles.</span>
            <button onClick={() => refetch()} className="underline font-medium hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Blog Grid */}
        {!isLoading && blogPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} data-anime className="group">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border overflow-hidden transition-all"
                  style={{
                    background: "oklch(var(--card))",
                    boxShadow: "var(--shadow-md)",
                    borderColor: "oklch(var(--border))",
                    transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "oklch(var(--primary) / 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--border))";
                  }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      loading="lazy"
                      width={400}
                      height={250}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, oklch(var(--background) / var(--opacity-overlay)), transparent)",
                      }}
                    />

                    {/* Read time badge */}
                    <div
                      className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "oklch(var(--background))",
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Date */}
                    <p className="text-xs text-muted-foreground mb-2">{post.publishedAt}</p>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.map((tag) => (
                          <span key={tag} className="tech-badge text-xs">
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read more */}
                    <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Read article
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && blogPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(var(--primary) / 0.1)" }}
            >
              <FileText className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">No articles yet</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for articles and tutorials.
            </p>
          </div>
        )}

        {/* View All Link */}
        {!isLoading && blogPosts.length > 0 && (
          <div data-anime className="text-center mt-12">
            <a href="/blog" className="btn-hero-secondary">
              View All Articles
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
