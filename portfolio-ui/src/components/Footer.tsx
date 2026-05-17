import { Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";
import { Logo } from "@/components/ui/Logo";

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

  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      className="relative"
      style={{ background: "hsl(var(--card) / 0.5)" }}
    >
      {/* Top gradient divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.3), transparent)" }}
      />

      <div className="section-container !py-14">
        <div className="grid md:grid-cols-3 gap-8 items-center mb-10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-block mb-2 transition-opacity hover:opacity-80"
            >
              <Logo size="lg" />
            </a>
            <p className="text-sm text-muted-foreground">{personalData.title}</p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer navigation">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
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
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="social-link w-9 h-9"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div
          className="pt-8 text-center"
          style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
        >
          <p className="text-xs text-muted-foreground">
            © {currentYear}{" "}
            <span className="text-gradient-primary font-medium">{personalData.name}</span>
            {" "}· Crafted with precision &amp; care.
          </p>
        </div>
      </div>
    </footer>
  );
}
