import { personalData } from "@/data/personal";
import { scrollToSection } from "@/lib/scroll-to-section";

const sectionLinks = [
  { href: "#operator", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
];

// Cross-route links to statically-generated content surfaces. These are
// separate prerendered pages (not in-page anchors) so they need real
// <a href> elements with full reloads.
const contentLinks = [
  { href: "/blog", label: "Writing" },
  { href: "/answers", label: "Answers" },
  { href: "/projects", label: "Case studies" },
  { href: "/rss.xml", label: "RSS" },
];

function Mark() {
  return (
    <span className="f-chip">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="oklch(var(--signal))" opacity=".5" />
        <path
          d="M6 15.5 18 7.5"
          stroke="oklch(var(--signal))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="wrap">
        <div className="f-grid" style={{ display: "grid", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mark />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--t-2xl)",
                  fontWeight: 500,
                  color: "var(--ink-100)",
                  letterSpacing: "var(--track-tight)",
                }}
              >
                {personalData.name}
              </span>
            </div>
            <p className="small" style={{ color: "var(--ink-60)", maxWidth: "34ch" }}>
              {personalData.title}
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <p style={{ fontSize: "var(--t-sm)", fontWeight: 500, color: "var(--ink-100)" }}>
              Sections
            </p>
            {sectionLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(href);
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: "var(--t-sm)", fontWeight: 500, color: "var(--ink-100)" }}>
              Elsewhere
            </p>
            <a href={personalData.social.github} aria-label="GitHub">
              GitHub
            </a>
            <a href={personalData.social.linkedin} aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href={`mailto:${personalData.email}`} aria-label="Email">
              Email
            </a>
          </div>

          <nav
            aria-label="Content navigation"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <p style={{ fontSize: "var(--t-sm)", fontWeight: 500, color: "var(--ink-100)" }}>
              Writing
            </p>
            {contentLinks.map(({ href, label }) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: "1px solid var(--border-section)",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="mono tiny">
            &copy; {currentYear} {personalData.name}
          </span>
          <span className="mono tiny">{personalData.location}</span>
        </div>
      </div>
    </footer>
  );
}
