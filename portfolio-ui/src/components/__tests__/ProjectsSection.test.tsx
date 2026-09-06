import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProjectsSection } from "@/components/ProjectsSection";
import { projects } from "@/data/projects";

// The section reads through TanStack Query; with VITE_USE_API=false (the
// production shape) it falls straight through to the static data.
vi.mock("@/hooks/use-projects", () => ({
  useFeaturedProjects: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("ProjectsSection", () => {
  it("renders the two-tone heading", () => {
    render(<ProjectsSection />);
    expect(screen.getByRole("heading", { level: 2, name: /Four repositories/ })).toHaveAttribute(
      "id",
      "work-heading",
    );
  });

  it("renders one showcase panel per project", () => {
    const { container } = render(<ProjectsSection />);
    expect(container.querySelectorAll(".show-split")).toHaveLength(projects.length);
  });

  // projects.ts exists because invented metrics and 404ing URLs shipped once.
  // Every card must carry the real URL and the real impact line.
  it("links each project to its resolving repository and states its impact", () => {
    render(<ProjectsSection />);
    for (const p of projects) {
      const heading = screen.getByRole("heading", { level: 3, name: p.title });
      const card = heading.closest("article") as HTMLElement;
      expect(card).toBeTruthy();
      const link = card.querySelector('a[href^="https://github.com/"]');
      expect(link).toHaveAttribute("href", p.githubUrl);
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(card.textContent).toContain(p.impact);
    }
  });

  it("has no technology filter", () => {
    const { container } = render(<ProjectsSection />);
    expect(container.querySelector(".tech-badge")).toBeNull();
    expect(screen.queryByRole("button", { name: /^All$/ })).toBeNull();
  });
});
