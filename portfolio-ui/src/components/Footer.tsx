import { Github, Linkedin, Twitter } from "lucide-react";
import { personalData } from "@/data/personal";

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
              className="text-xl font-bold inline-block mb-2 transition-opacity hover:opacity-80"
            >
              <span className="text-gradient-primary">{personalData.name.split(" ")[0]}</span>
              <span className="text-muted-foreground font-medium">.dev</span>
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
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary))";
                  (e.currentTarget as HTMLElement).style.color = "hsl(var(--primary-foreground))";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))";
                  (e.currentTarget as HTMLElement).style.color = "";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
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
