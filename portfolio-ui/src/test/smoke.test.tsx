import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the HTTP client to prevent real network requests during tests
vi.mock("@/lib/http-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
  httpClient: {
    get: vi.fn().mockRejectedValue(new Error("No API in test")),
    post: vi.fn().mockRejectedValue(new Error("No API in test")),
    put: vi.fn().mockRejectedValue(new Error("No API in test")),
    patch: vi.fn().mockRejectedValue(new Error("No API in test")),
    delete: vi.fn().mockRejectedValue(new Error("No API in test")),
  },
}));

// Mock env to disable API calls
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
  default: {
    useApi: false,
    enableMsw: false,
  },
}));

import App from "../App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("renders at least one heading on the page", () => {
    render(<App />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});
