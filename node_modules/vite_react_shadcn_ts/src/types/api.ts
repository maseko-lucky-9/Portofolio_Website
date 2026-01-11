/**
 * TypeScript Type Definitions for API
 * 
 * These interfaces match the backend Prisma schema and provide
 * type safety for all API requests and responses.
 */

// ===========================================
// Enums
// ===========================================

export enum Role {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

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

export enum ContactStatus {
  NEW = 'NEW',
  READ = 'READ',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED',
  SPAM = 'SPAM',
}

export enum DemoStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventType {
  PAGE_VIEW = 'PAGE_VIEW',
  PROJECT_VIEW = 'PROJECT_VIEW',
  PROJECT_CLICK = 'PROJECT_CLICK',
  ARTICLE_VIEW = 'ARTICLE_VIEW',
  RESUME_DOWNLOAD = 'RESUME_DOWNLOAD',
  CONTACT_FORM = 'CONTACT_FORM',
  NEWSLETTER_SIGNUP = 'NEWSLETTER_SIGNUP',
  DEMO_REQUEST = 'DEMO_REQUEST',
  CODE_EXECUTION = 'CODE_EXECUTION',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  SCROLL_DEPTH = 'SCROLL_DEPTH',
  TIME_ON_PAGE = 'TIME_ON_PAGE',
}

// ===========================================
// Core Domain Models
// ===========================================

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  slug: string;
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
  githubUrl: string | null;
  liveUrl: string | null;
  demoUrl: string | null;
  thumbnail: string | null;
  images: string[];
  videoUrl: string | null;
  featured: boolean;
  sortOrder: number;
  views: number;
  likes: number;
  status: ProjectStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  author?: User;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  readingTime: number;
  wordCount: number;
  coverImage: string | null;
  featured: boolean;
  sortOrder: number;
  views: number;
  likes: number;
  status: ArticleStatus;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  author?: User;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  status: ContactStatus;
  readAt: string | null;
  repliedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  isActive: boolean;
  unsubscribedAt: string | null;
  source: string | null;
  createdAt: string;
}

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  preferredDate: string | null;
  timezone: string | null;
  status: DemoStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CodeExecution {
  id: string;
  language: string;
  code: string;
  input: string | null;
  output: string | null;
  error: string | null;
  exitCode: number | null;
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  sessionId: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: EventType;
  eventData: Record<string, unknown> | null;
  projectId: string | null;
  articleId: string | null;
  sessionId: string;
  visitorId: string | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  device: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  path: string | null;
  duration: number | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  id: string;
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  projectViews: number;
  articleViews: number;
  resumeDownloads: number;
  contactForms: number;
  topProjects: unknown | null;
  topArticles: unknown | null;
  topReferrers: unknown | null;
  topCountries: unknown | null;
  deviceBreakdown: unknown | null;
  browserBreakdown: unknown | null;
  createdAt: string;
}

export interface Availability {
  id: string;
  isAvailable: boolean;
  status: string | null;
  availableFrom: string | null;
  preferredRoles: string[];
  preferredLocations: string[];
  remoteOnly: boolean;
  notes: string | null;
  updatedAt: string;
}

// ===========================================
// API Response Wrappers
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: Record<string, string[]>;
  };
  timestamp?: string;
}

// ===========================================
// Request DTOs
// ===========================================

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
}

export interface NewsletterSignupData {
  email: string;
  firstName?: string;
  source?: string;
}

export interface DemoRequestData {
  name: string;
  email: string;
  company?: string;
  message?: string;
  preferredDate?: string;
  timezone?: string;
}

export interface CodeExecutionData {
  language: string;
  code: string;
  input?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateProjectData {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  excerpt?: string;
  techStack: string[];
  category?: string;
  client?: string;
  year?: number;
  duration?: string;
  githubUrl?: string;
  liveUrl?: string;
  demoUrl?: string;
  thumbnail?: string;
  images?: string[];
  videoUrl?: string;
  featured?: boolean;
  status?: ProjectStatus;
  tags?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

export interface CreateArticleData {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  featured?: boolean;
  status?: ArticleStatus;
  tags?: string[];
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string;
}

// ===========================================
// Query Parameters
// ===========================================

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  featured?: boolean;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'views' | 'title' | 'sortOrder';
  order?: 'asc' | 'desc';
}

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  featured?: boolean;
  tag?: string;
  search?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'views' | 'title';
  order?: 'asc' | 'desc';
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  eventType?: EventType;
  projectId?: string;
  articleId?: string;
}

// ===========================================
// Auth Responses
// ===========================================

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
  message?: string;
}

// ===========================================
// Health Check
// ===========================================

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment?: string;
  version?: string;
  uptime?: number;
  checks?: {
    database: boolean;
    redis: boolean;
  };
}
