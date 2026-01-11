/**
 * Example: Projects List Component
 * 
 * Demonstrates integration of API hooks with shadcn-ui components
 */

import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, Heart, ExternalLink, Github } from 'lucide-react';

export function ProjectsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Use the projects hook with pagination and search
  const { data, isLoading, error, isError } = useProjects({
    page,
    limit: 9,
    search: search || undefined,
    status: ProjectStatus.PUBLISHED,
  });

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state with alert
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load projects'}
        </AlertDescription>
      </Alert>
    );
  }

  const projects = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Alert>
          <AlertDescription>No projects found.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              {/* Thumbnail */}
              {project.thumbnail && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="object-cover w-full h-full hover:scale-105 transition-transform"
                  />
                </div>
              )}

              <CardHeader>
                <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                {project.subtitle && (
                  <CardDescription className="line-clamp-2">
                    {project.subtitle}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.excerpt || project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                  {project.techStack.length > 4 && (
                    <Badge variant="secondary">+{project.techStack.length - 4}</Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {project.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {project.likes}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button variant="default" className="flex-1" asChild>
                  <a href={`/projects/${project.slug}`}>
                    View Project
                  </a>
                </Button>
                {project.githubUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {project.liveUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
