/**
 * =============================================
 * EXPERIENCE DATA CONFIGURATION
 * =============================================
 * EDIT: Update with your work experience
 */

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | "Present";
  description: string;
  achievements: string[];
  technologies: string[];
  logoUrl?: string;
}

export const experiences: Experience[] = [
  // EDIT: Experience 1
  {
    id: "senior-dev-techcorp",
    company: "TechCorp Inc.",
    role: "Senior Software Engineer",
    location: "San Francisco, CA",
    startDate: "Jan 2022",
    endDate: "Present",
    description: "Leading development of cloud-native applications and mentoring junior developers.",
    achievements: [
      "Led migration of monolithic application to microservices, reducing deployment time by 70%",
      "Implemented CI/CD pipelines that improved release frequency from monthly to daily",
      "Mentored 5 junior developers, with 3 receiving promotions within a year",
      "Architected real-time notification system serving 1M+ users",
    ],
    technologies: ["React", "Node.js", "AWS", "Kubernetes", "PostgreSQL"],
    logoUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop",
  },
  // EDIT: Experience 2
  {
    id: "fullstack-dev-startup",
    company: "InnovateTech Startup",
    role: "Full-Stack Developer",
    location: "Remote",
    startDate: "Mar 2019",
    endDate: "Dec 2021",
    description: "Built and maintained multiple products from concept to production as an early employee.",
    achievements: [
      "Developed MVP that secured $2M seed funding within 6 months",
      "Built analytics platform processing 10M+ events daily",
      "Reduced infrastructure costs by 40% through optimization",
      "Established coding standards and review processes for the engineering team",
    ],
    technologies: ["TypeScript", "React", "GraphQL", "Python", "Docker"],
    logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
  },
  // EDIT: Experience 3
  {
    id: "frontend-dev-agency",
    company: "Digital Creative Agency",
    role: "Frontend Developer",
    location: "New York, NY",
    startDate: "Jun 2017",
    endDate: "Feb 2019",
    description: "Developed responsive web applications for Fortune 500 clients.",
    achievements: [
      "Delivered 15+ client projects on time and under budget",
      "Improved website performance scores by average of 40%",
      "Implemented design systems used across multiple projects",
      "Won 'Best Interactive Experience' award for financial services client",
    ],
    technologies: ["JavaScript", "React", "Vue.js", "CSS/SASS", "Webpack"],
    logoUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=100&h=100&fit=crop",
  },
  // EDIT: Experience 4
  {
    id: "junior-dev-first",
    company: "Software Solutions Ltd.",
    role: "Junior Developer",
    location: "Boston, MA",
    startDate: "Aug 2015",
    endDate: "May 2017",
    description: "Started career building internal tools and supporting production applications.",
    achievements: [
      "Developed internal tool that saved 20 hours per week in manual processes",
      "Contributed to open-source projects used by the company",
      "Received 'Rising Star' award for exceptional contributions",
    ],
    technologies: ["JavaScript", "Python", "MySQL", "HTML/CSS"],
    logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop",
  },
];
