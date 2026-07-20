import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollStore } from "@/store/useScrollStore";

gsap.registerPlugin(ScrollTrigger);

export function ScrollSync() {
  const setActiveSection = useScrollStore((state) => state.setActiveSection);
  const setScrollProgress = useScrollStore((state) => state.setScrollProgress);

  useEffect(() => {
    // Sync overall scroll progress
    const progressTrigger = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      },
    });

    // We can manually define section triggers or query them if they have a specific class.
    // For now, let's map section IDs to the Zustand store.
    const sections = [
      { id: "hero", selector: "header, .hero-section" },
      { id: "skills", selector: "#skills" },
      { id: "projects", selector: "#projects" },
      { id: "codedemo", selector: "#codedemo" },
      { id: "experience", selector: "#experience" },
      { id: "services", selector: "#services" },
      { id: "blog", selector: "#blog" },
      { id: "contact", selector: "#contact" },
    ];

    // Wait a brief moment for lazy sections to mount their empty divs
    setTimeout(() => {
      sections.forEach(({ id, selector }) => {
        const el = document.querySelector(selector) || document.getElementById(id);
        if (el) {
          ScrollTrigger.create({
            trigger: el,
            start: "top center",
            end: "bottom center",
            onEnter: () => setActiveSection(id),
            onEnterBack: () => setActiveSection(id),
          });
        }
      });
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [setActiveSection, setScrollProgress]);

  return null;
}
