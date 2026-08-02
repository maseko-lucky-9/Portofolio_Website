import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  hashApiKey,
  generateApiKey,
  generateToken,
  generateSessionId,
  generateVisitorId,
  generateSecureCode,
  hashContent,
} from '../../src/utils/crypto.js';

// crypto.ts imports config directly, so this file only runs because
// vitest.config.ts supplies DATABASE_URL and JWT_SECRET -- config/index.ts
// calls process.exit(1) at import time otherwise.

describe('encrypt / decrypt (AES-256-GCM)', () => {
  it('round-trips a value', () => {
    const plaintext = 'a value worth protecting';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    // A fixed IV under GCM is a catastrophic misuse: it leaks the XOR of two
    // plaintexts and destroys authentication. A round-trip test alone would
    // pass with a hardcoded IV, so assert the IVs actually differ.
    const a = encrypt('same input');
    const b = encrypt('same input');
    expect(a).not.toBe(b);
    expect(a.split(':')[0]).not.toBe(b.split(':')[0]);
  });

  it('emits the iv:authTag:ciphertext envelope', () => {
    const parts = encrypt('x').split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(32); // 16-byte IV, hex
    expect(parts[1]).toHaveLength(32); // 16-byte GCM tag, hex
  });

  it('REJECTS a tampered auth tag', () => {
    // The security property that makes this GCM rather than plain CTR. Without
    // it an attacker who can reach the stored ciphertext could flip bits and
    // have the plaintext accepted. A round-trip test passes even if the tag is
    // ignored entirely, so this is the assertion that actually earns its keep.
    const [iv, authTag, data] = encrypt('sensitive').split(':');
    const flipped = authTag.startsWith('0') ? `1${authTag.slice(1)}` : `0${authTag.slice(1)}`;

    expect(() => decrypt(`${iv}:${flipped}:${data}`)).toThrow();
  });

  it('REJECTS tampered ciphertext', () => {
    const [iv, authTag, data] = encrypt('sensitive').split(':');
    const flipped = data.startsWith('0') ? `1${data.slice(1)}` : `0${data.slice(1)}`;

    expect(() => decrypt(`${iv}:${authTag}:${flipped}`)).toThrow();
  });

  it('REJECTS a value encrypted under a different key', () => {
    const ciphertext = encrypt('sensitive', 'key-one-at-least-32-characters-long');
    expect(() => decrypt(ciphertext, 'key-two-at-least-32-characters-long')).toThrow();
  });
});

describe('API keys', () => {
  it('emits the pk_<prefix>_<secret> format with a matching prefix', () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key).toMatch(/^pk_[0-9a-f]{8}_[0-9a-f]{48}$/);
    expect(prefix).toMatch(/^pk_[0-9a-f]{8}$/);
    expect(key.startsWith(prefix)).toBe(true);
    expect(hash).toHaveLength(64);
  });

  it('hashes deterministically, so a stored hash can be looked up', () => {
    // auth.middleware.ts authenticates an API key by hashing the presented
    // value and comparing. Non-determinism here would lock every key out.
    const { key, hash } = generateApiKey();
    expect(hashApiKey(key)).toBe(hash);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('never returns the same key twice', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().key));
    expect(keys.size).toBe(50);
  });
});

describe('token and id generation', () => {
  it('generateToken returns hex of the requested byte length', () => {
    expect(generateToken()).toHaveLength(64);
    expect(generateToken(16)).toHaveLength(32);
    expect(generateToken()).toMatch(/^[0-9a-f]+$/);
  });

  it('session and visitor ids carry their prefixes and are unique', () => {
    expect(generateSessionId()).toMatch(/^sess_[0-9a-f]{32}$/);
    expect(generateVisitorId()).toMatch(/^vis_[0-9a-f]{24}$/);
    expect(generateSessionId()).not.toBe(generateSessionId());
  });

  it('generateSecureCode honours the requested length and alphabet', () => {
    expect(generateSecureCode()).toHaveLength(6);
    expect(generateSecureCode(10)).toHaveLength(10);
    expect(generateSecureCode(64)).toMatch(/^[0-9A-Z]+$/);
  });
});

describe('hashContent', () => {
  it('is deterministic and length-stable', () => {
    expect(hashContent('abc')).toBe(hashContent('abc'));
    expect(hashContent('abc')).not.toBe(hashContent('abd'));
    expect(hashContent('abc')).toHaveLength(32);
  });
});
