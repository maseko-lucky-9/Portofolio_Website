import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import { SectionBridge } from "@/components/SectionBridge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazySection } from "@/components/LazySection";

// Lazy-load below-fold sections. LazySection triggers each chunk when the
// user scrolls within 300 px of the section. CodeDemoSection still
// includes heavy Monaco Editor (~900 KB CDN JS). SkillsSection used to
// pull in recharts (~144 KB gzip) but now uses a hand-rolled SVG radar
// in SkillsRadar.tsx — chunk is now ~3 KB gzip.
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

import { Scene } from "@/components/canvas/Scene";
import { ScrollSync } from "@/components/canvas/ScrollSync";

const Index = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background relative">
        <a
          href="#about"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <SmoothScroll />
        <CustomCursor />
        <ScrollProgress />
        <ScrollSync />
        <Scene />
        <Navbar />
        <main id="hero">
          <HeroSection />
          {/* LazySection defers the Suspense boundary until the section
              approaches the viewport — prevents Monaco / recharts / etc.
              from loading their chunks during the initial page load. */}
          <div id="skills">
            <LazySection minHeight="800px">
              <Suspense fallback={<SectionFallback />}>
                <SkillsSection />
              </Suspense>
            </LazySection>
          </div>
          {/* SectionBridge instances render eagerly (outside LazySection)
              so their scroll observers register on first paint. The
              animation scrubs forward / backward with scroll position. */}
          <SectionBridge id="skills-projects" caption="Skills · Projects" />
          <div id="projects">
            <LazySection minHeight="800px">
              <Suspense fallback={<SectionFallback />}>
                <ProjectsSection />
              </Suspense>
            </LazySection>
          </div>
          <SectionBridge id="projects-codedemo" caption="Projects · Code" />
          <div id="codedemo">
            <LazySection minHeight="700px">
              <Suspense fallback={<SectionFallback />}>
                <CodeDemoSection />
              </Suspense>
            </LazySection>
          </div>
          <SectionBridge id="codedemo-experience" caption="Code · Experience" />
          <div id="experience">
            <LazySection minHeight="600px">
              <Suspense fallback={<SectionFallback />}>
                <ExperienceSection />
              </Suspense>
            </LazySection>
          </div>
          <div id="services">
            <LazySection minHeight="700px">
              <Suspense fallback={<SectionFallback />}>
                <ServicesSection />
              </Suspense>
            </LazySection>
          </div>
          <div id="casestudies">
            <LazySection minHeight="600px">
              <Suspense fallback={<SectionFallback />}>
                <CaseStudiesSection />
              </Suspense>
            </LazySection>
          </div>
          <div id="blog">
            <LazySection minHeight="600px">
              <Suspense fallback={<SectionFallback />}>
                <BlogSection />
              </Suspense>
            </LazySection>
          </div>
          <div id="contact">
            <LazySection minHeight="700px">
              <Suspense fallback={<SectionFallback />}>
                <ContactSection />
              </Suspense>
            </LazySection>
          </div>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
