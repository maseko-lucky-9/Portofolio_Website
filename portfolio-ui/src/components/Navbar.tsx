import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Menu, X, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EASE_FN, useReducedMotion } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";
import { scrollToSection as scrollTo } from "@/lib/scroll-to-section";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#services", label: "Services" },
  { href: "#experience", label: "Experience" },
  { href: "#blog", label: "Blog" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const headerRef = useRef<HTMLElement>(null);
  const paperBgRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    scrollTo(href);
    setIsMobileMenuOpen(false);
  };

  // Header entrance — slide down + fade on mount. Skips entirely under
  // prefers-reduced-motion (the header is immediately at its final
  // position; matches the previous framer initial={false} short-circuit).
  useAnime(
    headerRef,
    (scope) => {
      if (scope.matches.reducedMotion) return;
      const el = headerRef.current;
      if (!el) return;
      animate(el, {
        translateY: [-80, 0],
        opacity: [0, 1],
        duration: 500,
        ease: EASE_FN.spring,
      });
    },
    [],
  );

  // Paper-background fade on scroll boundary. The div is rendered
  // unconditionally with opacity 0 and toggled via animate() so we get
  // proper exit transitions without AnimatePresence.
  useEffect(() => {
    const el = paperBgRef.current;
    if (!el) return;
    if (prefersReducedMotion) {
      el.style.opacity = isScrolled ? "1" : "0";
      return;
    }
    const anim = animate(el, {
      opacity: isScrolled ? [el.style.opacity || "0", 1] : [el.style.opacity || "1", 0],
      duration: 200,
      ease: EASE_FN.out,
    });
    return () => {
      anim.cancel();
    };
  }, [isScrolled, prefersReducedMotion]);

  // Mobile drawer enter/exit. Rendered unconditionally; pointer-events
  // and aria-hidden gated by isMobileMenuOpen for accessibility.
  // Children fan-in with a small stagger on enter only.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (prefersReducedMotion) {
      drawer.style.opacity = isMobileMenuOpen ? "1" : "0";
      drawer.style.transform = "none";
      return;
    }
    const items = drawer.querySelectorAll<HTMLElement>("[data-anime-link]");
    if (isMobileMenuOpen) {
      const open = animate(drawer, {
        opacity: [0, 1],
        scaleY: [0.85, 1],
        duration: 200,
        ease: EASE_FN.spring,
      });
      const links = animate(items, {
        opacity: [0, 1],
        translateX: [-12, 0],
        duration: 200,
        delay: stagger(40),
        ease: EASE_FN.spring,
      });
      return () => {
        open.cancel();
        links.cancel();
      };
    } else {
      const close = animate(drawer, {
        opacity: [drawer.style.opacity || "1", 0],
        scaleY: [1, 0.85],
        duration: 200,
        ease: EASE_FN.out,
      });
      return () => close.cancel();
    }
  }, [isMobileMenuOpen, prefersReducedMotion]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: isScrolled ? "10px" : "18px",
        paddingBottom: isScrolled ? "10px" : "18px",
      }}
    >
      {/* Scrolled glass background. Rendered unconditionally; opacity
          animated via useEffect above. */}
      <div
        ref={paperBgRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: 0,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          background: "oklch(var(--background) / 0.75)",
          borderBottom: "1px solid oklch(var(--border) / 0.6)",
          boxShadow: "0 4px 24px hsl(0 0% 0% / 0.06)",
        }}
      />

      <div className="section-container !py-0 relative flex items-center justify-between">
        {/* Brand — Tailwind hover handles the magnetic scale; no JS hover handler. */}
        <a
          href="#"
          className="z-10 inline-block transition-transform duration-200 ease-out hover:scale-[1.04]"
          style={{
            transformOrigin: "center",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Logo size="md" />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-7" role="navigation">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="nav-link text-sm"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle + mobile button */}
        <div className="flex items-center gap-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl w-11 h-11 md:w-9 md:h-9"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg gap-2">
                <Sun className="h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg gap-2">
                <Moon className="h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg gap-2">
                <Monitor className="h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl w-11 h-11 relative"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {/* Cross-fade between Menu and X icons via stacked layout and
                CSS transitions — keeps both elements mounted so a11y
                tree stays stable. */}
            <Menu
              className="absolute h-4 w-4 transition-all duration-150"
              style={{
                opacity: isMobileMenuOpen ? 0 : 1,
                transform: `rotate(${isMobileMenuOpen ? "90deg" : "0deg"})`,
              }}
              aria-hidden="true"
            />
            <X
              className="absolute h-4 w-4 transition-all duration-150"
              style={{
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: `rotate(${isMobileMenuOpen ? "0deg" : "-90deg"})`,
              }}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {/* Mobile navigation drawer — always rendered; opacity + pointer-events
          gated by isMobileMenuOpen so screen-readers and tab-focus skip it
          when closed.

          MUST stay absolutely positioned. In normal flow this 366px drawer is
          part of the fixed header's box, making the header 438px tall on every
          phone — half the screen — with its blurred scrim burying section
          titles and its pointer-events swallowing every tap in the top half.
          `md:hidden` makes these classes inert at >=768px, so desktop is
          unaffected. */}
      <nav
        ref={drawerRef}
        data-testid="mobile-drawer"
        aria-hidden={!isMobileMenuOpen}
        className="md:hidden absolute inset-x-0 top-full"
        style={{
          transformOrigin: "top center",
          maxHeight: "calc(100svh - 6rem)",
          overflowY: "auto",
          opacity: 0,
          pointerEvents: isMobileMenuOpen ? "auto" : "none",
        }}
      >
        <div
          className="mx-4 mt-2 rounded-2xl overflow-hidden"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                data-anime-link
                onClick={() => scrollToSection(link.href)}
                tabIndex={isMobileMenuOpen ? 0 : -1}
                className="text-left py-3 px-4 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium text-foreground"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
