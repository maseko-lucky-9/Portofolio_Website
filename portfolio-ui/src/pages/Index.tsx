import { lazy, Suspense } from "react";
import { FieldBackground } from "@/components/FieldBackground";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TrustStrip } from "@/components/TrustStrip";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LazySection } from "@/components/LazySection";
import { ChatWidget } from "@/components/ChatWidget";

// Lazy-load below-fold sections. LazySection triggers each chunk when the user
// scrolls within 300 px of the section.
const OperatorSection = lazy(() =>
  import("@/components/OperatorSection").then((m) => ({ default: m.OperatorSection })),
);
const SkillsSection = lazy(() =>
  import("@/components/SkillsSection").then((m) => ({ default: m.SkillsSection })),
);
const ExperienceSection = lazy(() =>
  import("@/components/ExperienceSection").then((m) => ({ default: m.ExperienceSection })),
);
const ProjectsSection = lazy(() =>
  import("@/components/ProjectsSection").then((m) => ({ default: m.ProjectsSection })),
);
const ServicesSection = lazy(() =>
  import("@/components/ServicesSection").then((m) => ({ default: m.ServicesSection })),
);
const FaqSection = lazy(() =>
  import("@/components/FaqSection").then((m) => ({ default: m.FaqSection })),
);
const ContactSection = lazy(() =>
  import("@/components/ContactSection").then((m) => ({ default: m.ContactSection })),
);

/** Nothing but reserved height. A skeleton here would be a second design to
 *  keep in step with the real one, and LazySection already holds the space —
 *  the fallback is visible for a chunk fetch, not a data fetch. */
function SectionFallback({ minHeight }: { minHeight: string }) {
  return <div style={{ minHeight }} aria-hidden="true" />;
}

/**
 * Section anchors live on these wrappers, not on the sections themselves: the
 * wrapper exists before its chunk resolves, so `#skills` is a valid scroll
 * target on first paint rather than after the lazy import lands.
 *
 * minHeight values are measured from the built page at 1440 — Lighthouse is not
 * a WebDriver, so it takes the observer path and pays real CLS for a wrong
 * reserve. LazySection short-circuits under navigator.webdriver, which is why
 * Playwright sees every section mounted at once.
 */
const SECTIONS = [
  { id: "operator", minHeight: "760px", Component: OperatorSection },
  { id: "skills", minHeight: "1180px", Component: SkillsSection },
  { id: "experience", minHeight: "1500px", Component: ExperienceSection },
  { id: "work", minHeight: "1600px", Component: ProjectsSection },
  { id: "services", minHeight: "1080px", Component: ServicesSection },
  { id: "how", minHeight: "780px", Component: FaqSection },
  { id: "contact", minHeight: "620px", Component: ContactSection },
] as const;

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Fixed, z-index -10/0, painted before anything else so the first frame
          is the finished gradient rather than an empty ground. */}
      <FieldBackground />

      <SmoothScroll />
      <Navbar />

      <main id="main">
        <HeroSection />
        <TrustStrip />

        {SECTIONS.map(({ id, minHeight, Component }) => (
          <div id={id} key={id}>
            <LazySection minHeight={minHeight}>
              <Suspense fallback={<SectionFallback minHeight={minHeight} />}>
                <Component />
              </Suspense>
            </LazySection>
          </div>
        ))}
      </main>

      <Footer />

      {/* Fixed overlay, so deliberately not wrapped in LazySection (that defers on
          scroll position, which a fixed element never reaches). Mounted here rather
          than in App.tsx to keep it off the NotFound route. */}
      <ChatWidget />
    </div>
  );
};

export default Index;
