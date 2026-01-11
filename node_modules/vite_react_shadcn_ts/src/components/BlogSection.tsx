import { motion } from "framer-motion";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { blogPosts } from "@/data/blog";

export function BlogSection() {
  return (
    <section id="blog" className="py-20 bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-title">Latest Articles</h2>
          <p className="section-subtitle mx-auto">
            Thoughts, tutorials, and insights on software development.
          </p>
        </motion.div>

        {/* Blog Grid */}
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

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="https://yourblog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-accent transition-colors font-medium"
          >
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
