import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock the contact hook
const { mutateSpy } = vi.hoisted(() => ({ mutateSpy: vi.fn() }));

vi.mock("@/hooks/use-contact", () => ({
  useContactForm: () => ({
    mutate: mutateSpy,
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
    </ThemeProvider>,
  );
}

describe("ContactSection", () => {
  it("renders contact heading", () => {
    renderContactSection();
    expect(screen.getByText("Say hi")).toBeInTheDocument();
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

  // Regression guard: the Cloudflare production deploy has no backend, so this
  // form used to POST to a static host, take a bare 405, and silently discard
  // the message. VITE_USE_API is unset under test, so env.useApi === false and
  // this is the branch a real production visitor hits.
  it("hands off to a mailto: draft instead of POSTing when no API is configured", async () => {
    const user = userEvent.setup();
    const originalLocation = window.location;
    const stub = { href: "" };
    Object.defineProperty(window, "location", { value: stub, writable: true });

    try {
      renderContactSection();

      await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
      await user.type(screen.getByLabelText("Email"), "ada@example.com");
      await user.type(screen.getByLabelText("Subject"), "Contract role");
      await user.type(
        screen.getByLabelText("Message"),
        "I would like to discuss a contract role with your team.",
      );
      await user.click(screen.getByText("Send Message"));

      // Recipient is asserted as a HARDCODED literal, deliberately not
      // personalData.email: src/data/personal.ts is hand-edited template data
      // ("// EDIT: Your email"), and a stale/wrong address there would send
      // every production lead's draft to the wrong mailbox while a
      // data-derived assertion stayed green — the exact silent-lead-loss this
      // fix exists to prevent, one file over.
      await waitFor(() => expect(stub.href.startsWith("mailto:ltmaseko7@gmail.com?")).toBe(true));
      // Anchor the param NAMES too: bare toContain() would still pass if
      // subject= and body= were swapped (the body embeds the sender email).
      expect(stub.href).toContain(`subject=${encodeURIComponent("Contract role")}`);
      expect(stub.href).toContain("&body=");
      expect(stub.href).toContain(encodeURIComponent("ada@example.com"));
      // the lead must never be handed to a backend that does not exist
      expect(mutateSpy).not.toHaveBeenCalled();
      expect(screen.getByText("Your email is ready")).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    }
  });
});
