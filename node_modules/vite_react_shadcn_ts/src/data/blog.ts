/**
 * =============================================
 * BLOG DATA CONFIGURATION
 * =============================================
 * EDIT: Update with your blog posts or articles
 */

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  imageUrl: string;
  url: string;
}

export const blogPosts: BlogPost[] = [
  // EDIT: Blog Post 1
  {
    id: "react-performance-2024",
    title: "Optimizing React Performance in 2024",
    excerpt: "Deep dive into modern React performance patterns including concurrent features, memo optimization, and bundle size reduction strategies.",
    publishedAt: "Dec 15, 2024",
    readTime: "8 min read",
    tags: ["React", "Performance", "JavaScript"],
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    url: "https://yourblog.com/react-performance-2024",
  },
  // EDIT: Blog Post 2
  {
    id: "typescript-patterns",
    title: "Advanced TypeScript Patterns for Large-Scale Apps",
    excerpt: "Explore type-safe patterns that make your codebase more maintainable, including branded types, discriminated unions, and more.",
    publishedAt: "Nov 28, 2024",
    readTime: "12 min read",
    tags: ["TypeScript", "Architecture", "Best Practices"],
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop",
    url: "https://yourblog.com/typescript-patterns",
  },
  // EDIT: Blog Post 3
  {
    id: "building-design-systems",
    title: "Building Scalable Design Systems with Tailwind",
    excerpt: "How to create a comprehensive design system that scales across teams while maintaining consistency and developer experience.",
    publishedAt: "Oct 10, 2024",
    readTime: "10 min read",
    tags: ["CSS", "Design Systems", "Tailwind"],
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    url: "https://yourblog.com/design-systems",
  },
];
