import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock @react-three/fiber — Canvas and hooks can't run in jsdom
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({ size: { width: 800, height: 600 } }),
}));

// Mock three.js
vi.mock("three", () => ({
  Vector2: class Vector2 {
    x = 0;
    y = 0;
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  },
  ShaderMaterial: class ShaderMaterial {},
  Mesh: class Mesh {},
}));

let mockUseReducedMotion = false;

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => mockUseReducedMotion,
  };
});

import { AuroraBackground } from "../AuroraBackground";

function renderAuroraBackground() {
  return render(
    <ThemeProvider>
      <AuroraBackground />
    </ThemeProvider>
  );
}

describe("AuroraBackground", () => {
  it("mounts without errors when Canvas is mocked", () => {
    mockUseReducedMotion = false;
    const { container } = renderAuroraBackground();
    expect(container).toBeTruthy();
  });

  it("renders the Canvas component when motion is not reduced", () => {
    mockUseReducedMotion = false;
    const { getByTestId } = renderAuroraBackground();
    expect(getByTestId("r3f-canvas")).toBeInTheDocument();
  });

  it("renders CSS gradient fallback when reduced motion is preferred", () => {
    mockUseReducedMotion = true;
    const { container } = renderAuroraBackground();

    // When reduced motion is preferred, it should NOT render the Canvas
    const canvas = container.querySelector('[data-testid="r3f-canvas"]');
    expect(canvas).toBeNull();

    // It should render the gradient fallback divs (blur-3xl class)
    const gradientDivs = container.querySelectorAll(".blur-3xl");
    expect(gradientDivs.length).toBeGreaterThan(0);
  });
});
