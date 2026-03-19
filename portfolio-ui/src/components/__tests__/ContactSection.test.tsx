import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock the contact hook
vi.mock("@/hooks/use-contact", () => ({
  useContactForm: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock framer-motion to preserve children rendering
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
  };
});

import { ContactSection } from "../ContactSection";

function renderContactSection() {
  return render(
    <ThemeProvider>
      <ContactSection />
    </ThemeProvider>
  );
}

describe("ContactSection", () => {
  it('renders "Get in Touch" heading', () => {
    renderContactSection();
    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
  });

  it("renders name form field", () => {
    renderContactSection();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("renders email form field", () => {
    renderContactSection();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders subject form field", () => {
    renderContactSection();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
  });

  it("renders message form field", () => {
    renderContactSection();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("renders send button", () => {
    renderContactSection();
    expect(screen.getByText("Send Message")).toBeInTheDocument();
  });

  it("shows validation errors when form submitted empty", async () => {
    const user = userEvent.setup();
    renderContactSection();

    // Click submit with empty form
    const submitButton = screen.getByText("Send Message");
    await user.click(submitButton);

    // Zod validation errors should appear
    await waitFor(() => {
      expect(screen.getByText("Name must be at least 2 characters")).toBeInTheDocument();
    });
    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Subject must be at least 5 characters")).toBeInTheDocument();
    expect(screen.getByText("Message must be at least 20 characters")).toBeInTheDocument();
  });
});
