/**
 * The questions that come up before an engagement starts.
 *
 * Answers are first-person and specific — four of five permanent roles were
 * inside South African banking, and every claim here is one the CV supports.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  {
    q: "What does a Kubernetes engagement actually start with?",
    a: "A read-only audit: cluster topology, delivery path, secret handling, and what your golden signals currently miss. That produces a written findings document before any change is proposed.",
  },
  {
    q: "How do you handle regulated-environment constraints?",
    a: "Four of my five permanent roles were inside South African banking. Change control, audit trails, and separation of duties are the default assumptions, not an afterthought bolted on at review time.",
  },
  {
    q: "Do you work on the delivery pipeline or the services themselves?",
    a: "Both, and usually they are the same problem. A monolith rewrite that cannot be deployed safely has not been finished, and a GitOps pipeline with nothing worth deploying through it is a demo.",
  },
  {
    q: "What is the fastest way to evaluate the work?",
    a: "Read the repositories. Every project listed here has a public GitHub URL that resolves, and the impact lines describe only what the README supports.",
  },
];
