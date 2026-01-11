export function isApiResponse(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'data' in value);
}
export function isErrorResponse(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'error' in value &&
        typeof value.error === 'object');
}
export function isValidationError(error) {
    return (isErrorResponse(error) &&
        error.error.code === 'VALIDATION_ERROR' &&
        typeof error.error.details === 'object' &&
        error.error.details !== null &&
        'fields' in error.error.details);
}
export function isAuthError(error) {
    return (isErrorResponse(error) &&
        ['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(error.error.code));
}
export function isPaginatedResponse(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'data' in value &&
        Array.isArray(value.data) &&
        'meta' in value &&
        typeof value.meta === 'object');
}
export function isNotNull(value) {
    return value !== null;
}
export function isNotUndefined(value) {
    return value !== undefined;
}
export function isDefined(value) {
    return value !== null && value !== undefined;
}
export function isArray(value, itemGuard) {
    if (!Array.isArray(value)) {
        return false;
    }
    if (itemGuard) {
        return value.every(itemGuard);
    }
    return true;
}
export function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
export function isNumberArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'number');
}
export function hasProperty(obj, key) {
    return typeof obj === 'object' && obj !== null && key in obj;
}
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function assertNever(value) {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
export function isUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
export function isISODate(value) {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return isoDateRegex.test(value);
}
export function isSlug(value) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
}
export function isURL(value) {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=guards.js.map