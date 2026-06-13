import { z } from 'zod';

// Common validation schemas

// Pagination
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID parameters
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200),
});

// Project schemas
export const createProjectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  techStack: z.array(z.string()).default([]),
  category: z.string().max(100).optional(),
  client: z.string().max(200).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  duration: z.string().max(100).optional(),
  githubUrl: z.string().url().optional().nullable(),
  liveUrl: z.string().url().optional().nullable(),
  demoUrl: z.string().url().optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).default([]),
  videoUrl: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  year: z.string().regex(/^\d+$/).optional(),
});

// Combine pagination and filters for query schemas
export const projectQuerySchema = paginationSchema.merge(projectFiltersSchema);
export const projectParamsSchema = slugParamSchema;

// Article schemas
export const createArticleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  canonicalUrl: z.string().url().optional().nullable(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export const articleQuerySchema = paginationSchema.merge(articleFiltersSchema);

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Contact schemas
export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email('Invalid email address'),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  subject: z.string().max(300).optional(),
  message: z.string().min(10).max(5000),
});

// Newsletter schemas
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const confirmNewsletterSchema = z.object({
  token: z.string().min(1),
});

// Demo request schema
export const demoRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email('Invalid email address'),
  company: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  preferredDate: z.string().datetime().optional(),
  timezone: z.string().max(100).optional(),
});

// Code execution schema
export const codeExecutionSchema = z.object({
  language: z.enum(['javascript', 'typescript', 'python', 'go']),
  code: z.string().min(1).max(10000),
  input: z.string().max(1000).optional(),
});

// Tag schema
export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
});

export const updateTagSchema = createTagSchema.partial();

// Analytics event schema
export const trackEventSchema = z.object({
  eventType: z.enum([
    'PAGE_VIEW',
    'PROJECT_VIEW',
    'PROJECT_CLICK',
    'ARTICLE_VIEW',
    'RESUME_DOWNLOAD',
    'CONTACT_FORM',
    'NEWSLETTER_SIGNUP',
    'DEMO_REQUEST',
    'CODE_EXECUTION',
    'EXTERNAL_LINK',
    'SCROLL_DEPTH',
    'TIME_ON_PAGE',
  ]),
  path: z.string().optional(),
  projectId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
  eventData: z.record(z.unknown()).optional(),
  duration: z.number().int().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

// API Key schema
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

// Availability schema
export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  status: z.string().max(200).optional(),
  availableFrom: z.string().datetime().optional(),
  preferredRoles: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  remoteOnly: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

// Site settings schema
export const updateSettingSchema = z.object({
  value: z.unknown(),
});

// Types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
export type CodeExecutionInput = z.infer<typeof codeExecutionSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
