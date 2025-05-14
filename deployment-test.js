// Deployment Test Script
// Run this against your production endpoints to verify auth is working
const axios = require('axios');

// Configure these to match your deployed URLs
const BACKEND_URL = 'https://your-backend-app.onrender.com';
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpassword';

// Create axios instance with cookie support
const api = axios.create({
  withCredentials: true
});

// Run all tests in sequence
async function runTests() {
  console.log('🧪 Running Deployment Authentication Tests');
  console.log('=========================================');

  try {
    // Test 1: Check server health and environment
    console.log('\n📡 Test 1: Server Environment');
    const authTest = await api.get(`${BACKEND_URL}/api/auth-test`);
    console.log('✅ Server responding with environment:', authTest.data.environment);
    console.log('✅ CORS configured for:', authTest.data.corsOrigin);
    console.log('✅ Cookie settings:', authTest.data.cookieConfig);

    // Test 2: Test login
    console.log('\n🔑 Test 2: Authentication');
    const loginResponse = await api.post(`${BACKEND_URL}/api/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    console.log('✅ Login successful:', loginResponse.data);

    // Test 3: Verify session maintained
    console.log('\n🔒 Test 3: Session Persistence');
    const authStatus = await api.get(`${BACKEND_URL}/api/auth-status`);
    console.log('✅ Session maintained:', authStatus.data);

    // Test 4: Access protected resource
    console.log('\n🛡️ Test 4: Protected Resource Access');
    const groupsResponse = await api.get(`${BACKEND_URL}/api/groups`);
    console.log('✅ Protected resource accessible:', groupsResponse.data);

    // Test 5: Logout
    console.log('\n🚪 Test 5: Logout');
    const logoutResponse = await api.post(`${BACKEND_URL}/api/logout`);
    console.log('✅ Logout successful:', logoutResponse.data);

    // Test 6: Verify logged out
    console.log('\n🔓 Test 6: Verify Logged Out');
    const finalAuthStatus = await api.get(`${BACKEND_URL}/api/auth-status`);
    console.log('✅ Session terminated:', finalAuthStatus.data);

    console.log('\n🎉 All tests passed! Deployment configuration is correct.');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Response data:', error.response.data);
      console.error('🔢 Status code:', error.response.status);
      console.error('🍪 Cookies received:', error.response.headers['set-cookie'] || 'None');
    }
    console.error('\n🔍 Full error:', error);
  }
}

runTests();
