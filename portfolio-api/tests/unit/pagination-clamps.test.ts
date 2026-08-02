import { describe, it, expect } from 'vitest';
import { clampPage, clampLimit, MAX_PAGE, MAX_PAGE_SIZE } from '../../src/utils/validation.js';

// Four lines of code guarding six list routes -- two public, four admin. They
// were previously exercised only indirectly, by two e2e cases against the
// public routes, and the two-argument form used by the contact routes was not
// covered at all.
//
// `skip: (page - 1) * limit` goes to Prisma, whose Int is 32-bit, so the
// clamps are what stand between a query string and a 500.

describe('clampLimit', () => {
  it('passes through an ordinary value', () => {
    expect(clampLimit('25')).toBe(25);
  });

  it('caps at MAX_PAGE_SIZE', () => {
    expect(clampLimit('999999')).toBe(MAX_PAGE_SIZE);
    expect(clampLimit(String(MAX_PAGE_SIZE + 1))).toBe(MAX_PAGE_SIZE);
  });

  it('falls back for anything unusable rather than reaching Prisma as NaN', () => {
    expect(clampLimit(undefined)).toBe(10);
    expect(clampLimit('')).toBe(10);
    expect(clampLimit('abc')).toBe(10);
    expect(clampLimit('0')).toBe(10);
    expect(clampLimit('-5')).toBe(10);
  });

  it('honours a caller-supplied fallback', () => {
    // The contact and newsletter admin listings default to 20, not 10. Before
    // this parameter was used they did `parseInt(x) || 20` with no ceiling.
    expect(clampLimit(undefined, 20)).toBe(20);
    expect(clampLimit('abc', 20)).toBe(20);
    expect(clampLimit('0', 20)).toBe(20);
  });

  it('still caps a caller-supplied fallback path at MAX_PAGE_SIZE', () => {
    // The fallback must not become a way to exceed the ceiling.
    expect(clampLimit('999999', 20)).toBe(MAX_PAGE_SIZE);
  });

  it('rejects a value past MAX_SAFE_INTEGER, which is not NaN', () => {
    // parseInt('99999999999999999999') is 1e20 -- a number, so a !isNaN guard
    // passes it straight through. Only isSafeInteger catches it.
    expect(clampLimit('99999999999999999999')).toBe(10);
  });
});

describe('clampPage', () => {
  it('passes through an ordinary value', () => {
    expect(clampPage('7')).toBe(7);
  });

  it('caps at MAX_PAGE', () => {
    expect(clampPage('1000000000')).toBe(MAX_PAGE);
  });

  it('floors at 1 for anything unusable', () => {
    expect(clampPage(undefined)).toBe(1);
    expect(clampPage('')).toBe(1);
    expect(clampPage('abc')).toBe(1);
    expect(clampPage('0')).toBe(1);
    expect(clampPage('-3')).toBe(1);
  });

  it('rejects a value past MAX_SAFE_INTEGER', () => {
    expect(clampPage('99999999999999999999')).toBe(1);
  });
});

describe('the clamps together bound Prisma skip', () => {
  it('keeps the worst-case skip inside a 32-bit int', () => {
    // This is the property that actually matters: whatever a caller sends,
    // (page - 1) * limit must not overflow Prisma's Int and become a 500.
    const worst = (clampPage('99999999') - 1) * clampLimit('99999999');
    expect(worst).toBeLessThan(2 ** 31 - 1);
    expect(Number.isSafeInteger(worst)).toBe(true);
  });
});
