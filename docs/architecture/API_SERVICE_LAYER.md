# TypeScript API Service Layer Documentation

## Architecture Overview

Your frontend now has a complete, production-ready API service layer with:

- ✅ TypeScript type definitions matching backend Prisma schema
- ✅ Enhanced HTTP client with interceptors, retry logic, and token management
- ✅ Resource-specific services (Projects, Articles, Auth, Contact, etc.)
- ✅ React Query integration with custom hooks
- ✅ MSW setup for testing and development
- ✅ Example components demonstrating shadcn-ui integration

---

## File Structure

```
portfolio-ui/src/
├── types/
│   └── api.ts                      # TypeScript interfaces for all API types
├── lib/
│   ├── http-client.ts              # Enhanced HTTP client with interceptors
│   └── react-query.tsx             # React Query configuration
├── services/
│   ├── base.service.ts             # Abstract base service with CRUD
│   ├── projects.service.ts         # Projects API service
│   ├── articles.service.ts         # Articles API service
│   ├── auth.service.ts             # Authentication service
│   ├── contact.service.ts          # Contact, newsletter, demo services
│   ├── tags.service.ts             # Tags service
│   ├── analytics.service.ts        # Analytics tracking service
│   ├── code-execution.service.ts   # Code execution service
│   ├── health.service.ts           # Health check service
│   └── index.ts                    # Services barrel export
├── hooks/
│   ├── use-projects.ts             # Projects React Query hooks
│   ├── use-articles.ts             # Articles React Query hooks
│   ├── use-auth.ts                 # Authentication hooks
│   ├── use-contact.ts              # Contact forms hooks
│   ├── use-tags.ts                 # Tags hooks
│   └── use-code-execution.ts       # Code execution hook
├── mocks/
│   ├── browser.ts                  # MSW browser setup
│   ├── handlers.ts                 # API mock handlers
│   └── data.ts                     # Mock data factories
└── components/
    └── examples/
        ├── ProjectsList.tsx        # Example: Projects list with loading/error states
        └── ContactForm.tsx         # Example: Contact form with validation
```

---

## Usage Guide

### 1. Setup React Query Provider

Wrap your app with the QueryProvider in `main.tsx`:

```tsx
import { QueryProvider } from '@/lib/react-query';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>
);
```

### 2. Using Hooks in Components

#### Fetching Data

```tsx
import { useProjects } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';

function ProjectsPage() {
  const { data, isLoading, error } = useProjects({ 
    page: 1, 
    limit: 10,
    status: 'PUBLISHED' 
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Alert>Error loading projects</Alert>;

  return (
    <div>
      {data?.data.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

#### Mutations (Create/Update/Delete)

```tsx
import { useCreateProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';

function CreateProject() {
  const { mutate, isPending } = useCreateProject();

  const handleSubmit = (data: CreateProjectData) => {
    mutate(data, {
      onSuccess: () => {
        console.log('Project created!');
      },
    });
  };

  return (
    <Button onClick={() => handleSubmit(data)} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Project'}
    </Button>
  );
}
```

#### Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContactForm } from '@/hooks/use-contact';

function ContactForm() {
  const { mutate, isPending } = useContactForm();
  const form = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data) => {
    mutate(data, {
      onSuccess: () => form.reset(),
    });
  };

  return <Form {...form} onSubmit={form.handleSubmit(onSubmit)} />;
}
```

### 3. Authentication Flow

```tsx
import { useLogin, useIsAuthenticated } from '@/hooks/use-auth';

function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const { isAuthenticated, user } = useIsAuthenticated();

  if (isAuthenticated) {
    return <div>Welcome, {user?.firstName}!</div>;
  }

  return (
    <button 
      onClick={() => login({ email, password })}
      disabled={isPending}
    >
      Login
    </button>
  );
}
```

### 4. Analytics Tracking

```tsx
import { analyticsService } from '@/services';
import { useEffect } from 'react';

function ProjectDetailPage({ slug }: { slug: string }) {
  useEffect(() => {
    // Track page view
    analyticsService.trackPageView(`/projects/${slug}`);
  }, [slug]);

  return <div>Project content...</div>;
}
```

### 5. Optimistic Updates

```tsx
import { useToggleProjectLike } from '@/hooks/use-projects';

function LikeButton({ projectId }: { projectId: string }) {
  const { mutate: toggleLike } = useToggleProjectLike();

  return (
    <button onClick={() => toggleLike(projectId)}>
      Like
    </button>
  );
}
```

---

## Advanced Features

### HTTP Client Interceptors

Add custom interceptors for logging, monitoring, etc.:

```tsx
import { httpClient } from '@/lib/http-client';

// Add request interceptor
httpClient.addRequestInterceptor({
  onRequest: (config) => {
    console.log('Request:', config.url);
    return config;
  },
});

// Add response interceptor
httpClient.addResponseInterceptor({
  onResponse: (response) => {
    console.log('Response:', response.status);
    return response;
  },
  onResponseError: async (error) => {
    // Custom error handling
    if (error.status === 429) {
      // Handle rate limiting
    }
  },
});
```

### Query Invalidation

Manually invalidate queries after mutations:

```tsx
import { queryClient, queryKeys } from '@/lib/react-query';

function SomeComponent() {
  const handleAction = async () => {
    await someApiCall();
    
    // Invalidate specific query
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projects.all 
    });
    
    // Refetch immediately
    queryClient.refetchQueries({ 
      queryKey: queryKeys.projects.list() 
    });
  };
}
```

### Caching Strategy

Configure per-query caching:

```tsx
// Long cache for rarely changing data
const { data } = useTags({
  staleTime: 30 * 60 * 1000, // 30 minutes
});

// Short cache for frequently updated data
const { data } = useProjects({
  staleTime: 60 * 1000, // 1 minute
});

// No cache for real-time data
const { data } = useAnalytics({
  staleTime: 0,
});
```

---

## Testing with MSW

### Enable MSW in Development

Add to `.env.local`:

```env
VITE_ENABLE_MSW=true
```

### Add Custom Handlers

```tsx
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/custom-endpoint', () => {
    return HttpResponse.json({ data: 'mock response' });
  }),
];
```

### Component Testing

```tsx
import { render } from '@testing-library/react';
import { QueryProvider } from '@/lib/react-query';
import { ProjectsList } from './ProjectsList';

test('renders projects', async () => {
  const { findByText } = render(
    <QueryProvider>
      <ProjectsList />
    </QueryProvider>
  );

  expect(await findByText('Portfolio Website')).toBeInTheDocument();
});
```

---

## Error Handling

### Global Error Handling

Errors are handled globally in React Query config:

- Authentication errors (401) → Auto logout
- Validation errors (400/422) → Handled in forms
- Server errors (500+) → Toast notification

### Component-Level Error Handling

```tsx
import { ApiError } from '@/lib/http-client';

function Component() {
  const { error, isError } = useProjects();

  if (isError) {
    if (error instanceof ApiError) {
      if (error.isValidationError()) {
        return <ValidationErrors errors={error.data} />;
      }
      if (error.isNotFoundError()) {
        return <NotFound />;
      }
    }
    return <GenericError message={error.message} />;
  }
}
```

---

## Best Practices

### 1. Type Safety

Always use TypeScript types from `@/types/api`:

```tsx
import type { Project, ProjectQueryParams } from '@/types/api';

function useProjectsLogic(params: ProjectQueryParams) {
  const projects: Project[] = [];
  // ...
}
```

### 2. Loading States

Use shadcn Skeleton components:

```tsx
if (isLoading) {
  return <Skeleton className="h-32 w-full" />;
}
```

### 3. Error Boundaries

Wrap components with error boundaries:

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <ProjectsList />
</ErrorBoundary>
```

### 4. Pagination

Use consistent pagination patterns:

```tsx
const [page, setPage] = useState(1);
const { data } = useProjects({ page, limit: 10 });
const pagination = data?.pagination;
```

### 5. Search/Filters

Debounce search inputs:

```tsx
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 500);
const { data } = useProjects({ search: debouncedSearch });
```

---

## Performance Optimization

### 1. Prefetching

Prefetch data on hover:

```tsx
import { queryClient, queryKeys } from '@/lib/react-query';
import { projectsService } from '@/services';

function ProjectCard({ slug }: { slug: string }) {
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(slug),
      queryFn: () => projectsService.getBySlug(slug),
    });
  };

  return <div onMouseEnter={handleMouseEnter}>...</div>;
}
```

### 2. Code Splitting

Lazy load components:

```tsx
const ProjectsList = lazy(() => import('./ProjectsList'));

<Suspense fallback={<Skeleton />}>
  <ProjectsList />
</Suspense>
```

### 3. Request Deduplication

The HTTP client automatically deduplicates identical in-flight requests.

### 4. Background Refetching

Configurebackground refetch behavior:

```tsx
const { data } = useProjects({
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false, // Disable polling
});
```

---

## Next Steps

1. **Integrate with existing components**: Replace mock data with API hooks
2. **Add authentication**: Implement login/register pages
3. **Create admin dashboard**: Use admin hooks for CRUD operations
4. **Add analytics**: Track user behavior with analytics service
5. **Write tests**: Create tests using MSW
6. **Optimize bundle**: Code split services and components

---

## Common Issues

### CORS Errors
- Ensure `CORS_ORIGIN` in backend matches `VITE_API_URL`
- Check that credentials are included in requests

### Type Errors
- Regenerate types if backend schema changes
- Ensure imports use `@/types/api`

### Cache Issues
- Clear React Query cache: `queryClient.clear()`
- Adjust `staleTime` for your use case

### Authentication Issues
- Check token storage in localStorage
- Verify token refresh logic
- Ensure protected routes check `isAuthenticated`

---

For more details, see:
- [React Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [MSW Documentation](https://mswjs.io)
