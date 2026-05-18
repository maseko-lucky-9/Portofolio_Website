import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import { Skeleton } from "@/components/ui/skeleton";
import { LazySection } from "@/components/LazySection";

// Lazy-load below-fold sections.
// SkillsSection imports recharts (~100 KB gzipped) — keep it out of the
// main bundle and let LazySection trigger the chunk when the user scrolls
// within 300 px of the section.
// CodeDemoSection includes heavy Monaco Editor (~900 KB CDN JS).
const SkillsSection = lazy(() => import("@/components/SkillsSection").then(m => ({ default: m.SkillsSection })));
const ProjectsSection = lazy(() => import("@/components/ProjectsSection").then(m => ({ default: m.ProjectsSection })));
const CodeDemoSection = lazy(() => import("@/components/CodeDemoSection").then(m => ({ default: m.CodeDemoSection })));
const ExperienceSection = lazy(() => import("@/components/ExperienceSection").then(m => ({ default: m.ExperienceSection })));
const ServicesSection = lazy(() => import("@/components/ServicesSection").then(m => ({ default: m.ServicesSection })));
const CaseStudiesSection = lazy(() => import("@/components/CaseStudiesSection").then(m => ({ default: m.CaseStudiesSection })));
const BlogSection = lazy(() => import("@/components/BlogSection").then(m => ({ default: m.BlogSection })));
const ContactSection = lazy(() => import("@/components/ContactSection").then(m => ({ default: m.ContactSection })));

function SectionFallback() {
  return (
    <div className="py-20">
      <div className="section-container">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <a
          href="#about"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <SmoothScroll />
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        <main>
          <HeroSection />
          {/* LazySection defers the Suspense boundary until the section
              approaches the viewport — prevents Monaco / recharts / etc.
              from loading their chunks during the initial page load. */}
          <LazySection minHeight="800px">
            <Suspense fallback={<SectionFallback />}>
              <SkillsSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="800px">
            <Suspense fallback={<SectionFallback />}>
              <ProjectsSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="700px">
            <Suspense fallback={<SectionFallback />}>
              <CodeDemoSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="600px">
            <Suspense fallback={<SectionFallback />}>
              <ExperienceSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="700px">
            <Suspense fallback={<SectionFallback />}>
              <ServicesSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="600px">
            <Suspense fallback={<SectionFallback />}>
              <CaseStudiesSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="600px">
            <Suspense fallback={<SectionFallback />}>
              <BlogSection />
            </Suspense>
          </LazySection>
          <LazySection minHeight="700px">
            <Suspense fallback={<SectionFallback />}>
              <ContactSection />
            </Suspense>
          </LazySection>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
