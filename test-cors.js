#!/usr/bin/env node

/**
 * CORS Configuration Test Script
 * 
 * Tests CORS setup between Vite frontend and Node.js backend
 * 
 * Usage:
 *   node test-cors.js
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

console.log('\n🧪 CORS Configuration Test\n');
console.log(`Frontend: ${FRONTEND_URL}`);
console.log(`Backend:  ${BACKEND_URL}\n`);

// Test 1: Simple GET request
async function testSimpleRequest() {
  console.log('📝 Test 1: Simple GET Request');
  
  try {
    const response = await fetch(`${BACKEND_URL}/v1/health`, {
      headers: {
        'Origin': FRONTEND_URL,
      },
    });
    
    const corsOrigin = response.headers.get('access-control-allow-origin');
    const corsCredentials = response.headers.get('access-control-allow-credentials');
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsOrigin || 'MISSING ❌'}`);
    console.log(`   Access-Control-Allow-Credentials: ${corsCredentials || 'MISSING ❌'}`);
    
    if (corsOrigin === FRONTEND_URL) {
      console.log('   ✅ CORS origin matches frontend\n');
      return true;
    } else {
      console.log(`   ❌ CORS origin mismatch! Expected: ${FRONTEND_URL}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

// Test 2: Preflight request
async function testPreflightRequest() {
  console.log('📝 Test 2: Preflight OPTIONS Request');
  
  try {
    const response = await fetch(`${BACKEND_URL}/v1/projects`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });
    
    const corsOrigin = response.headers.get('access-control-allow-origin');
    const corsMethods = response.headers.get('access-control-allow-methods');
    const corsHeaders = response.headers.get('access-control-allow-headers');
    const corsMaxAge = response.headers.get('access-control-max-age');
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsOrigin || 'MISSING ❌'}`);
    console.log(`   Access-Control-Allow-Methods: ${corsMethods || 'MISSING ❌'}`);
    console.log(`   Access-Control-Allow-Headers: ${corsHeaders || 'MISSING ❌'}`);
    console.log(`   Access-Control-Max-Age: ${corsMaxAge || 'MISSING ❌'}`);
    
    if (response.status === 204 || response.status === 200) {
      console.log('   ✅ Preflight request successful\n');
      return true;
    } else {
      console.log(`   ❌ Preflight failed with status ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

// Test 3: Credentials request
async function testCredentialsRequest() {
  console.log('📝 Test 3: Request with Credentials');
  
  try {
    const response = await fetch(`${BACKEND_URL}/v1/health`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Cookie': 'test=value',
      },
      credentials: 'include',
    });
    
    const corsCredentials = response.headers.get('access-control-allow-credentials');
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Credentials: ${corsCredentials || 'MISSING ❌'}`);
    
    if (corsCredentials === 'true') {
      console.log('   ✅ Credentials allowed\n');
      return true;
    } else {
      console.log('   ❌ Credentials not allowed\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

// Test 4: Wrong origin rejection
async function testWrongOrigin() {
  console.log('📝 Test 4: Wrong Origin Rejection');
  
  try {
    const response = await fetch(`${BACKEND_URL}/v1/health`, {
      headers: {
        'Origin': 'http://evil-site.com',
      },
    });
    
    const corsOrigin = response.headers.get('access-control-allow-origin');
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsOrigin || 'NONE'}`);
    
    if (!corsOrigin || corsOrigin !== 'http://evil-site.com') {
      console.log('   ✅ Wrong origin correctly rejected\n');
      return true;
    } else {
      console.log('   ⚠️  WARNING: Any origin allowed! Check security.\n');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

// Test 5: Vite proxy check (only works when running from frontend)
async function testViteProxy() {
  console.log('📝 Test 5: Vite Proxy (when running frontend)');
  console.log('   ℹ️  To test proxy, run this from your browser console:');
  console.log('   fetch("/api/v1/health").then(r => r.json()).then(console.log)');
  console.log('   ✅ If successful, Vite proxy is working\n');
  return true;
}

// Run all tests
async function runTests() {
  const results = [];
  
  results.push(await testSimpleRequest());
  results.push(await testPreflightRequest());
  results.push(await testCredentialsRequest());
  results.push(await testWrongOrigin());
  results.push(await testViteProxy());
  
  const passed = results.filter(r => r === true).length;
  const total = results.length - 1; // Exclude proxy test (manual)
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('✅ CORS configuration is correct!\n');
    console.log('Next steps:');
    console.log('1. Start backend:  cd portfolio-api && npm run dev');
    console.log('2. Start frontend: cd portfolio-ui && npm run dev');
    console.log('3. Open browser:   http://localhost:8080\n');
  } else {
    console.log('❌ CORS configuration needs fixes:\n');
    console.log('1. Check backend .env file:');
    console.log(`   CORS_ORIGIN=${FRONTEND_URL}`);
    console.log('2. Check backend CORS middleware is enabled');
    console.log('3. Restart backend server after changes\n');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/health`);
    if (response.ok) {
      console.log('✅ Backend is running\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running!\n');
    console.log('Start it with: cd portfolio-api && npm run dev\n');
    process.exit(1);
  }
}

// Main
checkBackend().then(() => runTests());
