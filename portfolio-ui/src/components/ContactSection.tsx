import { useRef, useState } from "react";
import { animate, onScroll } from "animejs";
import { z } from "zod";
import {
  Mail,
  Send,
  Github,
  Linkedin,
  Twitter,
  Download,
  Calendar,
  MapPin,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { personalData } from "@/data/personal";
import { useContactForm } from "@/hooks/use-contact";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { DURATION, EASE_FN, fadeUpAnim } from "@/lib/motion";
import { useAnime } from "@/lib/use-anime";

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(20, "Message must be at least 20 characters").max(1000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: submitContact, isPending } = useContactForm();

  // Header + columns: scroll-triggered fade-up. Columns slide in from
  // their respective sides (left for info, right for form) — matches the
  // previous framer x:-20 / x:20 entry.
  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;

      const header = root.querySelector<HTMLElement>("[data-anime='header']");
      const infoCol = root.querySelector<HTMLElement>("[data-anime='info']");
      const formCol = root.querySelector<HTMLElement>("[data-anime='form']");

      if (header) {
        animate(header, {
          ...fadeUpAnim(),
          autoplay: onScroll({
            target: root,
            enter: "top bottom-=50",
            sync: "play pause",
          }),
        });
      }
      if (infoCol) {
        animate(infoCol, {
          opacity: [0, 1],
          translateX: [-20, 0],
          duration: DURATION.base * 1000,
          ease: EASE_FN.emphasized,
          autoplay: onScroll({
            target: root,
            enter: "top bottom-=50",
            sync: "play pause",
          }),
        });
      }
      if (formCol) {
        animate(formCol, {
          opacity: [0, 1],
          translateX: [20, 0],
          duration: DURATION.base * 1000,
          ease: EASE_FN.emphasized,
          autoplay: onScroll({
            target: root,
            enter: "top bottom-=50",
            sync: "play pause",
          }),
        });
      }
    },
    [],
  );

  // Success-state scale-in (mount-only, not scroll-triggered).
  // Fires whenever isSubmitted flips true.
  useAnime(
    successRef,
    (scope) => {
      const el = successRef.current;
      if (!el) return;
      if (scope.matches.reducedMotion) return;
      animate(el, {
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: DURATION.base * 1000,
        ease: EASE_FN.emphasized,
      });
    },
    [isSubmitted],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form client-side first
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<ContactFormData> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit to API
    submitContact(
      {
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        message: result.data.message,
      },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          setFormData({ name: "", email: "", subject: "", message: "" });
          setErrors({});
          // Reset success message after 5 seconds
          setTimeout(() => setIsSubmitted(false), 5000);
        },
        onError: () => {
          // Global error toast handled by QueryClient config
          // No additional handling needed here
        },
      }
    );
  };

  return (
    <section
      ref={rootRef}
      id="contact"
      aria-labelledby="contact-heading"
      className="py-20 section-mesh"
    >
      <div className="section-container">
        {/* Section Header */}
        <div data-anime="header" className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Contact
          </span>
          <h2 id="contact-heading" className="section-title">Say hi</h2>
          <p className="section-subtitle mx-auto">
            Have a project in mind or want to discuss opportunities? I would love to hear
            from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div data-anime="info">
            <h3 className="text-xl font-bold mb-6">Let us connect</h3>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "oklch(var(--primary) / 0.08)", border: "1px solid oklch(var(--primary) / 0.15)" }}
                >
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${personalData.email}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {personalData.email}
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "oklch(var(--secondary) / 0.08)", border: "1px solid oklch(var(--secondary) / 0.15)" }}
                >
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{personalData.location}</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">Connect with me</p>
                <div className="flex gap-3">
                  {[
                    { href: personalData.social.github, Icon: Github, label: "GitHub" },
                    { href: personalData.social.linkedin, Icon: Linkedin, label: "LinkedIn" },
                    { href: personalData.social.twitter, Icon: Twitter, label: "Twitter" },
                  ].map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="social-link w-10 h-10"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 space-y-3">
                <a
                  href={personalData.resumeUrl}
                  download
                  className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all"
                  style={{
                    background: "oklch(var(--card))",
                    boxShadow: "var(--shadow-sm)",
                    borderColor: "oklch(var(--border))",
                    transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--primary) / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--border))";
                  }}
                >
                  <Download className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Download Resume</p>
                    <p className="text-xs text-muted-foreground">PDF format</p>
                  </div>
                </a>

                <a
                  href={personalData.social.calendar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all"
                  style={{
                    background: "oklch(var(--card))",
                    boxShadow: "var(--shadow-sm)",
                    borderColor: "oklch(var(--border))",
                    transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--primary) / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(var(--border))";
                  }}
                >
                  <Calendar className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="font-medium">Schedule a Call</p>
                    <p className="text-xs text-muted-foreground">30 min meeting</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div data-anime="form">
            <div className="glass-card p-6 md:p-8">
              <h3 className="text-xl font-bold mb-6">Send a Message</h3>

              {isSubmitted ? (
                <div
                  ref={successRef}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "oklch(var(--secondary) / 0.08)", border: "1px solid oklch(var(--secondary) / 0.2)" }}
                  >
                    <CheckCircle className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Message Sent!</h4>
                  <p className="text-muted-foreground">
                    Thanks for reaching out. I will get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={errors.name ? "border-destructive" : ""}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <p
                          id="name-error"
                          role="alert"
                          className="text-xs text-destructive"
                        >
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className={errors.email ? "border-destructive" : ""}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p
                          id="email-error"
                          role="alert"
                          className="text-xs text-destructive"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Project Inquiry"
                      className={errors.subject ? "border-destructive" : ""}
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                    />
                    {errors.subject && (
                      <p
                        id="subject-error"
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell me about your project..."
                      rows={5}
                      className={errors.message ? "border-destructive" : ""}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                    {errors.message && (
                      <p
                        id="message-error"
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full btn-hero-primary !rounded-lg"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
