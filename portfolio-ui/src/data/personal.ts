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
  title: "Senior Backend & DevOps / Kubernetes Engineer",

  // EDIT: Your value proposition tagline (must be < 200 chars per personal.test.ts)
  tagline:
    "8+ years building production Kubernetes platforms and .NET microservices for South African banking. AWS · Terraform · ArgoCD · Helm. Microsoft Certified: Azure Developer Associate.",

  // EDIT: Your email
  email: "ltmaseko7@gmail.com",

  // EDIT: Your location
  location: "Gauteng, South Africa (GMT+2)",

  // EDIT: Your availability status
  availability: "Available for K8s, IaC, and .NET microservices contracts",

  // EDIT: Key metrics to display
  metrics: {
    projects: "20+",
    experience: "8+ Years",
    clients: "10+",
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
  // EDIT: SEO title
  title: "Thulani Maseko — senior software developer",

  // EDIT: Meta description
  description:
    "I build production Kubernetes platforms and .NET services. 8+ years, mostly South African banking. AWS · Terraform · ArgoCD. Microsoft Certified Azure Developer Associate.",

  // EDIT: Keywords
  keywords:
    "kubernetes engineer, devops engineer south africa, aws eks consultant, terraform freelancer, .net microservices, hire kubernetes consultant, thulani maseko",
};
