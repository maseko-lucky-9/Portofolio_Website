import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock recharts — it doesn't render in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock framer-motion to preserve children rendering
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
  };
});

import { SkillsSection } from "../SkillsSection";

describe("SkillsSection", () => {
  it('renders "Skills & Expertise" heading', () => {
    render(<SkillsSection />);
    expect(screen.getByText("Skills & Expertise")).toBeInTheDocument();
  });

  it("renders 3 category buttons (Frontend, Backend, DevOps)", () => {
    render(<SkillsSection />);
    expect(screen.getByText("frontend")).toBeInTheDocument();
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("devops")).toBeInTheDocument();
  });

  it("clicking Backend button changes active category", async () => {
    const user = userEvent.setup();
    render(<SkillsSection />);

    // Initially frontend is active — heading shows "frontend Skills"
    expect(screen.getByText("frontend Skills")).toBeInTheDocument();

    // Click backend button
    await user.click(screen.getByText("backend"));

    // Now the heading should update to "backend Skills"
    await waitFor(() => {
      expect(screen.getByText("backend Skills")).toBeInTheDocument();
    });

    // Backend skills should be visible
    await waitFor(() => {
      expect(screen.getByText("Node.js")).toBeInTheDocument();
    });
  });

  it("renders skill progress bars", () => {
    const { container } = render(<SkillsSection />);
    // Progress bars are divs with class "h-2 bg-muted rounded-full overflow-hidden"
    const progressBars = container.querySelectorAll(".h-2.bg-muted.rounded-full");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("renders the radar chart container", () => {
    render(<SkillsSection />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
