/**
 * Services Index
 * 
 * Central export point for all API services
 */

export { projectsService } from './projects.service';
export { articlesService } from './articles.service';
export { authService } from './auth.service';
export { contactService, newsletterService, demoService } from './contact.service';
export { tagsService } from './tags.service';
export { analyticsService } from './analytics.service';
export { codeExecutionService } from './code-execution.service';
export { healthService } from './health.service';

// Default export with all services
import { projectsService } from './projects.service';
import { articlesService } from './articles.service';
import { authService } from './auth.service';
import { contactService, newsletterService, demoService } from './contact.service';
import { tagsService } from './tags.service';
import { analyticsService } from './analytics.service';
import { codeExecutionService } from './code-execution.service';
import { healthService } from './health.service';

export default {
  projects: projectsService,
  articles: articlesService,
  auth: authService,
  contact: contactService,
  newsletter: newsletterService,
  demo: demoService,
  tags: tagsService,
  analytics: analyticsService,
  codeExecution: codeExecutionService,
  health: healthService,
};
