import { z } from 'zod';
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const slugSchema = z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');
export const emailSchema = z.string().email('Invalid email format');
export const urlSchema = z.string().url('Invalid URL format');
export const isoDateSchema = z.string().datetime('Invalid ISO date format');
export const paginationParamsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export const paginationMetaSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pages: z.number().int().nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
});
export const idParamSchema = z.object({
    id: uuidSchema,
});
export const slugParamSchema = z.object({
    slug: slugSchema,
});
export const searchParamsSchema = z.object({
    q: z.string().optional(),
    search: z.string().optional(),
});
export const filterParamsSchema = z.object({
    status: z.string().optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    featured: z.coerce.boolean().optional(),
});
export const queryParamsSchema = paginationParamsSchema
    .merge(searchParamsSchema)
    .merge(filterParamsSchema);
export const apiResponseSchema = (dataSchema) => z.object({
    data: dataSchema,
    meta: z
        .object({
        requestId: z.string().optional(),
        timestamp: isoDateSchema,
        version: z.string().optional(),
    })
        .optional(),
    links: z.record(z.string()).optional(),
});
export const errorResponseSchema = z.object({
    error: z.object({
        statusCode: z.number().int(),
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }),
    meta: z
        .object({
        requestId: z.string().optional(),
        timestamp: isoDateSchema,
    })
        .optional(),
});
export const paginatedResponseSchema = (itemSchema) => z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
    links: z
        .object({
        first: z.string().optional(),
        prev: z.string().optional(),
        next: z.string().optional(),
        last: z.string().optional(),
    })
        .optional(),
});
export const projectStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const articleStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const userRoleSchema = z.enum(['VIEWER', 'EDITOR', 'ADMIN']);
export const eventTypeSchema = z.enum([
    'PAGE_VIEW',
    'PROJECT_VIEW',
    'ARTICLE_VIEW',
    'LIKE',
    'SHARE',
    'CONTACT_SUBMIT',
    'NEWSLETTER_SUBSCRIBE',
    'DOWNLOAD',
    'EXTERNAL_LINK_CLICK',
]);
//# sourceMappingURL=common.js.map