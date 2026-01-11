import { prisma } from '../config/database.js';
import { ApiError } from '../utils/errors.js';
import { ContactInput } from '../utils/validation.js';
import { logger } from '../config/logger.js';

export class ContactService {
  // Submit contact form
  async submitContact(data: ContactInput, metadata?: {
    ip?: string;
    userAgent?: string;
    referer?: string;
  }): Promise<unknown> {
    // Check for duplicate submissions in last 5 minutes
    const recentSubmission = await prisma.contactSubmission.findFirst({
      where: {
        email: data.email,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      },
    });

    if (recentSubmission) {
      throw ApiError.tooManyRequests('Please wait a few minutes before submitting another message');
    }

    // Create submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        phone: data.phone,
        company: data.company,
        metadata: metadata as any,
      },
    });

    // TODO: Send notification email to admin
    logger.info({ submissionId: submission.id }, 'New contact submission received');

    return {
      id: submission.id,
      message: 'Thank you for your message. I will get back to you soon!',
    };
  }

  // Get all submissions (admin)
  async getSubmissions(options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<unknown> {
    const { page, limit, status } = options;

    const where = {
      ...(status && { status }),
    };

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactSubmission.count({ where }),
    ]);

    return {
      data: submissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single submission (admin)
  async getSubmission(id: string): Promise<unknown> {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw ApiError.notFound('Contact submission');
    }

    return submission;
  }

  // Update submission status (admin)
  async updateSubmissionStatus(id: string, status: string, notes?: string): Promise<unknown> {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw ApiError.notFound('Contact submission');
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: {
        status,
        notes,
        readAt: status === 'READ' || status === 'REPLIED' ? new Date() : submission.readAt,
      },
    });

    return updated;
  }

  // Delete submission (admin)
  async deleteSubmission(id: string): Promise<void> {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw ApiError.notFound('Contact submission');
    }

    await prisma.contactSubmission.delete({
      where: { id },
    });
  }
}

export const contactService = new ContactService();
