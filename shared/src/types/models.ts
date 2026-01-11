/**
 * Domain Model Types
 * Shared types for domain entities across frontend and backend
 */

// ==========================================
// Common Types
// ==========================================

export type UUID = string;
export type ISODateString = string;
export type Slug = string;
export type URL = string;

// ==========================================
// Enums
// ==========================================

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum UserRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export enum EventType {
  PAGE_VIEW = 'PAGE_VIEW',
  PROJECT_VIEW = 'PROJECT_VIEW',
  ARTICLE_VIEW = 'ARTICLE_VIEW',
  LIKE = 'LIKE',
  SHARE = 'SHARE',
  CONTACT_SUBMIT = 'CONTACT_SUBMIT',
  NEWSLETTER_SUBSCRIBE = 'NEWSLETTER_SUBSCRIBE',
  DOWNLOAD = 'DOWNLOAD',
  EXTERNAL_LINK_CLICK = 'EXTERNAL_LINK_CLICK',
}

// ==========================================
// User Types
// ==========================================

export interface User {
  id: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  lastLoginAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserProfile {
  id: UUID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
}

// ==========================================
// Tag Types
// ==========================================

export interface Tag {
  id: UUID;
  name: string;
  slug: Slug;
  description: string | null;
  color: string | null;
  createdAt: ISODateString;
}

export interface TagSummary {
  id: UUID;
  name: string;
  slug: Slug;
  color: string | null;
}

// ==========================================
// Project Types
// ==========================================

export interface Project {
  id: UUID;
  slug: Slug;
  title: string;
  subtitle: string | null;
  description: string;
  content: string;
  excerpt: string | null;
  techStack: string[];
  category: string | null;
  client: string | null;
  year: number | null;
  duration: string | null;
  githubUrl: URL | null;
  liveUrl: URL | null;
  demoUrl: URL | null;
  thumbnail: URL | null;
  images: URL[];
  videoUrl: URL | null;
  featured: boolean;
  sortOrder: number;
  views: number;
  likes: number;
  status: ProjectStatus;
  publishedAt: ISODateString | null;
  archivedAt: ISODateString | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: UUID;
  author?: UserProfile;
  tags?: TagSummary[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProjectSummary {
  id: UUID;
  slug: Slug;
  title: string;
  subtitle: string | null;
  description: string;
  excerpt: string | null;
  techStack: string[];
  thumbnail: URL | null;
  featured: boolean;
  views: number;
  likes: number;
  status: ProjectStatus;
  publishedAt: ISODateString | null;
  tags?: TagSummary[];
  createdAt: ISODateString;
}

export interface ProjectDetail extends Project {
  author: UserProfile;
  tags: TagSummary[];
  relatedProjects?: ProjectSummary[];
}

// ==========================================
// Article Types
// ==========================================

export interface Article {
  id: UUID;
  slug: Slug;
  title: string;
  subtitle: string | null;
  description: string;
  content: string;
  excerpt: string | null;
  coverImage: URL | null;
  readingTime: number;
  wordCount: number;
  featured: boolean;
  sortOrder: number;
  views: number;
  likes: number;
  status: ArticleStatus;
  publishedAt: ISODateString | null;
  archivedAt: ISODateString | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: URL | null;
  authorId: UUID;
  author?: UserProfile;
  tags?: TagSummary[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ArticleSummary {
  id: UUID;
  slug: Slug;
  title: string;
  subtitle: string | null;
  description: string;
  excerpt: string | null;
  coverImage: URL | null;
  readingTime: number;
  featured: boolean;
  views: number;
  likes: number;
  status: ArticleStatus;
  publishedAt: ISODateString | null;
  tags?: TagSummary[];
  createdAt: ISODateString;
}

export interface ArticleDetail extends Article {
  author: UserProfile;
  tags: TagSummary[];
  relatedArticles?: ArticleSummary[];
}

// ==========================================
// Contact Types
// ==========================================

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  company: string | null;
}

export interface ContactResponse {
  id: UUID;
  success: boolean;
  message: string;
  submittedAt: ISODateString;
}

// ==========================================
// Newsletter Types
// ==========================================

export interface NewsletterSubscription {
  email: string;
  name: string | null;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  subscribedAt: ISODateString;
}

// ==========================================
// Analytics Types
// ==========================================

export interface AnalyticsEvent {
  eventType: EventType;
  projectId?: UUID;
  articleId?: UUID;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userAgent?: string;
}

export interface AnalyticsStats {
  totalProjects: number;
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  projectViews: number;
  articleViews: number;
  popularProjects: ProjectSummary[];
  popularArticles: ArticleSummary[];
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  type: EventType;
  title: string;
  url: string;
  timestamp: ISODateString;
}
