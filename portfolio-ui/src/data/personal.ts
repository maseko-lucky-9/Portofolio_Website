/**
 * =============================================
 * PERSONAL DATA CONFIGURATION
 * =============================================
 * EDIT: Update all values below with your personal information
 */

export const personalData = {
  // EDIT: Your name
  name: "Thulani Maseko",

  // EDIT: Your role/title
  //
  // Keep the leading noun identical to the CV ("Software Developer"). src/chat.ts:80
  // rule 8 tells the chatbot to prefer the CV wherever it disagrees with the site, so
  // a grander title here does not win — it just makes the bot contradict this page.
  // experience.ts already lists the role as "Software Developer" in all four
  // permanent positions. The suffix is a domain qualifier, not a claimed seniority.
  title: "Software Developer — Kubernetes, .NET & Platform",

  // EDIT: Your value proposition tagline (must be < 200 chars per personal.test.ts)
  tagline:
    "8+ years building production Kubernetes platforms and .NET microservices for South African banking. AWS · Terraform · ArgoCD · Helm. Microsoft Certified: Azure Developer Associate.",

  // EDIT: Your email
  email: "ltmaseko7@gmail.com",

  // EDIT: Your location
  location: "Gauteng, South Africa (GMT+2)",

  // EDIT: Your availability status
  //
  // LOAD-BEARING, not decorative. src/chat.ts:75 rule 3 says "Never state availability
  // beyond the AVAILABILITY line", and that line is this string. Whatever is omitted
  // here, the chatbot is instructed to refuse — so the previous contract-only wording
  // made it decline the single highest-intent question a recruiter asks ("is he open
  // to permanent?"), no matter what the screening-notes document said. Rule 8's
  // document-wins override applies to PROFESSIONAL HISTORY only, not to this line.
  availability:
    "Open to permanent roles and contract work — Kubernetes, IaC, and .NET microservices",

  // EDIT: Key metrics to display
  //
  // Every value here must be defensible, because src/chat.ts:90 puts `experience` in
  // the chatbot's prompt and the other two render 300 px above the chat widget.
  // `clients: "10+"` used to sit in the third slot: the CV shows five employers, four
  // of them permanent, so "who are his ten clients?" hit rule 1's refusal string while
  // the number was still on screen. Certifications are countable and on the CV.
  metrics: {
    projects: "20+",
    experience: "8+ Years",
    certifications: "3",
  },

  // EDIT: Social links — github + linkedin required; twitter + calendar optional (empty until set up)
  social: {
    github: "https://github.com/maseko-lucky-9",
    linkedin: "https://www.linkedin.com/in/thulani-maseko-819587127/",
    twitter: "",
    calendar: "",
  },

  // EDIT: Resume file path
  resumeUrl: "/resume.pdf",

  // EDIT: Profile image — local headshot. AVIF/WebP/JPEG variants live at
  // public/brand/photo/thulani-{256,512,1024}.{avif,webp,jpg}. The base path
  // here is the JPEG fallback used by older browsers; <picture> sources
  // upgrade to WebP/AVIF where supported.
  profileImage: "/brand/photo/thulani-512.jpg",
  profileImageSources: {
    avif: {
      sm: "/brand/photo/thulani-256.avif",
      md: "/brand/photo/thulani-512.avif",
      lg: "/brand/photo/thulani-1024.avif",
    },
    webp: {
      sm: "/brand/photo/thulani-256.webp",
      md: "/brand/photo/thulani-512.webp",
      lg: "/brand/photo/thulani-1024.webp",
    },
    jpg: {
      sm: "/brand/photo/thulani-256.jpg",
      md: "/brand/photo/thulani-512.jpg",
      lg: "/brand/photo/thulani-1024.jpg",
    },
  },
};

export const seoData = {
  // EDIT: SEO title — keep the role noun consistent with personalData.title above.
  title: "Thulani Maseko — Software Developer, Kubernetes & .NET",

  // EDIT: Meta description
  description:
    "I build production Kubernetes platforms and .NET services. 8+ years, mostly South African banking. AWS · Terraform · ArgoCD. Microsoft Certified Azure Developer Associate.",

  // EDIT: Keywords
  keywords:
    "kubernetes engineer, devops engineer south africa, aws eks consultant, terraform freelancer, .net microservices, hire kubernetes consultant, thulani maseko",
};
