import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Test data
const businessData = {
  businessName: "Test Business Corp",
  email: "test@example.com",
  phone: "+1234567890",
  address: "123 Test Street, Test City, TC 12345",
  businessType: "Technology"
};

const searchData = {
  searchQuery: "best restaurants in downtown",
  userId: "user123",
  resultsCount: 12
};

async function testBusinessRegistration() {
  try {
    console.log('Testing Business Registration...');
    const response = await axios.post(`${API_BASE_URL}/api/business-registered`, businessData);
    console.log('✅ Business Registration Success:', response.data);
    return response.data.businessId;
  } catch (error) {
    console.error('❌ Business Registration Failed:', error.response?.data || error.message);
  }
}

async function testSearchLogging() {
  try {
    console.log('\nTesting Search Logging...');
    const response = await axios.post(`${API_BASE_URL}/api/search-logs`, searchData);
    console.log('✅ Search Logging Success:', response.data);
  } catch (error) {
    console.error('❌ Search Logging Failed:', error.response?.data || error.message);
  }
}

async function testHealthCheck() {
  try {
    console.log('\nTesting Health Check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check Success:', response.data);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  await testHealthCheck();
  await testBusinessRegistration();
  await testSearchLogging();
  
  console.log('\n✨ Tests completed!');
  console.log('\nCheck the following:');
  console.log('- Email service console for email sending status');
  console.log('- search-logs/logs/search-logs.csv for search log entries');
  console.log('- Kafka UI at http://localhost:8080 for topic messages');
}

runTests().catch(console.error);
