import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { config } from '../config/index.js';
import { ApiError, PaginatedResult, paginate } from '../utils/errors.js';
import { parseMarkdown, getReadingTime, getWordCount } from '../utils/markdown.js';
import { ArticleStatus } from '@prisma/client';
import { CreateArticleInput, UpdateArticleInput } from '../utils/validation.js';

export class ArticleService {
  // List articles with filters and pagination
  async listArticles(options: {
    page: number;
    limit: number;
    status?: ArticleStatus;
    featured?: boolean;
    tag?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResult<unknown>> {
    const { page, limit, status, featured, tag, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build cache key
    const cacheKey = cacheKeys.articleList(
      page,
      JSON.stringify({ status, featured, tag, search, sortBy, sortOrder })
    );

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached as PaginatedResult<unknown>;
    }

    // Build where clause
    const where = {
      ...(status && { status }),
      ...(featured !== undefined && { featured }),
      ...(tag && {
        tags: {
          some: {
            tag: {
              slug: tag,
            },
          },
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Get total count
    const total = await prisma.article.count({ where });

    // Get articles
    const articles = await prisma.article.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        coverImage: true,
        readingTime: true,
        wordCount: true,
        featured: true,
        views: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const result = paginate(articles, total, { page, limit, sortBy, sortOrder });

    // Cache result
    await cache.set(cacheKey, result, config.cache.articlesTtl);

    return result;
  }

  // Get single article by slug
  async getArticleBySlug(slug: string, trackView: boolean = true): Promise<unknown> {
    // Try cache first
    const cacheKey = cacheKeys.article(slug);
    const cached = await cache.get(cacheKey);
    if (cached) {
      if (trackView) {
        // Increment views in background
        prisma.article.update({
          where: { slug },
          data: { views: { increment: 1 } },
        }).catch(() => {});
      }
      return cached;
    }

    // Fetch from database
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    if (!article) {
      throw ApiError.notFound('Article');
    }

    // Parse markdown content
    const parsed = parseMarkdown(article.content);

    const result = {
      ...article,
      contentHtml: parsed.html,
      toc: parsed.toc,
    };

    // Cache the result
    await cache.set(cacheKey, result, config.cache.articlesTtl);

    // Increment views
    if (trackView) {
      await prisma.article.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return result;
  }

  // Get article by ID
  async getArticleById(id: string): Promise<unknown> {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!article) {
      throw ApiError.notFound('Article');
    }

    return article;
  }

  // Create article
  async createArticle(data: CreateArticleInput, authorId: string): Promise<unknown> {
    // Check if slug already exists
    const existing = await prisma.article.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Article with this slug already exists');
    }

    // Parse markdown to generate excerpt and reading time
    const parsed = parseMarkdown(data.content);
    const excerpt = data.excerpt || parsed.excerpt;
    const readingTime = parsed.readingTime.minutes;
    const wordCount = parsed.wordCount;

    // Create article
    const article = await prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        excerpt,
        readingTime,
        wordCount,
        coverImage: data.coverImage,
        featured: data.featured,
        sortOrder: data.sortOrder,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl,
        authorId,
        ...(data.status === 'PUBLISHED' && { publishedAt: new Date() }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Add tags
    if (data.tagIds.length > 0) {
      await prisma.articleTag.createMany({
        data: data.tagIds.map((tagId) => ({
          articleId: article.id,
          tagId,
        })),
      });
    }

    // Invalidate cache
    await cache.delPattern('articles:list:*');

    return article;
  }

  // Update article
  async updateArticle(id: string, data: UpdateArticleInput): Promise<unknown> {
    // Check if article exists
    const existing = await prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Article');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        throw ApiError.conflict('Article with this slug already exists');
      }
    }

    // Generate excerpt and reading time if content changed
    let excerpt = data.excerpt;
    let readingTime = existing.readingTime;
    let wordCount = existing.wordCount;

    if (data.content) {
      const parsed = parseMarkdown(data.content);
      excerpt = data.excerpt || parsed.excerpt;
      readingTime = parsed.readingTime.minutes;
      wordCount = parsed.wordCount;
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.content && { content: data.content }),
        ...(excerpt && { excerpt }),
        ...(data.content && { readingTime, wordCount }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.status && { status: data.status }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.canonicalUrl !== undefined && { canonicalUrl: data.canonicalUrl }),
        ...(data.status === 'PUBLISHED' && !existing.publishedAt && { publishedAt: new Date() }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update tags if provided
    if (data.tagIds) {
      await prisma.articleTag.deleteMany({
        where: { articleId: id },
      });
      await prisma.articleTag.createMany({
        data: data.tagIds.map((tagId) => ({
          articleId: id,
          tagId,
        })),
      });
    }

    // Invalidate cache
    await cache.delPattern('articles:*');
    if (existing.slug) {
      await cache.del(cacheKeys.article(existing.slug));
    }
    if (data.slug) {
      await cache.del(cacheKeys.article(data.slug));
    }

    return article;
  }

  // Delete (archive) article
  async deleteArticle(id: string): Promise<void> {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!article) {
      throw ApiError.notFound('Article');
    }

    // Soft delete by archiving
    await prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.ARCHIVED,
      },
    });

    // Invalidate cache
    await cache.delPattern('articles:*');
    await cache.del(cacheKeys.article(article.slug));
  }

  // Get related articles
  async getRelatedArticles(articleId: string, limit: number = 3): Promise<unknown[]> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    if (!article) {
      return [];
    }

    const tagIds = article.tags.map((t) => t.tagId);

    // Find articles with similar tags
    const related = await prisma.article.findMany({
      where: {
        id: { not: articleId },
        status: ArticleStatus.PUBLISHED,
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      take: limit,
      orderBy: {
        views: 'desc',
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        coverImage: true,
        readingTime: true,
        views: true,
        publishedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return related;
  }
}

export const articleService = new ArticleService();
