import { describe, it, expect } from 'vitest';
import { ContactStatus } from '@prisma/client';
import {
  paginationSchema,
  articleQuerySchema,
  projectQuerySchema,
  createArticleSchema,
  updateArticleSchema,
  createProjectSchema,
  updateProjectSchema,
  contactSchema,
  contactSubmissionsQuerySchema,
  updateSubmissionStatusSchema,
  newsletterSubscribersQuerySchema,
} from '../../src/utils/validation.js';

// Since Phase 5 these schemas ARE the runtime input contract for nine
// endpoints -- the routes call .parse() on request.query / request.body, and
// the service signatures (CreateArticleInput and friends) are z.infer of these
// same schemas. Before Phase 5 nothing enforced them and the declared service
// types were unbacked. These tests exist so that stays true.

describe('paginationSchema', () => {
  it('supplies page, limit and sortOrder defaults for an empty query', () => {
    // The routes dropped their `|| 'desc'` fallback in Phase 5 because this
    // default makes it unreachable. If the default moves, sortOrder silently
    // becomes undefined and Prisma orders arbitrarily.
    expect(paginationSchema.parse({})).toEqual({
      page: '1',
      limit: '10',
      sortOrder: 'desc',
    });
  });

  it('rejects a non-numeric page', () => {
    // Phase 5 behaviour change: previously parseInt('abc') || 1 silently
    // served page 1 with a 200.
    expect(paginationSchema.safeParse({ page: 'abc' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '-1' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '1.5' }).success).toBe(false);
  });

  it("accepts '0' and leading zeros, which the routes then normalise", () => {
    // '0' passes /^\d+$/ deliberately: the route's `parseInt(page) || 1` maps
    // it to 1, matching pre-Phase-5 behaviour. Rejecting it here would be a
    // behaviour change nobody asked for.
    expect(paginationSchema.parse({ page: '0' }).page).toBe('0');
    expect(paginationSchema.parse({ page: '007' }).page).toBe('007');
  });

  it('rejects a sortOrder outside the enum', () => {
    expect(paginationSchema.safeParse({ sortOrder: 'DESC' }).success).toBe(false);
  });
});

describe('query schemas built by merging paginationSchema', () => {
  it('articleQuerySchema keeps the sortOrder default through the merge', () => {
    const q = articleQuerySchema.parse({});
    expect(q.sortOrder).toBe('desc');
    expect(q.limit).toBe('10');
  });

  it('projectQuerySchema keeps the sortOrder default through the merge', () => {
    expect(projectQuerySchema.parse({}).sortOrder).toBe('desc');
  });

  it('does not surface a caller-supplied status on the PUBLIC query schemas', () => {
    // These schemas used to carry `status: z.enum([...]).optional()`, and the
    // routes passed it straight into the Prisma where clause, so ?status=DRAFT
    // returned unpublished content to anyone. Both the field and the plumbing
    // are gone; zod strips the unknown key, so nothing downstream can read it
    // back even if a route re-declares it in its Fastify querystring schema.
    const article = articleQuerySchema.parse({ status: 'DRAFT' }) as Record<string, unknown>;
    const project = projectQuerySchema.parse({ status: 'DRAFT' }) as Record<string, unknown>;

    expect(article).not.toHaveProperty('status');
    expect(project).not.toHaveProperty('status');
  });

  it('leaves optional filters undefined rather than defaulting them', () => {
    const q = articleQuerySchema.parse({});
    expect(q.tag).toBeUndefined();
    expect(q.search).toBeUndefined();
    // sortBy stays undefined, which is why the routes keep `|| 'createdAt'`
    // rather than `??`: an explicit ?sortBy= yields '', and an empty orderBy
    // key breaks the Prisma query.
    expect(q.sortBy).toBeUndefined();
  });

  it('accepts an empty sortBy, which is why the routes use || and not ??', () => {
    expect(articleQuerySchema.parse({ sortBy: '' }).sortBy).toBe('');
  });
});

describe('contact and newsletter query schemas', () => {
  it("defaults limit to 20, NOT paginationSchema's 10", () => {
    // These are declared standalone rather than merged with paginationSchema
    // precisely so the admin page size stays 20. A merge would silently halve
    // it, and nothing else would notice.
    expect(contactSubmissionsQuerySchema.parse({}).limit).toBe('20');
    expect(newsletterSubscribersQuerySchema.parse({}).limit).toBe('20');
    expect(paginationSchema.parse({}).limit).toBe('10');
  });

  it('constrains status to exactly the ContactStatus enum', () => {
    // Asserted against the Prisma enum rather than a hand-copied list, so
    // adding a value to schema.prisma fails here until the zod schema catches
    // up. contact.service.ts does `status as ContactStatus`, and this schema
    // is what makes that assertion true.
    for (const value of Object.values(ContactStatus)) {
      expect(contactSubmissionsQuerySchema.safeParse({ status: value }).success).toBe(true);
      expect(updateSubmissionStatusSchema.safeParse({ status: value }).success).toBe(true);
    }
    expect(contactSubmissionsQuerySchema.safeParse({ status: 'BOGUS' }).success).toBe(false);
    expect(updateSubmissionStatusSchema.safeParse({ status: 'BOGUS' }).success).toBe(false);
  });

  it('requires a status on the update-submission body', () => {
    expect(updateSubmissionStatusSchema.safeParse({}).success).toBe(false);
    expect(updateSubmissionStatusSchema.safeParse({ status: 'READ' }).success).toBe(true);
  });
});

describe('update schemas (.partial())', () => {
  // The single most important property of the PUT routes: a partial update
  // must not resurrect defaults. If .partial() ever stopped short-circuiting,
  // PUT /articles/:id with only a title would silently reset featured,
  // sortOrder, status and tagIds on an existing row.
  it('does not inject defaults for omitted keys', () => {
    expect(updateArticleSchema.parse({ title: 'x' })).toEqual({ title: 'x' });
    expect(updateProjectSchema.parse({ title: 'x' })).toEqual({ title: 'x' });
  });

  it('still validates the keys that ARE present', () => {
    expect(updateArticleSchema.safeParse({ slug: 'Not A Slug' }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ githubUrl: 'not-a-url' }).success).toBe(false);
  });
});

describe('create schemas', () => {
  const validArticle = { slug: 'a-real-slug', title: 'Title', content: 'Body' };

  it('accepts a minimal valid article and applies its defaults', () => {
    const parsed = createArticleSchema.parse(validArticle);
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.featured).toBe(false);
    expect(parsed.tagIds).toEqual([]);
  });

  it('rejects a slug that is not lowercase-hyphenated', () => {
    expect(createArticleSchema.safeParse({ ...validArticle, slug: 'Not A Slug' }).success).toBe(
      false
    );
    expect(createArticleSchema.safeParse({ ...validArticle, slug: 'trailing-' }).success).toBe(
      false
    );
  });

  it('rejects a non-URL canonicalUrl and a non-UUID tagId', () => {
    expect(createArticleSchema.safeParse({ ...validArticle, canonicalUrl: 'nope' }).success).toBe(
      false
    );
    expect(createArticleSchema.safeParse({ ...validArticle, tagIds: ['nope'] }).success).toBe(
      false
    );
  });

  it('enforces the SEO length caps', () => {
    expect(
      createArticleSchema.safeParse({ ...validArticle, metaTitle: 'x'.repeat(71) }).success
    ).toBe(false);
    expect(
      createArticleSchema.safeParse({ ...validArticle, metaDescription: 'x'.repeat(161) }).success
    ).toBe(false);
  });

  it('requires the fields the service cannot synthesise', () => {
    expect(createArticleSchema.safeParse({ slug: 'a-slug', title: 'T' }).success).toBe(false);
    expect(createProjectSchema.safeParse({ slug: 'a-slug', title: 'T' }).success).toBe(false);
  });
});

describe('contactSchema', () => {
  const valid = {
    name: 'A Person',
    email: 'someone@example.com',
    message: 'This message is comfortably over ten characters.',
  };

  it('accepts a valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email and an under-length message', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: 'too short' }).success).toBe(false);
  });
});
