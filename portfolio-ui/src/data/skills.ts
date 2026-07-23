/**
 * =============================================
 * SKILLS DATA CONFIGURATION
 * =============================================
 * CV-aligned skill list for Senior Backend & DevOps / Kubernetes Engineer.
 * Schema is locked to 3 categories (frontend/backend/devops) — cloud-native
 * skills live under "devops" with type: "cloud" or "tool".
 * Frontend skills are intentionally listed as supporting (per CV).
 */

export type SkillCategory = "frontend" | "backend" | "devops";

export interface Skill {
  name: string;
  proficiency: number; // 0-100
  category: SkillCategory;
  type: "language" | "framework" | "tool" | "cloud";
}

export const skills: Skill[] = [
  // DevOps / Cloud-native (headline differentiator)
  { name: "Kubernetes", proficiency: 90, category: "devops", type: "cloud" },
  { name: "AWS (EC2, EKS)", proficiency: 88, category: "devops", type: "cloud" },
  { name: "Terraform", proficiency: 88, category: "devops", type: "cloud" },
  { name: "Microsoft Azure", proficiency: 80, category: "devops", type: "cloud" },
  { name: "Helm", proficiency: 85, category: "devops", type: "tool" },
  { name: "ArgoCD", proficiency: 85, category: "devops", type: "tool" },
  { name: "Docker", proficiency: 90, category: "devops", type: "tool" },
  { name: "GitHub Actions", proficiency: 88, category: "devops", type: "tool" },
  { name: "Azure DevOps", proficiency: 85, category: "devops", type: "tool" },
  { name: "Linux", proficiency: 88, category: "devops", type: "tool" },
  { name: "Git", proficiency: 95, category: "devops", type: "tool" },

  // Backend (core engineering)
  { name: ".NET Core / .NET 9", proficiency: 95, category: "backend", type: "framework" },
  { name: "C#", proficiency: 95, category: "backend", type: "language" },
  { name: "Java", proficiency: 82, category: "backend", type: "language" },
  { name: "ASP.NET Core", proficiency: 92, category: "backend", type: "framework" },
  { name: "Java / Spring Boot 4", proficiency: 82, category: "backend", type: "framework" },
  { name: "Python", proficiency: 75, category: "backend", type: "language" },
  { name: "Apache Kafka", proficiency: 82, category: "backend", type: "tool" },
  { name: "REST APIs", proficiency: 95, category: "backend", type: "tool" },
  { name: "PostgreSQL", proficiency: 85, category: "backend", type: "tool" },
  { name: "MS SQL Server", proficiency: 92, category: "backend", type: "tool" },
  { name: "DynamoDB", proficiency: 78, category: "backend", type: "tool" },

  // Frontend (supporting, per CV)
  { name: "TypeScript", proficiency: 78, category: "frontend", type: "language" },
  { name: "Angular", proficiency: 75, category: "frontend", type: "framework" },
  { name: "Vue.js", proficiency: 70, category: "frontend", type: "framework" },
  { name: "HTML/CSS", proficiency: 80, category: "frontend", type: "language" },
];

// Skills for radar chart visualization — re-anchored on the K8s/DevOps positioning
export const radarSkills = {
  frontend: [
    { skill: "TypeScript", value: 78 },
    { skill: "Angular", value: 75 },
    { skill: "Vue.js", value: 70 },
    { skill: "HTML/CSS", value: 80 },
    { skill: "Accessibility", value: 70 },
    { skill: "Performance", value: 72 },
  ],
  backend: [
    { skill: ".NET / C#", value: 95 },
    { skill: "ASP.NET Core", value: 92 },
    { skill: "Java / Spring", value: 82 },
    { skill: "Microservices", value: 90 },
    { skill: "Databases (SQL)", value: 90 },
    { skill: "Kafka / Messaging", value: 82 },
  ],
  devops: [
    { skill: "Kubernetes", value: 90 },
    { skill: "Cloud (AWS)", value: 88 },
    { skill: "Terraform / IaC", value: 88 },
    { skill: "Helm / ArgoCD", value: 85 },
    { skill: "CI/CD", value: 88 },
    { skill: "Observability", value: 80 },
  ],
};
