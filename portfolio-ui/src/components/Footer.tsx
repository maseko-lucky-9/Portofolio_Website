import { Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";
import { Logo } from "@/components/ui/Logo";
import { scrollToSection as scrollTo } from "@/lib/scroll-to-section";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#skills", label: "Skills" },
    { href: "#projects", label: "Projects" },
    { href: "#experience", label: "Experience" },
    { href: "#blog", label: "Blog" },
    { href: "#contact", label: "Contact" },
  ];

  // Cross-route links to statically-generated content surfaces. These are
  // separate prerendered pages (not in-page anchors) so they need real
  // <a href> elements with full reloads.
  const contentLinks = [
    { href: "/blog", label: "Writing" },
    { href: "/answers", label: "Answers" },
    { href: "/projects", label: "Case studies" },
    { href: "/rss.xml", label: "RSS", external: true },
  ];

  const scrollToSection = (href: string) => {
    scrollTo(href);
  };

  return (
    <footer className="relative" style={{ background: "oklch(var(--card) / 0.5)" }}>
      {/* Top gradient divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.3), oklch(var(--secondary) / 0.3), transparent)",
        }}
      />

      {/* Extra bottom gutter on mobile so the fixed chat launcher (56px + 24px
          inset + safe-area) doesn't land on the copyright line. */}
      <div className="section-container !py-14 !pb-32 md:!pb-14">
        <div className="grid md:grid-cols-3 gap-8 items-center mb-10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-block mb-2 transition-opacity hover:opacity-80"
            >
              <Logo size="lg" />
            </a>
            <p className="text-sm text-muted-foreground">{personalData.title}</p>
          </div>

          {/* Nav links */}
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
            aria-label="Footer navigation"
          >
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="inline-flex items-center py-3 md:py-0 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex justify-center md:justify-end gap-2.5">
            {[
              { href: personalData.social.github, Icon: Github, label: "GitHub" },
              { href: personalData.social.linkedin, Icon: Linkedin, label: "LinkedIn" },
              { href: personalData.social.twitter, Icon: Twitter, label: "Twitter" },
            ]
              // Skip unset links — href="" resolves to the current page.
              .filter(({ href }) => href)
              .map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-link w-11 h-11 md:w-9 md:h-9"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
          </div>
        </div>

        {/* Cross-route content links — separately prerendered pages. */}
        <nav
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6"
          aria-label="Content navigation"
        >
          {contentLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...(link.external ? { rel: "alternate" } : {})}
              className="inline-flex items-center py-3 md:py-0 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <div
          className="pt-8 text-center"
          style={{ borderTop: "1px solid oklch(var(--border) / 0.5)" }}
        >
          <p className="text-xs text-muted-foreground">
            © {currentYear} <span className="text-foreground font-medium">{personalData.name}</span>{" "}
            · Crafted with precision &amp; care.
          </p>
        </div>
      </div>
    </footer>
  );
}
