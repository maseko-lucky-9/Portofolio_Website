import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { generateTokens } from '../../src/middleware/auth.middleware.js';

// Deterministic pin for the refresh-token collision fix.
//
// tests/e2e/auth.test.ts covers the same bug end to end, but only by accident:
// the 409 appears solely when two tokens are minted inside the SAME wall-clock
// second, because `iat` has second granularity. A register+login round trip
// runs two bcrypt operations and two database calls, so on a slow runner the
// pair straddles a second boundary, no collision occurs, and a regression
// slips through green. These calls are back to back and pure -- generateTokens
// does nothing but jwt.sign -- so the window is never missed.

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'token-test@example.test',
  role: Role.VIEWER,
};

describe('generateTokens', () => {
  it('mints a distinct refresh token on every call', () => {
    // RefreshToken.token is @unique and storeRefreshToken() inserts it, so two
    // identical strings surface as a P2002 -> 409 CONFLICT on a plain login.
    const tokens = Array.from({ length: 25 }, () => generateTokens(user).refreshToken);

    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it('carries a unique jti on the refresh token', () => {
    // The `type` claim already differs between access and refresh, so asserting
    // only "the two differ" would pass without jwtid. The jti is what makes
    // repeated refresh tokens unique, so assert it directly.
    const a = jwt.decode(generateTokens(user).refreshToken) as { jti?: string };
    const b = jwt.decode(generateTokens(user).refreshToken) as { jti?: string };

    expect(a.jti).toBeTruthy();
    expect(b.jti).toBeTruthy();
    expect(a.jti).not.toBe(b.jti);
  });

  it('still produces a verifiable refresh token', () => {
    // Adding a claim must not break verification -- the refresh endpoint calls
    // verifyToken() on this exact string.
    const { refreshToken } = generateTokens(user);
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as {
      userId: string;
      type: string;
    };

    expect(decoded.userId).toBe(user.id);
    expect(decoded.type).toBe('refresh');
  });

  it('keeps access and refresh tokens distinguishable', () => {
    const { accessToken, refreshToken } = generateTokens(user);

    expect(accessToken).not.toBe(refreshToken);
    expect((jwt.decode(accessToken) as { type: string }).type).toBe('access');
    expect((jwt.decode(refreshToken) as { type: string }).type).toBe('refresh');
  });
});
