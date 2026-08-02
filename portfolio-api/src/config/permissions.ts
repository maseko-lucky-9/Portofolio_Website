import { Role } from '@prisma/client';

/**
 * Granular permissions for fine-grained access control
 */
export enum Permission {
  // Content Management
  CONTENT_READ = 'content:read',
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',

  // User Management
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_INVITE = 'users:invite',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // API Keys
  APIKEYS_CREATE = 'apikeys:create',
  APIKEYS_REVOKE = 'apikeys:revoke',
  APIKEYS_VIEW = 'apikeys:view',

  // Audit Logs
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
}

/**
 * Role-to-Permission mapping
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: [
    Permission.CONTENT_READ,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_READ,
  ],
  EDITOR: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_PUBLISH,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.SETTINGS_READ,
  ],
  ADMIN: [
    // Admin has all permissions
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.USERS_READ,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.USERS_INVITE,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
    Permission.APIKEYS_CREATE,
    Permission.APIKEYS_REVOKE,
    Permission.APIKEYS_VIEW,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],
};

/**
 * Get permissions for a specific role
 */
export function getUserPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const userPermissions = getUserPermissions(role);
  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const userPermissions = getUserPermissions(role);
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Get human-readable permission description
 */
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    [Permission.CONTENT_READ]: 'View content',
    [Permission.CONTENT_CREATE]: 'Create new content',
    [Permission.CONTENT_UPDATE]: 'Edit existing content',
    [Permission.CONTENT_DELETE]: 'Delete content',
    [Permission.CONTENT_PUBLISH]: 'Publish/unpublish content',
    [Permission.USERS_READ]: 'View users',
    [Permission.USERS_UPDATE]: 'Edit user details',
    [Permission.USERS_DELETE]: 'Delete users',
    [Permission.USERS_INVITE]: 'Invite new users',
    [Permission.ANALYTICS_VIEW]: 'View analytics',
    [Permission.ANALYTICS_EXPORT]: 'Export analytics data',
    [Permission.SETTINGS_READ]: 'View settings',
    [Permission.SETTINGS_UPDATE]: 'Update settings',
    [Permission.APIKEYS_CREATE]: 'Create API keys',
    [Permission.APIKEYS_REVOKE]: 'Revoke API keys',
    [Permission.APIKEYS_VIEW]: 'View API keys',
    [Permission.AUDIT_VIEW]: 'View audit logs',
    [Permission.AUDIT_EXPORT]: 'Export audit logs',
  };

  return descriptions[permission] || permission;
}
