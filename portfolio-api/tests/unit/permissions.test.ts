import { describe, it, expect } from 'vitest';
import { Role } from '@prisma/client';
import {
  Permission,
  ROLE_PERMISSIONS,
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionDescription,
} from '../../src/config/permissions.js';

// This module currently has ZERO importers -- nothing in src/ consumes it. The
// tests are deliberately limited to invariants rather than behaviour detail:
// they are cheap, they are pure, and they are the assertions that would matter
// on the day someone wires this up to a route guard. Anything more would be
// codifying the behaviour of code nobody calls.

describe('role/permission invariants', () => {
  it('ADMIN holds every permission in the enum', () => {
    // Asserted against Object.values(Permission) rather than a hand-copied
    // list, so adding a permission fails here until it is deliberately
    // assigned to ADMIN. Without that, a new permission silently locks admins
    // out of whatever it guards.
    const all = Object.values(Permission);
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toHaveLength(all.length);
    for (const permission of all) {
      expect(hasPermission(Role.ADMIN, permission)).toBe(true);
    }
  });

  it('defines a permission list for every role in the Prisma enum', () => {
    for (const role of Object.values(Role)) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it('grants VIEWER no mutating permission', () => {
    const mutating = Object.values(Permission).filter((p) =>
      /:(create|update|delete|publish|invite|revoke)$/.test(p)
    );
    expect(mutating.length).toBeGreaterThan(0);
    for (const permission of mutating) {
      expect(hasPermission(Role.VIEWER, permission)).toBe(false);
    }
  });

  it('gives EDITOR strictly more than VIEWER and strictly less than ADMIN', () => {
    const viewer = new Set(getUserPermissions(Role.VIEWER));
    const editor = new Set(getUserPermissions(Role.EDITOR));
    const admin = new Set(getUserPermissions(Role.ADMIN));

    for (const p of viewer) expect(editor.has(p)).toBe(true);
    for (const p of editor) expect(admin.has(p)).toBe(true);
    expect(editor.size).toBeGreaterThan(viewer.size);
    expect(admin.size).toBeGreaterThan(editor.size);
  });

  it('never lets a non-admin delete users', () => {
    expect(hasPermission(Role.EDITOR, Permission.USERS_DELETE)).toBe(false);
    expect(hasPermission(Role.VIEWER, Permission.USERS_DELETE)).toBe(false);
    expect(hasPermission(Role.ADMIN, Permission.USERS_DELETE)).toBe(true);
  });
});

describe('hasAllPermissions / hasAnyPermission', () => {
  it('hasAllPermissions requires every one', () => {
    expect(
      hasAllPermissions(Role.EDITOR, [Permission.CONTENT_READ, Permission.CONTENT_CREATE])
    ).toBe(true);
    expect(hasAllPermissions(Role.EDITOR, [Permission.CONTENT_READ, Permission.USERS_DELETE])).toBe(
      false
    );
  });

  it('hasAnyPermission requires only one', () => {
    expect(hasAnyPermission(Role.EDITOR, [Permission.USERS_DELETE, Permission.CONTENT_READ])).toBe(
      true
    );
    expect(
      hasAnyPermission(Role.VIEWER, [Permission.USERS_DELETE, Permission.APIKEYS_CREATE])
    ).toBe(false);
  });

  it('treats an empty list as vacuously all and definitely not any', () => {
    // The dangerous direction is hasAllPermissions([]) === true being used as
    // an authorisation check on an empty requirement list. Pinned so the
    // semantics are at least explicit.
    expect(hasAllPermissions(Role.VIEWER, [])).toBe(true);
    expect(hasAnyPermission(Role.VIEWER, [])).toBe(false);
  });
});

describe('getPermissionDescription', () => {
  it('is total over the enum', () => {
    for (const permission of Object.values(Permission)) {
      const description = getPermissionDescription(permission);
      expect(description).toBeTruthy();
      // Falling back to the raw enum value means the description map has
      // drifted from the enum.
      expect(description).not.toBe(permission);
    }
  });
});
