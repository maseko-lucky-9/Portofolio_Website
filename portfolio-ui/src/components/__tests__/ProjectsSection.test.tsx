import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { projects as staticProjects } from "@/data/projects";

// Mock the projects hook to return no API data (uses static fallback)
vi.mock("@/hooks/use-projects", () => ({
  useFeaturedProjects: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

// Mock env to disable API
vi.mock("@/config/env", () => ({
  env: {
    apiUrl: "http://localhost:3000",
    apiVersion: "v1",
    wsUrl: "ws://localhost:3000",
    appName: "Portfolio",
    appDescription: "Test",
    useApi: false,
    enableMsw: false,
    enableAnalytics: false,
    enableCodeExecution: false,
    enableComments: false,
    debug: false,
    mode: "test",
    isDev: false,
    isProd: false,
  },
  apiUrl: (path: string) => `http://localhost:3000/v1${path}`,
  wsUrl: (path: string) => `ws://localhost:3000${path}`,
  default: { useApi: false, enableMsw: false },
}));

// Mock framer-motion to preserve children rendering
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
  };
});

import { ProjectsSection } from "../ProjectsSection";

describe("ProjectsSection", () => {
  it('renders "Featured Projects" heading', () => {
    render(<ProjectsSection />);
    expect(screen.getByText("Featured Projects")).toBeInTheDocument();
  });

  it("renders project cards from static data", () => {
    render(<ProjectsSection />);
    staticProjects.forEach((project) => {
      expect(screen.getByText(project.title)).toBeInTheDocument();
    });
  });

  it("renders the 'All' technology filter button", () => {
    render(<ProjectsSection />);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("renders technology filter buttons", () => {
    render(<ProjectsSection />);
    // Filter buttons use "tech-badge" class without "text-xs" (project card badges have "text-xs")
    // Check that filter buttons exist by looking for unique technologies like "AWS", "Docker"
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });

  it("clicking a technology filter shows filtered projects", async () => {
    const user = userEvent.setup();
    render(<ProjectsSection />);

    // "GraphQL" is only in Analytics Dashboard among the static projects
    const filterButton = screen.getByRole("button", { name: "GraphQL" });
    await user.click(filterButton);

    // Analytics Dashboard should still be visible (it has GraphQL)
    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();

    // E-Commerce Platform should not be visible (it doesn't have GraphQL)
    // Wait for AnimatePresence exit animation to complete
    await waitFor(() => {
      expect(screen.queryByText("E-Commerce Platform")).not.toBeInTheDocument();
    });
  });
});
