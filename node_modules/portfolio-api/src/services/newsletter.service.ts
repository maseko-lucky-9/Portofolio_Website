import { prisma } from '../config/database.js';
import { ApiError } from '../utils/errors.js';
import { NewsletterInput } from '../utils/validation.js';
import { logger } from '../config/logger.js';
import { generateToken } from '../utils/crypto.js';

export class NewsletterService {
  // Subscribe to newsletter
  async subscribe(data: NewsletterInput): Promise<unknown> {
    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return {
          message: 'You are already subscribed to the newsletter',
        };
      }

      if (existing.status === 'PENDING') {
        // Resend confirmation
        // TODO: Send confirmation email
        logger.info({ email: data.email }, 'Resending newsletter confirmation');
        return {
          message: 'Please check your email to confirm your subscription',
        };
      }

      if (existing.status === 'UNSUBSCRIBED') {
        // Re-activate
        const token = generateToken(32);
        await prisma.newsletterSubscriber.update({
          where: { email: data.email },
          data: {
            status: 'PENDING',
            confirmationToken: token,
            confirmedAt: null,
          },
        });

        // TODO: Send confirmation email
        logger.info({ email: data.email }, 'Re-subscribing to newsletter');
        return {
          message: 'Please check your email to confirm your subscription',
        };
      }
    }

    // Create new subscription
    const token = generateToken(32);
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        confirmationToken: token,
        metadata: data.metadata as any,
      },
    });

    // TODO: Send confirmation email with token
    logger.info({ subscriberId: subscriber.id }, 'New newsletter subscription');

    return {
      message: 'Please check your email to confirm your subscription',
    };
  }

  // Confirm subscription
  async confirmSubscription(token: string): Promise<unknown> {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        confirmationToken: token,
        status: 'PENDING',
      },
    });

    if (!subscriber) {
      throw ApiError.badRequest('Invalid or expired confirmation token');
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'ACTIVE',
        confirmationToken: null,
        confirmedAt: new Date(),
      },
    });

    return {
      message: 'Your subscription has been confirmed. Welcome!',
    };
  }

  // Unsubscribe
  async unsubscribe(token: string): Promise<unknown> {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        OR: [
          { confirmationToken: token },
          { unsubscribeToken: token },
        ],
      },
    });

    if (!subscriber) {
      throw ApiError.badRequest('Invalid unsubscribe token');
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    logger.info({ subscriberId: subscriber.id }, 'Newsletter unsubscribe');

    return {
      message: 'You have been unsubscribed from the newsletter',
    };
  }

  // Get all subscribers (admin)
  async getSubscribers(options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<unknown> {
    const { page, limit, status } = options;

    const where = {
      ...(status && { status }),
    };

    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          confirmedAt: true,
          unsubscribedAt: true,
          createdAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    return {
      data: subscribers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get subscriber stats (admin)
  async getStats(): Promise<unknown> {
    const [total, active, pending, unsubscribed] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'PENDING' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
    ]);

    return {
      total,
      active,
      pending,
      unsubscribed,
    };
  }

  // Delete subscriber (admin)
  async deleteSubscriber(id: string): Promise<void> {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw ApiError.notFound('Newsletter subscriber');
    }

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });
  }
}

export const newsletterService = new NewsletterService();
