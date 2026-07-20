import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Body: Inter Variable. Single grotesque across the interface.
        sans: [
          'Inter Variable',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // Display is the same face as body — hierarchy comes from weight and
        // size, not a contrasting serif. The key is retained so the existing
        // `font-display` consumers keep resolving.
        display: [
          'Inter Variable',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // Mono: JetBrains Mono — narrow technical use only (tables,
        // code blocks, tabular numerics). NOT a default body face.
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // OKLCH consumers — tokens are bare-component in :root.
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive))",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar-background))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          from: { transform: "scale(0.94)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        // --primary is an OKLCH triple; hsl() here produced an invalid color.
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 1px oklch(var(--primary) / 0.15), 0 4px 16px oklch(var(--primary) / 0.25)" },
          "50%": { boxShadow: "0 0 0 1px oklch(var(--primary) / 0.30), 0 8px 32px oklch(var(--primary) / 0.50)" },
        },
        "shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(20px, -25px) scale(1.05)" },
          "66%": { transform: "translate(-15px, 12px) scale(0.95)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.45s cubic-bezier(0,0,0.2,1) forwards",
        "fade-out": "fade-out 0.25s ease-in",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "float": "float 7s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "blob-drift": "blob-drift 12s ease-in-out infinite",
        "reveal-up": "reveal-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;
