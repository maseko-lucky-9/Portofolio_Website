/**
 * =============================================
 * PROJECTS DATA CONFIGURATION
 * =============================================
 * EDIT: Update with your own projects
 */

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  thumbnail: string;
  technologies: string[];
  challenge: string;
  solution: string;
  impact: string;
  liveUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  featured: boolean;
}

export const projects: Project[] = [
  // EDIT: Project 1
  {
    id: "ecommerce-platform",
    title: "E-Commerce Platform",
    tagline: "Scalable. Fast. Secure.",
    description: "A full-featured e-commerce platform with real-time inventory, AI-powered recommendations, and seamless payment processing.",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    technologies: ["React", "Node.js", "PostgreSQL", "Redis", "Stripe", "AWS"],
    challenge: "The client needed a platform handling 10,000+ concurrent users with real-time inventory updates across multiple warehouses.",
    solution: "Implemented event-driven architecture with Redis for real-time sync, optimized database queries with proper indexing, and deployed on AWS with auto-scaling.",
    impact: "Achieved 99.9% uptime, 200ms average response time, and 40% increase in conversion rate.",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/yourusername/project",
    caseStudyUrl: "/case-studies/ecommerce",
    featured: true,
  },
  // EDIT: Project 2
  {
    id: "analytics-dashboard",
    title: "Analytics Dashboard",
    tagline: "Data. Insights. Action.",
    description: "Real-time analytics dashboard for tracking user behavior, conversions, and business KPIs with customizable visualizations.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    technologies: ["TypeScript", "Next.js", "D3.js", "GraphQL", "TimescaleDB"],
    challenge: "Process and visualize millions of data points in real-time without impacting dashboard performance.",
    solution: "Built with server-side aggregations, WebSocket updates for live data, and optimized D3.js rendering with virtual scrolling.",
    impact: "Reduced data processing time by 80% and enabled real-time decision making for 500+ team members.",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/yourusername/project",
    featured: true,
  },
  // EDIT: Project 3
  {
    id: "collaboration-tool",
    title: "Team Collaboration Tool",
    tagline: "Connect. Collaborate. Create.",
    description: "Real-time collaboration platform with video conferencing, shared workspaces, and integrated project management.",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    technologies: ["React", "WebRTC", "Socket.io", "MongoDB", "Docker", "Kubernetes"],
    challenge: "Enable seamless real-time collaboration with video/audio for distributed teams across different time zones.",
    solution: "Implemented WebRTC with TURN/STUN servers, optimistic UI updates with conflict resolution, and horizontal scaling with Kubernetes.",
    impact: "Adopted by 50+ teams, reduced meeting times by 30%, and improved project delivery by 25%.",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/yourusername/project",
    caseStudyUrl: "/case-studies/collaboration",
    featured: true,
  },
  // EDIT: Project 4
  {
    id: "ai-assistant",
    title: "AI Writing Assistant",
    tagline: "Write. Refine. Publish.",
    description: "AI-powered writing assistant that helps users create, edit, and optimize content with real-time suggestions.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    technologies: ["Python", "FastAPI", "OpenAI", "React", "PostgreSQL"],
    challenge: "Create an intuitive AI writing experience with fast response times and context-aware suggestions.",
    solution: "Built streaming responses, implemented context caching, and created a custom fine-tuned model for better suggestions.",
    impact: "Users report 50% faster content creation and 35% improvement in writing quality scores.",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/yourusername/project",
    featured: false,
  },
];

// All unique technologies for filtering
export const allTechnologies = [...new Set(projects.flatMap(p => p.technologies))].sort();
