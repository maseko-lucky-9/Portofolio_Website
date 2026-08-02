# Data Fetching Guide - TypeScript React with React Query

> Complete guide for implementing type-safe data fetching in your portfolio application

## Table of Contents

1. [React Hooks with Type Generics](#react-hooks-with-type-generics)
2. [shadcn-ui Integration](#shadcn-ui-integration)
3. [Vite Dev Experience](#vite-dev-experience)
4. [Performance Optimizations](#performance-optimizations)
5. [State Management](#state-management)
6. [SSR Alternatives](#ssr-alternatives)
7. [Advanced Patterns](#advanced-patterns)

---

## React Hooks with Type Generics

### 1. Custom Hooks with Typed Responses

Our hooks already provide full type safety. Here's how to use them:

#### Basic Query Hook

```tsx
import { useProjects } from '@/hooks/use-projects';
import type { Project } from '@/types/api';

function ProjectsPage() {
  // ✅ Fully typed - data is Project[] | undefined
  const { data, isLoading, error } = useProjects({
    status: 'PUBLISHED',
    limit: 10
  });

  // TypeScript knows the shape of data
  const projects: Project[] = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
}
```

#### Advanced Hook with Type Inference

```tsx
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/services';
import { queryKeys } from '@/lib/query-keys';

// ✅ Generic hook with type inference
function useTypedProjects<T = Project[]>(
  params?: ProjectQueryParams,
  select?: (data: PaginatedResponse<Project>) => T
) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => projectsService.getProjects(params),
    select, // Transform data with type safety
  });
}

// Usage with transformation
function Component() {
  const { data: projectTitles } = useTypedProjects(
    { status: 'PUBLISHED' },
    (response) => response.data.map(p => p.title) // string[]
  );
}
```

### 2. Loading/Error State Management

#### Pattern 1: Early Returns (Recommended for Simple Components)

```tsx
function ProjectsList() {
  const { data, isLoading, error } = useProjects();

  // ✅ Handle loading state first
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ✅ Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof ApiError 
            ? error.message 
            : 'Failed to load projects'}
        </AlertDescription>
      </Alert>
    );
  }

  // ✅ TypeScript knows data is defined here
  const projects = data!.data;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

#### Pattern 2: State-Based Rendering (Better for Complex UIs)

```tsx
function ProjectsWithFilters() {
  const [filters, setFilters] = useState({ status: 'PUBLISHED' as const });
  const { data, isLoading, error, refetch } = useProjects(filters);

  const renderContent = () => {
    if (isLoading) return <ProjectsSkeleton />;
    if (error) return <ProjectsError error={error} onRetry={refetch} />;
    if (!data?.data.length) return <EmptyState />;
    return <ProjectsGrid projects={data.data} />;
  };

  return (
    <div>
      <ProjectFilters filters={filters} onChange={setFilters} />
      {renderContent()}
    </div>
  );
}
```

#### Pattern 3: Suspense (Future-Proof)

```tsx
import { Suspense } from 'react';

// Enable suspense in React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true, // ⚠️ Experimental in React 18
    },
  },
});

function ProjectsWithSuspense() {
  const { data } = useProjects(); // No need to check isLoading

  // data is always defined inside Suspense boundary
  return (
    <div>
      {data.data.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// Wrap with Suspense boundary
function Page() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsWithSuspense />
    </Suspense>
  );
}
```

### 3. Refetching Patterns

#### Manual Refetch

```tsx
function ProjectsWithRefresh() {
  const { data, refetch, isFetching } = useProjects();

  return (
    <div>
      <Button 
        onClick={() => refetch()} 
        disabled={isFetching}
      >
        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        Refresh
      </Button>
      <ProjectsList projects={data?.data ?? []} />
    </div>
  );
}
```

#### Automatic Refetch on Focus/Reconnect

```tsx
function ProjectsAutoRefresh() {
  const { data } = useProjects(
    { status: 'PUBLISHED' },
    {
      refetchOnWindowFocus: true,  // Refetch when tab becomes visible
      refetchOnReconnect: true,    // Refetch on network reconnect
      refetchInterval: 30000,      // Poll every 30s
    }
  );
}
```

#### Refetch After Mutation

```tsx
function ProjectEditor() {
  const queryClient = useQueryClient();
  const { mutate } = useUpdateProject({
    onSuccess: (updatedProject) => {
      // ✅ Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(updatedProject.slug)
      });
      
      // ✅ Or update cache directly (optimistic)
      queryClient.setQueryData(
        queryKeys.projects.detail(updatedProject.slug),
        updatedProject
      );
    },
  });
}
```

### 4. Dependency Array Considerations

#### ✅ Correct: Stable Query Keys

```tsx
function ProjectDetail({ slug }: { slug: string }) {
  // Query key changes when slug changes → automatic refetch
  const { data } = useProject(slug);
  
  return <div>{data?.title}</div>;
}
```

#### ✅ Correct: Memoized Parameters

```tsx
function ProjectsFiltered() {
  // ✅ Memoize filter object to prevent unnecessary refetches
  const filters = useMemo(() => ({
    status: 'PUBLISHED' as const,
    tags: ['react', 'typescript'],
  }), []); // Only recreate if dependencies change

  const { data } = useProjects(filters);
}
```

#### ❌ Incorrect: New Object Each Render

```tsx
function ProjectsFiltered() {
  // ❌ New object every render → infinite refetch loop
  const { data } = useProjects({
    status: 'PUBLISHED',
    tags: ['react'],
  });
}
```

#### ✅ Better: Use URL State

```tsx
import { useSearchParams } from 'react-router-dom';

function ProjectsWithUrlFilters() {
  const [searchParams] = useSearchParams();
  
  // ✅ Params change with URL → stable until URL changes
  const filters = useMemo(() => ({
    status: searchParams.get('status') as ProjectStatus | undefined,
    tags: searchParams.getAll('tag'),
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  const { data } = useProjects(filters);
}
```

---

## shadcn-ui Integration

### 1. Skeleton Components for Loading States

#### Reusable Skeleton Components

```tsx
// components/skeletons/ProjectCardSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

#### Usage with React Query

```tsx
function ProjectsPage() {
  const { data, isLoading } = useProjects();

  if (isLoading) return <ProjectsGridSkeleton />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data?.data.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### 2. Alert Components for Error Display

#### Reusable Error Alert

```tsx
// components/ErrorAlert.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/http-client';

interface ErrorAlertProps {
  error: Error | ApiError;
  onRetry?: () => void;
  title?: string;
}

export function ErrorAlert({ error, onRetry, title = 'Error' }: ErrorAlertProps) {
  const message = error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.';

  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {title}
        {statusCode && (
          <span className="text-xs font-mono">{statusCode}</span>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

#### Usage

```tsx
function ProjectsPage() {
  const { data, isLoading, error, refetch } = useProjects();

  if (error) {
    return <ErrorAlert error={error} onRetry={refetch} title="Failed to load projects" />;
  }

  // ... rest of component
}
```

### 3. Form Components with API Submission

#### Contact Form with Full Integration

```tsx
// components/forms/ContactForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContactForm } from '@/hooks/use-contact';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// ✅ Type-safe validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { toast } = useToast();
  const { mutate, isPending } = useContactForm();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Message sent!',
          description: "We'll get back to you soon.",
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Failed to send message',
          description: error.message,
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Project inquiry" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your project..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We typically respond within 24 hours
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </Form>
  );
}
```

### 4. Toast Notifications for Actions

#### Success/Error Toasts with Mutations

```tsx
import { useToast } from '@/hooks/use-toast';
import { useUpdateProject, useDeleteProject } from '@/hooks/use-projects';

function ProjectActions({ project }: { project: Project }) {
  const { toast } = useToast();

  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject({
    onSuccess: (updated) => {
      toast({
        title: '✅ Project updated',
        description: `${updated.title} has been updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '❌ Update failed',
        description: error.message,
      });
    },
  });

  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject({
    onSuccess: () => {
      toast({
        title: '🗑️ Project deleted',
        description: 'Project has been permanently deleted',
      });
    },
  });

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => updateProject({ 
          id: project.id, 
          status: 'ARCHIVED' 
        })}
        disabled={isUpdating}
      >
        Archive
      </Button>
      
      <Button
        variant="destructive"
        onClick={() => deleteProject(project.id)}
        disabled={isDeleting}
      >
        Delete
      </Button>
    </div>
  );
}
```

#### Loading Toast with Progress

```tsx
function LongRunningAction() {
  const { toast } = useToast();
  const { mutate } = useSomeAction();

  const handleAction = () => {
    const { dismiss } = toast({
      title: 'Processing...',
      description: 'This may take a moment',
      duration: Infinity, // Don't auto-dismiss
    });

    mutate(data, {
      onSettled: () => dismiss(),
      onSuccess: () => {
        toast({
          title: 'Complete!',
          description: 'Action completed successfully',
        });
      },
    });
  };

  return <Button onClick={handleAction}>Start</Button>;
}
```

---

## Vite Dev Experience

### 1. Hot Module Replacement with API Data

Vite's HMR preserves React Query cache during development:

```tsx
// ✅ Cache persists across HMR updates
function ProjectsPage() {
  const { data } = useProjects();
  
  // Edit this component → HMR → data stays cached!
  return <div>{data?.data.map(p => <div>{p.title}</div>)}</div>;
}
```

#### Preserve Query Client Across HMR

```tsx
// src/lib/react-query.tsx
import { QueryClient } from '@tanstack/react-query';

// ✅ Create client outside component to survive HMR
let queryClient: QueryClient;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          retry: 1,
        },
      },
    });
  }
  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

### 2. Development Proxies for API Calls

Already configured in `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
      },
    },
  },
});
```

#### Using Relative URLs in Development

```tsx
// ✅ Works with proxy
const response = await fetch('/api/projects');

// ✅ Or use full URL (configured in env.ts)
const response = await httpClient.get('/projects');
```

### 3. TypeScript Intellisense for API Responses

#### Enable Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Type Imports Everywhere

```tsx
// ✅ Import types for intellisense
import type { 
  Project, 
  Article, 
  ProjectQueryParams 
} from '@/types/api';

function ProjectsPage() {
  // ✅ Full intellisense on params
  const filters: ProjectQueryParams = {
    status: 'PUBLISHED', // ✅ Autocomplete
    tags: [],
    search: '',
    page: 1,
    limit: 10,
  };

  const { data } = useProjects(filters);
  
  // ✅ Full intellisense on data
  data?.data.forEach(project => {
    project. // ✅ Shows: id, title, slug, description, etc.
  });
}
```

#### VSCode Settings for Better DX

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Performance Optimizations

### 1. Request Deduplication

Already implemented in `http-client.ts`. Multiple simultaneous identical requests are deduplicated:

```tsx
function ComponentA() {
  useProjects(); // Makes request
}

function ComponentB() {
  useProjects(); // Reuses ComponentA's request
}

// Only ONE network request is made!
```

### 2. Request Cancellation

#### Automatic Cancellation with React Query

```tsx
function SearchProjects() {
  const [search, setSearch] = useState('');

  // ✅ Previous request is cancelled when search changes
  const { data } = useProjects({ search });

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

#### Manual Cancellation

```tsx
function ComponentWithManualFetch() {
  useEffect(() => {
    const controller = new AbortController();

    httpClient.get('/projects', {
      signal: controller.signal,
    }).then(data => {
      // Handle data
    }).catch(error => {
      if (error.name === 'AbortError') {
        // Request was cancelled
      }
    });

    return () => controller.abort(); // Cancel on unmount
  }, []);
}
```

### 3. Pagination Implementation

#### Offset-Based Pagination

```tsx
function ProjectsPaginated() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useProjects({
    page,
    limit,
  });

  const totalPages = data ? Math.ceil(data.pagination.total / limit) : 0;

  return (
    <div>
      <ProjectsList projects={data?.data ?? []} />
      
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

#### Infinite Scroll with useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function ProjectsInfinite() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      projectsService.getProjects({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage, pages) => {
      const total = lastPage.pagination.total;
      const loaded = pages.length * 10;
      return loaded < total ? pages.length + 1 : undefined;
    },
  });

  // Auto-fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const projects = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Intersection observer sentinel */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage ? (
          <Spinner />
        ) : hasNextPage ? (
          <p className="text-sm text-muted-foreground">
            Scroll for more
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No more projects
          </p>
        )}
      </div>
    </div>
  );
}
```

### 4. Virtual Scrolling (Large Lists)

For lists with 1000+ items, use `@tanstack/react-virtual`:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualizedProjects() {
  const { data } = useProjects({ limit: 1000 }); // Large dataset
  const projects = data?.data ?? [];

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5, // Render 5 extra items above/below
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const project = projects[virtualItem.index];
          return (
            <div
              key={project.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ProjectCard project={project} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## State Management

### 1. Local Component State vs Global State

#### ✅ Local State (Recommended for Most Cases)

```tsx
function ProjectsPage() {
  // ✅ UI state stays local
  const [filters, setFilters] = useState({
    search: '',
    status: 'PUBLISHED' as const,
  });

  // ✅ Server state managed by React Query (global)
  const { data } = useProjects(filters);

  return (
    <div>
      <Input
        value={filters.search}
        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
      />
      <ProjectsList projects={data?.data ?? []} />
    </div>
  );
}
```

#### When to Use Global State

- User authentication state (already in React Query cache)
- Theme preferences
- UI state shared across many components
- Non-server state that needs persistence

### 2. React Context for API State Sharing

#### Auth Context Example

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  const value = {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

Usage:

```tsx
// main.tsx
<QueryProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</QueryProvider>

// Any component
function Header() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header>
      {isAuthenticated ? (
        <span>Welcome, {user?.name}</span>
      ) : (
        <Button>Login</Button>
      )}
    </header>
  );
}
```

### 3. Zustand for Client State (Optional)

For complex client state not related to server data:

```bash
npm install zustand
```

```tsx
// stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  recentSearches: string[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addRecentSearch: (search: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      recentSearches: [],
      
      toggleSidebar: () =>
        set(state => ({ sidebarOpen: !state.sidebarOpen })),
      
      setTheme: (theme) =>
        set({ theme }),
      
      addRecentSearch: (search) =>
        set(state => ({
          recentSearches: [
            search,
            ...state.recentSearches.filter(s => s !== search)
          ].slice(0, 5),
        })),
    }),
    {
      name: 'ui-storage', // LocalStorage key
    }
  )
);
```

Usage:

```tsx
function SearchBar() {
  const { recentSearches, addRecentSearch } = useUIStore();
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    addRecentSearch(search);
    // Perform search...
  };

  return (
    <div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      
      {recentSearches.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">Recent:</p>
          {recentSearches.map(recent => (
            <Button
              key={recent}
              variant="ghost"
              size="sm"
              onClick={() => setSearch(recent)}
            >
              {recent}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. URL State Management for Filters

Best practice for shareable, bookmarkable filters:

```tsx
import { useSearchParams } from 'react-router-dom';

function ProjectsWithURLFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Filters from URL
  const filters = useMemo(() => ({
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') as ProjectStatus | undefined,
    tags: searchParams.getAll('tag'),
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  const { data } = useProjects(filters);

  // ✅ Update URL when filters change
  const updateFilters = (updates: Partial<typeof filters>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.delete(key);
        value.forEach(v => newParams.append(key, v));
      } else {
        newParams.set(key, String(value));
      }
    });
    
    setSearchParams(newParams);
  };

  return (
    <div>
      <Input
        value={filters.search}
        onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
      />
      <ProjectsList projects={data?.data ?? []} />
    </div>
  );
}

// URL: /projects?search=react&status=PUBLISHED&tag=typescript&page=2
```

---

## SSR Alternatives

Since you're using Vite (not Next.js), here are alternative strategies:

### 1. Static Generation for Portfolio Data

#### Build-Time Data Fetching

```tsx
// scripts/prebuild.ts
import { projectsService } from './src/services';
import fs from 'fs/promises';

async function generateStaticData() {
  const projects = await projectsService.getProjects({ 
    status: 'PUBLISHED' 
  });
  
  await fs.writeFile(
    'src/data/static-projects.json',
    JSON.stringify(projects, null, 2)
  );
}

generateStaticData();
```

```json
// package.json
{
  "scripts": {
    "prebuild": "tsx scripts/prebuild.ts",
    "build": "npm run prebuild && vite build"
  }
}
```

Usage:

```tsx
import staticProjects from '@/data/static-projects.json';

function ProjectsPage() {
  // Use static data immediately, then update with live data
  const { data } = useProjects({
    initialData: staticProjects,
  });

  return <ProjectsList projects={data.data} />;
}
```

### 2. Client-Side Hydration

#### Prefetch on Page Load

```tsx
// App.tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services';
import { queryKeys } from '@/lib/query-keys';

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ✅ Prefetch critical data on app load
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.featured(),
      queryFn: () => projectsService.getFeatured(),
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.featured(),
      queryFn: () => articlesService.getFeatured(),
    });
  }, [queryClient]);

  return <Router />;
}
```

### 3. Revalidation Strategies

#### Stale-While-Revalidate Pattern

```tsx
function ProjectsPage() {
  const { data } = useProjects(
    { status: 'PUBLISHED' },
    {
      staleTime: 1000 * 60 * 5,        // Consider fresh for 5 mins
      cacheTime: 1000 * 60 * 30,       // Keep in cache for 30 mins
      refetchOnMount: 'always',        // Always refetch on mount
      refetchOnWindowFocus: true,      // Refetch when window gains focus
    }
  );

  // Data shows immediately from cache, updates in background
  return <ProjectsList projects={data?.data ?? []} />;
}
```

#### Time-Based Revalidation

```tsx
function NewsSection() {
  const { data } = useArticles(
    { limit: 5 },
    {
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
      refetchIntervalInBackground: true, // Even when tab is not visible
    }
  );
}
```

---

## Advanced Patterns

### 1. Optimistic Updates

```tsx
function ToggleLikeButton({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const { mutate } = useToggleProjectLike({
    onMutate: async (projectId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.detail(project.slug)
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData(
        queryKeys.projects.detail(project.slug)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.projects.detail(project.slug),
        (old: Project | undefined) => old ? {
          ...old,
          likesCount: old.likesCount + 1,
        } : undefined
      );

      return { previous };
    },
    onError: (err, projectId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.projects.detail(project.slug),
          context.previous
        );
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(project.slug)
      });
    },
  });

  return (
    <Button onClick={() => mutate(project.id)}>
      ❤️ {project.likesCount}
    </Button>
  );
}
```

### 2. Parallel Queries

```tsx
function DashboardPage() {
  // ✅ All queries run in parallel
  const projects = useProjects({ limit: 5 });
  const articles = useArticles({ limit: 5 });
  const stats = useAnalytics({ period: '30d' });

  const isLoading = projects.isLoading || articles.isLoading || stats.isLoading;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="grid gap-6">
      <StatsCards data={stats.data} />
      <RecentProjects projects={projects.data?.data} />
      <RecentArticles articles={articles.data?.data} />
    </div>
  );
}
```

### 3. Dependent Queries

```tsx
function ProjectDetailsPage({ slug }: { slug: string }) {
  // First query
  const { data: project } = useProject(slug);

  // Second query depends on first
  const { data: relatedProjects } = useProjects(
    {
      tags: project?.tags.map(t => t.name),
      exclude: project?.id,
    },
    {
      enabled: !!project, // Only run when project is loaded
    }
  );

  return (
    <div>
      <ProjectDetails project={project} />
      {relatedProjects && (
        <RelatedProjects projects={relatedProjects.data} />
      )}
    </div>
  );
}
```

### 4. Polling with Smart Intervals

```tsx
function LiveStatsPage() {
  const [interval, setInterval] = useState(5000);

  const { data } = useQuery({
    queryKey: ['stats', 'live'],
    queryFn: () => analyticsService.getLiveStats(),
    refetchInterval: interval,
    refetchIntervalInBackground: true,
  });

  // Slow down polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setInterval(document.hidden ? 30000 : 5000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <StatsDisplay data={data} />;
}
```

### 5. Error Boundaries for Data Fetching

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ProjectsErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <Alert variant="destructive">
          <AlertTitle>Failed to load projects</AlertTitle>
          <AlertDescription>
            {error.message}
            <Button onClick={resetErrorBoundary} className="mt-2">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    >
      <ProjectsPage />
    </ErrorBoundary>
  );
}
```

---

## Best Practices Summary

### TypeScript Strictness ✅

1. **Enable strict mode** in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Never use `any`** - use `unknown` and type guards:
   ```tsx
   // ❌ Bad
   const data: any = await fetch();

   // ✅ Good
   const data: unknown = await fetch();
   if (isProject(data)) {
     // TypeScript knows data is Project here
   }
   ```

3. **Use type guards**:
   ```tsx
   function isApiError(error: unknown): error is ApiError {
     return error instanceof ApiError;
   }
   ```

### Performance ⚡

1. **Memoize expensive computations**:
   ```tsx
   const sortedProjects = useMemo(
     () => projects.sort((a, b) => b.likesCount - a.likesCount),
     [projects]
   );
   ```

2. **Debounce search inputs**:
   ```tsx
   const debouncedSearch = useDebounce(search, 300);
   const { data } = useProjects({ search: debouncedSearch });
   ```

3. **Use pagination** for large datasets
4. **Implement virtual scrolling** for 1000+ items
5. **Prefetch on hover** for better perceived performance:
   ```tsx
   const queryClient = useQueryClient();
   
   <Link
     to={`/projects/${project.slug}`}
     onMouseEnter={() => {
       queryClient.prefetchQuery({
         queryKey: queryKeys.projects.detail(project.slug),
         queryFn: () => projectsService.getBySlug(project.slug),
       });
     }}
   >
   ```

### Developer Experience 🛠️

1. **Use React Query DevTools** in development
2. **Log API errors** to console in development
3. **Use MSW** for consistent development experience
4. **Keep query keys consistent** using factory functions
5. **Document component props** with JSDoc

### Production Readiness 🚀

1. **Handle all error states**
2. **Show loading states** for better UX
3. **Implement retry logic** for failed requests
4. **Add request timeouts**
5. **Monitor performance** with React Query metrics
6. **Cache strategically** based on data volatility
7. **Clean up subscriptions** on unmount

---

## Next Steps

1. ✅ **Integrate QueryProvider** in your app
2. ✅ **Replace mock data** with API hooks
3. ✅ **Add authentication pages**
4. ✅ **Build admin dashboard**
5. ✅ **Write tests** with MSW
6. ✅ **Optimize bundle** with code splitting
7. ✅ **Monitor performance** in production

---

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn-ui Components](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Guide](https://vitejs.dev/guide/)
- [MSW Documentation](https://mswjs.io)

---

**Need help?** Check the existing example components in `src/components/examples/` for reference implementations.
