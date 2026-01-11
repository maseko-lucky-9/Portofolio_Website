/**
 * =============================================
 * SKILLS DATA CONFIGURATION
 * =============================================
 * EDIT: Update skills with your proficiency levels (0-100)
 */

export type SkillCategory = "frontend" | "backend" | "devops";

export interface Skill {
  name: string;
  proficiency: number; // 0-100
  category: SkillCategory;
  type: "language" | "framework" | "tool" | "cloud";
}

export const skills: Skill[] = [
  // EDIT: Frontend Skills
  { name: "React", proficiency: 95, category: "frontend", type: "framework" },
  { name: "TypeScript", proficiency: 90, category: "frontend", type: "language" },
  { name: "JavaScript", proficiency: 95, category: "frontend", type: "language" },
  { name: "Next.js", proficiency: 85, category: "frontend", type: "framework" },
  { name: "Vue.js", proficiency: 70, category: "frontend", type: "framework" },
  { name: "Tailwind CSS", proficiency: 95, category: "frontend", type: "framework" },
  { name: "HTML/CSS", proficiency: 95, category: "frontend", type: "language" },
  
  // EDIT: Backend Skills
  { name: "Node.js", proficiency: 90, category: "backend", type: "framework" },
  { name: "Python", proficiency: 80, category: "backend", type: "language" },
  { name: "PostgreSQL", proficiency: 85, category: "backend", type: "tool" },
  { name: "MongoDB", proficiency: 80, category: "backend", type: "tool" },
  { name: "GraphQL", proficiency: 75, category: "backend", type: "language" },
  { name: "REST APIs", proficiency: 95, category: "backend", type: "tool" },
  { name: "Express.js", proficiency: 90, category: "backend", type: "framework" },
  
  // EDIT: DevOps Skills
  { name: "Docker", proficiency: 85, category: "devops", type: "tool" },
  { name: "AWS", proficiency: 80, category: "devops", type: "cloud" },
  { name: "CI/CD", proficiency: 85, category: "devops", type: "tool" },
  { name: "Kubernetes", proficiency: 70, category: "devops", type: "tool" },
  { name: "Git", proficiency: 95, category: "devops", type: "tool" },
  { name: "Linux", proficiency: 80, category: "devops", type: "tool" },
  { name: "Terraform", proficiency: 65, category: "devops", type: "cloud" },
];

// Skills for radar chart visualization
export const radarSkills = {
  frontend: [
    { skill: "React/Next.js", value: 95 },
    { skill: "TypeScript", value: 90 },
    { skill: "CSS/Tailwind", value: 95 },
    { skill: "Testing", value: 80 },
    { skill: "Performance", value: 85 },
    { skill: "Accessibility", value: 80 },
  ],
  backend: [
    { skill: "Node.js", value: 90 },
    { skill: "Databases", value: 85 },
    { skill: "APIs", value: 95 },
    { skill: "Security", value: 80 },
    { skill: "Caching", value: 75 },
    { skill: "Messaging", value: 70 },
  ],
  devops: [
    { skill: "Docker", value: 85 },
    { skill: "Cloud (AWS)", value: 80 },
    { skill: "CI/CD", value: 85 },
    { skill: "Monitoring", value: 75 },
    { skill: "IaC", value: 70 },
    { skill: "Security", value: 75 },
  ],
};
