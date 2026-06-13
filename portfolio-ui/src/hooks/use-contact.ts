/**
 * Contact & Forms Hooks
 * 
 * React Query hooks for contact forms and submissions
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  contactService, 
  newsletterService, 
  demoService 
} from '@/services/contact.service';
import type {
  ContactFormData,
  NewsletterSignupData,
  DemoRequestData,
} from '@/types/api';

/**
 * Submit contact form
 */
export function useContactForm() {
  return useMutation({
    mutationFn: (data: ContactFormData) => contactService.submit(data),
    onSuccess: () => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    },
  });
}

/**
 * Subscribe to newsletter
 */
export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (data: NewsletterSignupData) => newsletterService.subscribe(data),
    onSuccess: () => {
      toast.success('Subscribed! Please check your email to confirm.');
    },
  });
}

/**
 * Confirm newsletter subscription
 */
export function useNewsletterConfirm() {
  return useMutation({
    mutationFn: (token: string) => newsletterService.confirm(token),
    onSuccess: () => {
      toast.success('Email confirmed! You\'re now subscribed.');
    },
  });
}

/**
 * Unsubscribe from newsletter
 */
export function useNewsletterUnsubscribe() {
  return useMutation({
    mutationFn: (token: string) => newsletterService.unsubscribe(token),
    onSuccess: () => {
      toast.success('You\'ve been unsubscribed.');
    },
  });
}

/**
 * Request demo
 */
export function useDemoRequest() {
  return useMutation({
    mutationFn: (data: DemoRequestData) => demoService.requestDemo(data),
    onSuccess: () => {
      toast.success('Demo request submitted! We\'ll contact you shortly.');
    },
  });
}
