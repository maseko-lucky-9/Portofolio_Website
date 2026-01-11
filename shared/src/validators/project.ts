/**
 * Project Validation Schemas
 */

import { z } from 'zod';
import {
  slugSchema,
  urlSchema,
  uuidSchema,
  projectStatusSchema,
} from './common.js';

export const createProjectSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  description: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional().nullable(),
  techStack: z.array(z.string()).default([]),
  category: z.string().max(100).optional().nullable(),
  client: z.string().max(200).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  duration: z.string().max(100).optional().nullable(),
  githubUrl: urlSchema.optional().nullable(),
  liveUrl: urlSchema.optional().nullable(),
  demoUrl: urlSchema.optional().nullable(),
  thumbnail: urlSchema.optional().nullable(),
  images: z.array(urlSchema).default([]),
  videoUrl: urlSchema.optional().nullable(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  status: projectStatusSchema.default('DRAFT'),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  tagIds: z.array(uuidSchema).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: projectStatusSchema.optional(),
  featured: z.coerce.boolean().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryParams = z.infer<typeof projectQuerySchema>;
