import { prisma } from '../config/database.js';
import { cache, cacheKeys } from '../config/redis.js';
import { config } from '../config/index.js';
import { ApiError, PaginatedResult, paginate } from '../utils/errors.js';
import { parseMarkdown } from '../utils/markdown.js';
import { ProjectStatus } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput } from '../utils/validation.js';

export class ProjectService {
  // List projects with filters and pagination
  async listProjects(options: {
    page: number;
    limit: number;
    featured?: boolean;
    category?: string;
    tag?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResult<unknown>> {
    const {
      page,
      limit,
      featured,
      category,
      tag,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build cache key
    //
    // `limit` MUST be part of the key. It was omitted, so every page-1 request
    // with the same filters shared one entry regardless of page size: whoever
    // asked first decided how many items everyone else got, and the returned
    // meta.limit contradicted the caller's own query string. Caught by
    // tests/e2e/projects.test.ts asserting meta.limit reflects ?limit=.
    const cacheKey = cacheKeys.projectList(
      page,
      JSON.stringify({ limit, featured, category, tag, search, sortBy, sortOrder })
    );

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached as PaginatedResult<unknown>;
    }

    // Build where clause
    const where = {
      // PUBLISHED only, and NOT caller-controllable.
      //
      // This is the public listing route -- there is no authenticated one. The
      // `status` filter that used to sit here was honoured straight from the
      // query string, so `?status=DRAFT` returned unannounced work to anyone
      // who asked. It was invisible on the article side only because a broken
      // response schema was discarding the payload; removing that schema is
      // what exposed it, so the filter is fixed here rather than re-masked.
      //
      // If an authenticated listing is ever added, it must NOT simply pass a
      // status through: cacheKeys.projectList has no privilege dimension, so an
      // admin's draft-inclusive page would be cached and then served to the
      // next anonymous caller.
      status: ProjectStatus.PUBLISHED,
      ...(featured !== undefined && { featured }),
      ...(category && { category }),
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
          { description: { contains: search, mode: 'insensitive' as const } },
          { techStack: { hasSome: [search] } },
        ],
      }),
    };

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        excerpt: true,
        techStack: true,
        category: true,
        client: true,
        year: true,
        thumbnail: true,
        githubUrl: true,
        liveUrl: true,
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
          },
        },
      },
    });

    const result = paginate(projects, total, { page, limit, sortBy, sortOrder });

    // Cache result
    await cache.set(cacheKey, result, config.cache.projectsTtl);

    return result;
  }

  // Get single project by slug
  async getProjectBySlug(slug: string, trackView: boolean = true): Promise<unknown> {
    // Try cache first
    const cacheKey = cacheKeys.project(slug);
    const cached = await cache.get(cacheKey);
    if (cached) {
      // The cache is NOT authoritative for an access-control decision.
      //
      // This branch returns BEFORE the findFirst below, so without this check
      // the status filter is bypassed entirely whenever an entry exists --
      // proven with a slug that had no database row at all: planting a DRAFT
      // payload under its key made the public endpoint answer 200 with the
      // draft body.
      //
      // What this DOES catch: any entry whose stored payload is itself marked
      // unpublished -- which is what the previous code cached, because it read
      // with findUnique and no status predicate. Those entries survive a
      // deploy (one-hour TTL), which is why the v2 namespace bump in redis.ts
      // exists alongside this.
      //
      // What it does NOT catch, stated plainly so nobody reads this as more
      // than it is: an entry cached WHILE the row was still published and only
      // unpublished afterwards. Its payload says PUBLISHED, so this check
      // passes it. That window is closed by invalidation
      // (cache.del(cacheKeys.project(slug)) in updateProject/deleteProject),
      // not here -- and if that del is skipped or fails, the stale PUBLISHED
      // snapshot is served for the remainder of the TTL. Narrowing it further
      // needs a second delayed invalidation or a shorter detail TTL; both are
      // real work and neither belongs in this change.
      if ((cached as { status?: string }).status === ProjectStatus.PUBLISHED) {
        if (trackView) {
          // Increment views in background
          prisma.project
            .update({
              where: { slug },
              data: { views: { increment: 1 } },
            })
            .catch(() => {});
        }
        return cached;
      }

      // Self-heal rather than merely ignore, so one bad entry does not force a
      // database read on every subsequent request for the whole TTL.
      await cache.del(cacheKey);
    }

    // Fetch from database
    //
    // findFirst, not findUnique: the lookup is now (slug + status) and only
    // `slug` is unique, so findUnique cannot express it. Returning null for a
    // DRAFT is deliberate -- the route turns that into a 404, which does not
    // confirm that the slug exists. A 403 would leak exactly the thing being
    // protected.
    const project = await prisma.project.findFirst({
      where: { slug, status: ProjectStatus.PUBLISHED },
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
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project');
    }

    // Parse markdown content
    const parsed = parseMarkdown(project.content);

    const result = {
      ...project,
      contentHtml: parsed.html,
      readingTime: parsed.readingTime,
      wordCount: parsed.wordCount,
      toc: parsed.toc,
    };

    // Cache the result
    await cache.set(cacheKey, result, config.cache.projectsTtl);

    // Increment views
    if (trackView) {
      await prisma.project.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return result;
  }

  // Get project by ID
  async getProjectById(id: string): Promise<unknown> {
    const project = await prisma.project.findUnique({
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

    if (!project) {
      throw ApiError.notFound('Project');
    }

    return project;
  }

  // Create project
  async createProject(data: CreateProjectInput, authorId: string): Promise<unknown> {
    // Check if slug already exists
    const existing = await prisma.project.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict('Project with this slug already exists');
    }

    // Parse markdown to generate excerpt if not provided
    const parsed = parseMarkdown(data.content);
    const excerpt = data.excerpt || parsed.excerpt;

    // Create project
    const project = await prisma.project.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        content: data.content,
        excerpt,
        techStack: data.techStack,
        category: data.category,
        client: data.client,
        year: data.year,
        duration: data.duration,
        githubUrl: data.githubUrl,
        liveUrl: data.liveUrl,
        demoUrl: data.demoUrl,
        thumbnail: data.thumbnail,
        images: data.images,
        videoUrl: data.videoUrl,
        featured: data.featured,
        sortOrder: data.sortOrder,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
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
      await prisma.projectTag.createMany({
        data: data.tagIds.map((tagId) => ({
          projectId: project.id,
          tagId,
        })),
      });
    }

    // Invalidate cache
    await cache.delPattern('projects:list:*');

    return project;
  }

  // Update project
  async updateProject(id: string, data: UpdateProjectInput): Promise<unknown> {
    // Check if project exists
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Project');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.project.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        throw ApiError.conflict('Project with this slug already exists');
      }
    }

    // Generate excerpt if content changed
    let excerpt = data.excerpt;
    if (data.content && !data.excerpt) {
      const parsed = parseMarkdown(data.content);
      excerpt = parsed.excerpt;
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.description && { description: data.description }),
        ...(data.content && { content: data.content }),
        ...(excerpt && { excerpt }),
        ...(data.techStack && { techStack: data.techStack }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.client !== undefined && { client: data.client }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.githubUrl !== undefined && { githubUrl: data.githubUrl }),
        ...(data.liveUrl !== undefined && { liveUrl: data.liveUrl }),
        ...(data.demoUrl !== undefined && { demoUrl: data.demoUrl }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.images && { images: data.images }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.status && { status: data.status }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
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
      await prisma.projectTag.deleteMany({
        where: { projectId: id },
      });
      await prisma.projectTag.createMany({
        data: data.tagIds.map((tagId) => ({
          projectId: id,
          tagId,
        })),
      });
    }

    // Invalidate cache
    await cache.delPattern('projects:*');
    if (existing.slug) {
      await cache.del(cacheKeys.project(existing.slug));
    }
    if (data.slug) {
      await cache.del(cacheKeys.project(data.slug));
    }

    return project;
  }

  // Delete (archive) project
  async deleteProject(id: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!project) {
      throw ApiError.notFound('Project');
    }

    // Soft delete by archiving
    await prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.delPattern('projects:*');
    await cache.del(cacheKeys.project(project.slug));
  }

  // Get related projects
  async getRelatedProjects(projectId: string, limit: number = 3): Promise<unknown[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    if (!project) {
      return [];
    }

    const tagIds = project.tags.map((t) => t.tagId);

    // Find projects with similar tags
    const related = await prisma.project.findMany({
      where: {
        id: { not: projectId },
        status: ProjectStatus.PUBLISHED,
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
        thumbnail: true,
        techStack: true,
        views: true,
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

export const projectService = new ProjectService();
