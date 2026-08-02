# @portfolio/shared

Shared TypeScript types and validation schemas for the Portfolio application.

## Overview

This package provides end-to-end type safety between the frontend and backend by centralizing:

- API response types
- Domain model types
- DTO (Data Transfer Object) types
- Zod validation schemas
- Type guards and utilities

## Installation

This package is part of the monorepo workspace and is automatically linked.

## Usage

### Importing Types

```typescript
// Import specific types
import { ApiResponse, Project, ProjectSummary } from '@portfolio/shared/types';

// Import all types
import * as Types from '@portfolio/shared/types';

// Import validators
import { createProjectSchema, paginationParamsSchema } from '@portfolio/shared/validators';
```

### Backend Usage

```typescript
import { ApiResponse, Project, CreateProjectDTO } from '@portfolio/shared';
import { createProjectSchema } from '@portfolio/shared/validators';

// Type-safe response
const response: ApiResponse<Project> = {
  data: project,
  meta: {
    timestamp: new Date().toISOString(),
  },
};

// Validation
const validatedData = createProjectSchema.parse(requestBody);
```

### Frontend Usage

```typescript
import { ApiResponse, ProjectSummary, PaginatedResponse } from '@portfolio/shared';

// Type-safe API calls
async function getProjects(): Promise<PaginatedResponse<ProjectSummary>> {
  const response = await fetch('/api/v1/projects');
  return response.json();
}

// Type guards
import { isErrorResponse, isPaginatedResponse } from '@portfolio/shared/types';

if (isErrorResponse(data)) {
  // Handle error
} else if (isPaginatedResponse<ProjectSummary>(data)) {
  // Handle paginated data
}
```

## Structure

```
shared/
├── src/
│   ├── types/
│   │   ├── api.ts          # API response wrappers
│   │   ├── models.ts       # Domain models
│   │   ├── dto.ts          # Data transfer objects
│   │   ├── guards.ts       # Type guards
│   │   └── index.ts
│   ├── validators/
│   │   ├── common.ts       # Common validation schemas
│   │   ├── project.ts      # Project-specific schemas
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Type Safety Benefits

1. **Compile-Time Validation**: Catch type mismatches during development
2. **Autocomplete**: Full IDE support for API contracts
3. **Refactoring Safety**: Rename fields once, update everywhere
4. **Documentation**: Types serve as living documentation
5. **Runtime Validation**: Zod schemas validate at runtime while providing compile-time types

## Version

Current version: 1.0.0

## License

MIT
