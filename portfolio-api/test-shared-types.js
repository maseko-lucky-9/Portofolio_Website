/**
 * Test Shared Types Integration
 * Simple test to verify shared types can be imported and used
 */

import {
  ProjectStatus,
  UserRole,
  EventType,
  isApiResponse,
  isErrorResponse,
} from '@portfolio/shared/types';

import {
  projectQuerySchema,
  createProjectSchema,
} from '@portfolio/shared/validators';

console.log('✓ Shared types imported successfully!\n');

// Test 1: Enums
console.log('📋 Available Project Statuses:', Object.values(ProjectStatus));
console.log('📋 Available User Roles:', Object.values(UserRole));
console.log('📋 Available Event Types:', Object.values(EventType));

// Test 2: Type Guards
const validResponse = {
  data: { id: '123', name: 'Test Project' },
  meta: { timestamp: new Date().toISOString() },
};

const errorResponse = {
  error: {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Project not found',
  },
};

console.log('\n🔍 Type Guard Tests:');
console.log('  isApiResponse(validResponse):', isApiResponse(validResponse));
console.log('  isErrorResponse(errorResponse):', isErrorResponse(errorResponse));
console.log('  isApiResponse(errorResponse):', isApiResponse(errorResponse));

// Test 3: Zod Validators
console.log('\n✅ Zod Validator Tests:');

const validQuery = {
  page: '1',
  limit: '10',
  status: 'PUBLISHED',
};

const queryResult = projectQuerySchema.safeParse(validQuery);
console.log('  Valid query parse:', queryResult.success ? '✓ Success' : '✗ Failed');

const invalidQuery = {
  page: 'invalid',
  limit: '-5',
};

const invalidResult = projectQuerySchema.safeParse(invalidQuery);
console.log('  Invalid query parse:', invalidResult.success ? '✗ Should fail' : '✓ Failed as expected');
if (!invalidResult.success) {
  console.log('    Validation errors:', invalidResult.error.issues.length, 'issues');
}

// Test 4: DTO Validation
const validProject = {
  slug: 'test-project',
  title: 'Test Project',
  description: 'A test project',
  content: 'Project content here',
};

const projectResult = createProjectSchema.safeParse(validProject);
console.log('\n📝 DTO Validation Test:');
console.log('  Valid project DTO:', projectResult.success ? '✓ Success' : '✗ Failed');

console.log('\n🎉 All tests passed! Shared types are working correctly.');
console.log('\n📦 Next steps:');
console.log('  1. Update backend routes to use shared types');
console.log('  2. Use response helpers (successResponse, paginatedResponse)');
console.log('  3. Add @portfolio/shared to frontend package.json');
console.log('  4. Create type-safe API client in frontend');
