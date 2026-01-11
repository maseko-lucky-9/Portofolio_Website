/**
 * Data Transfer Object Types
 * Types for API request/response payloads
 */

import type {
  ProjectStatus,
  ArticleStatus,
  UUID,
  Slug,
  URL,
} from './models';

// ==========================================
// Project DTOs
// ==========================================

export interface CreateProjectDTO {
  slug: Slug;
  title: string;
  subtitle?: string | null;
  description: string;
  content: string;
  excerpt?: string | null;
  techStack?: string[];
  category?: string | null;
  client?: string | null;
  year?: number | null;
  duration?: string | null;
  githubUrl?: URL | null;
  liveUrl?: URL | null;
  demoUrl?: URL | null;
  thumbnail?: URL | null;
  images?: URL[];
  videoUrl?: URL | null;
  featured?: boolean;
  sortOrder?: number;
  status?: ProjectStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tagIds?: UUID[];
}

export interface UpdateProjectDTO {
  slug?: Slug;
  title?: string;
  subtitle?: string | null;
  description?: string;
  content?: string;
  excerpt?: string | null;
  techStack?: string[];
  category?: string | null;
  client?: string | null;
  year?: number | null;
  duration?: string | null;
  githubUrl?: URL | null;
  liveUrl?: URL | null;
  demoUrl?: URL | null;
  thumbnail?: URL | null;
  images?: URL[];
  videoUrl?: URL | null;
  featured?: boolean;
  sortOrder?: number;
  status?: ProjectStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tagIds?: UUID[];
}

// ==========================================
// Article DTOs
// ==========================================

export interface CreateArticleDTO {
  slug: Slug;
  title: string;
  subtitle?: string | null;
  description: string;
  content: string;
  excerpt?: string | null;
  coverImage?: URL | null;
  featured?: boolean;
  sortOrder?: number;
  status?: ArticleStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: URL | null;
  tagIds?: UUID[];
}

export interface UpdateArticleDTO {
  slug?: Slug;
  title?: string;
  subtitle?: string | null;
  description?: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: URL | null;
  featured?: boolean;
  sortOrder?: number;
  status?: ArticleStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: URL | null;
  tagIds?: UUID[];
}

// ==========================================
// Tag DTOs
// ==========================================

export interface CreateTagDTO {
  name: string;
  slug: Slug;
  description?: string | null;
  color?: string | null;
}

export interface UpdateTagDTO {
  name?: string;
  slug?: Slug;
  description?: string | null;
  color?: string | null;
}

// ==========================================
// Auth DTOs
// ==========================================

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: UUID;
    email: string;
    role: string;
  };
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  expiresIn: number;
}

// ==========================================
// Contact DTOs
// ==========================================

export interface ContactSubmitDTO {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  phone?: string | null;
  company?: string | null;
}

// ==========================================
// Newsletter DTOs
// ==========================================

export interface NewsletterSubscribeDTO {
  email: string;
  name?: string | null;
}

// ==========================================
// Analytics DTOs
// ==========================================

export interface TrackEventDTO {
  eventType: string;
  projectId?: UUID;
  articleId?: UUID;
  metadata?: Record<string, unknown>;
}
