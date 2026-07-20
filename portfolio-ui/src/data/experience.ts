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
  {
    id: "capitec-bank-dev",
    company: "Capitec Bank",
    role: "Software Developer",
    location: "Sandton, ZA",
    startDate: "Jun 2023",
    endDate: "Present",
    description:
      "Maintaining and migrating legacy systems to the cloud by developing new service-oriented applications.",
    achievements: [
      "Migrated on-premises applications to AWS using EC2 and EKS, improving scalability and reliability",
      "Rewrote monolithic applications into microservices using modern technologies",
      "Analyzed and optimized system performance by applying clean code principles",
      "Investigated and resolved production issues by identifying root causes and implementing fixes",
    ],
    technologies: [
      ".NET",
      "ASP.NET",
      "Java",
      "Spring Boot",
      "Python",
      "MS SQL Server",
      "DynamoDB",
      "PostgreSQL",
      "AWS",
      "Terraform",
      "Kubernetes",
      "ArgoCD",
      "Kafka",
      "SQS",
    ],
  },
  {
    id: "invoke-solutions-dev",
    company: "Invoke Solutions",
    role: "Software Developer",
    location: "Pretoria, ZA",
    startDate: "Jul 2022",
    endDate: "Jun 2023",
    description:
      "Full-stack development across .NET and PHP ecosystems with Azure DevOps CI/CD workflows.",
    achievements: [
      "Developed full-stack features using .NET Framework, ASP.NET, and SQL Server",
      "Built and maintained applications with Laravel (PHP) and Vue.js",
      "Managed source control workflows across Git, Bitbucket, and Jenkins pipelines",
    ],
    technologies: [
      ".NET Framework",
      "ASP.NET",
      "SQL Server",
      "Laravel",
      "PHP",
      "Vue.js",
      "Azure DevOps",
      "Git",
      "Bitbucket",
      "Jenkins",
    ],
  },
  {
    id: "e4-strategic-dev",
    company: "E4 Strategic",
    role: "Software Developer",
    location: "Johannesburg, ZA",
    startDate: "Nov 2020",
    endDate: "Jun 2022",
    description:
      "Maintaining legacy systems and decommissioning them by developing new service-oriented applications.",
    achievements: [
      "Developed new service-oriented applications to replace and decommission legacy systems",
      "Analyzed and improved performance on existing systems using clean code principles",
      "Investigated production bugs and applied solutions following Agile/Scrum methodology",
    ],
    technologies: [".NET Framework", "ASP.NET", "MS SQL Server", "Azure DevOps", "TFS"],
  },
  {
    id: "absa-dev",
    company: "Absa",
    role: "Software Developer",
    location: "Johannesburg, ZA",
    startDate: "Apr 2017",
    endDate: "Nov 2020",
    description:
      "Broad responsibilities on the Electronic Sales Platform (ESP) including UI development, design, and implementation.",
    achievements: [
      "Involved in all phases of the project lifecycle: planning, analysis, design, implementation, testing, and maintenance",
      "Collaborated closely with team members to plan, design, and develop robust solutions using .NET Framework and ASP.NET",
      "Created SQL Server databases, tables, and stored procedures for business-critical applications",
    ],
    technologies: [".NET Framework", "ASP.NET", "MS SQL Server", "Azure DevOps", "Git"],
  },
  {
    id: "digital-academy-intern",
    company: "The Digital Academy",
    role: "Intern Developer",
    location: "Johannesburg, ZA",
    startDate: "Jan 2017",
    endDate: "Mar 2017",
    description:
      "Built solutions for mobile payments and beacon technology as part of an intensive development programme.",
    achievements: [
      "Awarded Best Developer of the Quarter out of 30 interns",
      "Won Best App Solution of the Quarter for mobile payment and beacon technology projects",
      "Participated in all phases of the project lifecycle from UML design to API and stored procedure creation",
    ],
    technologies: ["Angular", "Ionic", "PHP", "MySQL"],
  },
];
