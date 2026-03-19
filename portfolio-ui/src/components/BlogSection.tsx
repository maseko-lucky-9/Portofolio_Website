import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Tag, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { useArticles } from "@/hooks/use-articles";
import { blogPosts as staticBlogPosts } from "@/data/blog";
import { env } from "@/config/env";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleStatus } from "@/types/api";
import type { Article } from "@/types/api";

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
    <div className="rounded-xl border bg-card overflow-hidden">
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
  // Fetch latest 3 published articles
  const { data: apiResponse, isLoading, isError, refetch } = useArticles({
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

  return (
    <section id="blog" aria-labelledby="blog-heading" className="py-20 bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 id="blog-heading" className="section-title">Latest Articles</h2>
          <p className="section-subtitle mx-auto">
            Thoughts, tutorials, and insights on software development.
          </p>
        </motion.div>

        {/* Error State */}
        {isError && env.useApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-8 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load latest articles.</span>
            <button
              onClick={() => refetch()}
              className="underline font-medium hover:no-underline"
            >
              Retry
            </button>
          </motion.div>
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
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border bg-card overflow-hidden transition-all hover:-translate-y-2"
                  style={{ boxShadow: "var(--shadow-md)" }}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

                    {/* Read time badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 text-xs font-medium">
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
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs"
                          >
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
              </motion.article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && blogPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No articles yet</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for articles and tutorials.
            </p>
          </motion.div>
        )}

        {/* View All Link */}
        {!isLoading && blogPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <a
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-accent transition-colors font-medium"
            >
              View All Articles
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
