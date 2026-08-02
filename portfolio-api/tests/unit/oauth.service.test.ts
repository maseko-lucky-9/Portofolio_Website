import { describe, it, expect, afterEach, vi } from 'vitest';
import { oauthService } from '../../src/services/oauth.service.js';
import { ApiError } from '../../src/utils/errors.js';

// Phase 5 replaced `await response.json() as any` with zod parsing across this
// service, and the hardening was verified with throwaway probes that no longer
// exist. This file makes those assertions permanent.
//
// Every case here was run against the PRE-Phase-5 implementation and behaves
// differently there unless marked CONTROL -- a test that passes against the old
// code as well would be pinning nothing.
//
// No database: PrismaClient is constructed at module scope but connects lazily,
// and nothing in this path issues a query.

/** Stub global.fetch with a url-fragment -> body map. */
function stubFetch(routes: Record<string, unknown>): void {
  vi.stubGlobal('fetch', (url: string) => {
    for (const [fragment, body] of Object.entries(routes)) {
      if (String(url).includes(fragment)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
      }
    }
    throw new Error(`unstubbed url: ${String(url)}`);
  });
}

const GITHUB_USER = 'api.github.com/user';
const GITHUB_EMAILS = 'api.github.com/user/emails';
const GITHUB_TOKEN = 'github.com/login/oauth/access_token';
const GOOGLE_USER = 'googleapis.com/oauth2/v2/userinfo';

/** GitHub stubs. `emails` is the /user/emails body, `userEmail` the public profile address. */
const github = (emails: unknown, userEmail: string | null): Record<string, unknown> => ({
  [GITHUB_EMAILS]: emails,
  [GITHUB_USER]: { id: 1, email: userEmail, name: 'A Person', login: 'aperson' },
});

const PRIMARY = 'primary@example.com';
const PUBLIC = 'public@example.com';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getOAuthProfile — GitHub email selection', () => {
  // The 2x2 below is the point of this file. The Phase 5 probe varied
  // `verified` AND the public profile email together in one scenario and
  // attributed the resulting 400 to the verified check -- it actually came from
  // the null public email. Isolating them showed an unverified address being
  // returned. Each case here moves ONE input.

  it('returns the verified primary when there is no public profile email', async () => {
    stubFetch(github([{ email: PRIMARY, primary: true, verified: true }], null));
    await expect(oauthService.getOAuthProfile('github', 't')).resolves.toMatchObject({
      email: PRIMARY,
    });
  });

  it('prefers the verified primary over a different public profile email', async () => {
    stubFetch(github([{ email: PRIMARY, primary: true, verified: true }], PUBLIC));
    await expect(oauthService.getOAuthProfile('github', 't')).resolves.toMatchObject({
      email: PRIMARY,
    });
  });

  it('rejects an unverified primary when there is no public profile email', async () => {
    stubFetch(github([{ email: 'victim@example.com', primary: true, verified: false }], null));
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toThrow(ApiError);
  });

  it('rejects an unverified primary EVEN WHEN a public profile email exists', async () => {
    // The cell that caught the bug. Pre-fix this returned victim@example.com,
    // because `?? githubUser.email` re-admitted the address the verified filter
    // had just rejected. handleOAuthCallback links an incoming profile to any
    // existing user with a matching address, so that was an account-takeover
    // path: add a victim's address to your own GitHub account, sign in, get
    // linked to their account.
    stubFetch(
      github(
        [{ email: 'victim@example.com', primary: true, verified: false }],
        'victim@example.com'
      )
    );
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('falls back to the public profile email only when the list is unreadable', async () => {
    // /user/emails returns an OBJECT, not an array, when the token lacks the
    // user:email scope. Pre-Phase-5 this was `githubEmails.find is not a
    // function` -- a TypeError, i.e. a 500.
    stubFetch(github({ message: 'Requires authentication' }, PUBLIC));
    await expect(oauthService.getOAuthProfile('github', 't')).resolves.toMatchObject({
      email: PUBLIC,
    });
  });

  it('rejects when neither the list nor the profile yields an address', async () => {
    // Pre-Phase-5 this returned email: null against a declared `email: string`,
    // which then reached prisma.user.create() as null for a non-null unique
    // column.
    stubFetch(github([], null));
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('getOAuthProfile — GitHub email list robustness', () => {
  it('ignores one unparseable sibling and still finds the verified primary', async () => {
    // Elements are parsed individually with .catch(null). Parsing the array
    // all-or-nothing would let a single odd sibling address lock the user out.
    stubFetch(github([{ nope: 1 }, { email: PRIMARY, primary: true, verified: true }], null));
    await expect(oauthService.getOAuthProfile('github', 't')).resolves.toMatchObject({
      email: PRIMARY,
    });
  });

  it('treats an entirely unparseable list as an upstream fault (503)', async () => {
    // Every element degrading means the element SHAPE changed, not that one
    // address is odd. Falling through to the 400 would tell every user during a
    // GitHub outage to go verify an address they have already verified.
    stubFetch(github([{ nope: 1 }, { nope: 2 }], PUBLIC));
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('treats an EMPTY list as caller-actionable (400), not an upstream fault', async () => {
    // Asserted alongside the 503 above deliberately: without both, the
    // distinction between "shape drift" and "no verified address" is untested
    // and the guard could collapse to always-503.
    stubFetch(github([], null));
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('getOAuthProfile — Google', () => {
  const google = (body: unknown): Record<string, unknown> => ({ [GOOGLE_USER]: body });
  const base = { id: 'g1', email: 'someone@example.com', name: 'A Person' };

  it('resolves when Google confirms the address is verified (CONTROL)', async () => {
    stubFetch(google({ ...base, verified_email: true }));
    await expect(oauthService.getOAuthProfile('google', 't')).resolves.toMatchObject({
      email: base.email,
    });
  });

  it('rejects an explicitly unverified address', async () => {
    stubFetch(google({ ...base, verified_email: false }));
    await expect(oauthService.getOAuthProfile('google', 't')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a MISSING verified_email rather than assuming verified', async () => {
    // Fails closed, symmetrically with the GitHub branch. The v2 userinfo
    // endpoint always sends this field, but the OIDC endpoint spells it
    // `email_verified` -- so an endpoint migration must not silently start
    // admitting unverified addresses into the account-linking path.
    stubFetch(google(base));
    await expect(oauthService.getOAuthProfile('google', 't')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('reports a malformed profile response as an upstream fault, not caller error', async () => {
    stubFetch(google({ message: 'Bad credentials' }));
    await expect(oauthService.getOAuthProfile('google', 't')).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

describe('getOAuthProfile — provider faults are not client errors', () => {
  it('maps a GitHub error body to 503 rather than a 400 naming provider fields', async () => {
    // Pre-fix this threw a raw ZodError, which errorHandler turns into
    // 400 VALIDATION_ERROR listing the provider's own field names -- reporting
    // an upstream outage as caller error and echoing the wire format back.
    stubFetch({ [GITHUB_EMAILS]: [], [GITHUB_USER]: { message: 'Bad credentials' } });
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('does not leak the provider response into the client-facing message', async () => {
    stubFetch({
      [GITHUB_EMAILS]: [],
      [GITHUB_USER]: { message: 'Bad credentials', secret_token: 'super-secret-value' },
    });
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.toThrow(
      /returned an unexpected response/
    );
    await expect(oauthService.getOAuthProfile('github', 't')).rejects.not.toThrow(
      /super-secret-value/
    );
  });
});

describe('exchangeCodeForToken', () => {
  it('returns both tokens on a normal response (CONTROL)', async () => {
    stubFetch({ [GITHUB_TOKEN]: { access_token: 'AT', refresh_token: 'RT' } });
    await expect(oauthService.exchangeCodeForToken('github', 'c')).resolves.toEqual({
      accessToken: 'AT',
      refreshToken: 'RT',
    });
  });

  it('rejects a response carrying neither error nor access_token', async () => {
    // Pre-Phase-5 this returned { accessToken: undefined } and stored undefined
    // as the account's access token.
    stubFetch({ [GITHUB_TOKEN]: {} });
    await expect(oauthService.exchangeCodeForToken('github', 'c')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('accepts an empty refresh_token', async () => {
    // refresh_token deliberately has no .min(1): nothing reads its contents,
    // and rejecting '' would turn a cosmetic provider oddity into a failed
    // login. access_token keeps the constraint because it becomes a credential.
    await expect(
      (async () => {
        stubFetch({ [GITHUB_TOKEN]: { access_token: 'AT', refresh_token: '' } });
        return oauthService.exchangeCodeForToken('github', 'c');
      })()
    ).resolves.toMatchObject({ accessToken: 'AT' });
  });

  it('falls back to the error code when error_description is absent', async () => {
    // Pre-Phase-5 the message interpolated `undefined`.
    stubFetch({ [GITHUB_TOKEN]: { error: 'bad_verification_code' } });
    await expect(oauthService.exchangeCodeForToken('github', 'c')).rejects.toThrow(
      /bad_verification_code/
    );
  });

  it('uses error_description when the provider supplies one', async () => {
    stubFetch({
      [GITHUB_TOKEN]: { error: 'bad_verification_code', error_description: 'The code expired' },
    });
    await expect(oauthService.exchangeCodeForToken('github', 'c')).rejects.toThrow(
      /The code expired/
    );
  });

  it('treats error as authoritative even when an access_token is also present', async () => {
    stubFetch({ [GITHUB_TOKEN]: { error: 'some_error', access_token: 'AT' } });
    await expect(oauthService.exchangeCodeForToken('github', 'c')).rejects.toThrow(/some_error/);
  });
});

describe('getAuthorizationUrl', () => {
  it('requests the user:email scope, which the verified-primary check depends on', async () => {
    const url = oauthService.getAuthorizationUrl('github', 'state-123');
    expect(url).toContain('user%3Aemail');
    expect(url).toContain('state=state-123');
  });

  it('rejects an unsupported provider', () => {
    expect(() => oauthService.getAuthorizationUrl('microsoft' as 'github', 's')).toThrow(ApiError);
  });
});
