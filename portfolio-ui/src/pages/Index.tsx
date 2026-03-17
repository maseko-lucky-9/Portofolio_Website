import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SkillsSection } from "@/components/SkillsSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load below-fold sections (CodeDemoSection includes heavy Monaco Editor)
const CodeDemoSection = lazy(() => import("@/components/CodeDemoSection").then(m => ({ default: m.CodeDemoSection })));
const ExperienceSection = lazy(() => import("@/components/ExperienceSection").then(m => ({ default: m.ExperienceSection })));
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
        <Navbar />
        <main>
          <HeroSection />
          <SkillsSection />
          <ProjectsSection />
          <Suspense fallback={<SectionFallback />}>
            <CodeDemoSection />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <ExperienceSection />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <BlogSection />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <ContactSection />
          </Suspense>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
