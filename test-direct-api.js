// Test persistence by directly calling the API to create nested items
const axios = require('axios');

const API_URL = 'http://localhost:8001/api/v1';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'TestPass123!';

async function testNestedPersistence() {
  console.log('🔵 Step 1: Register user');
  const registerResponse = await axios.post(`${API_URL}/auth/register`, {
    email: testEmail,
    password: testPassword,
    displayName: 'Test User'
  });
  
  console.log('Register response:', registerResponse.data);
  const { accessToken, user } = registerResponse.data;
  console.log('✅ User registered:', user.email);
  
  // Set auth header for all subsequent requests
  const authHeaders = {
    headers: { Authorization: `Bearer ${accessToken}` }
  };
  
  console.log('🔵 Step 2: Get user outlines');
  let outlinesResponse = await axios.get(`${API_URL}/outlines`, authHeaders);
  
  // If no outlines exist, create one
  let outline;
  if (!outlinesResponse.data || outlinesResponse.data.length === 0) {
    console.log('No outlines found, creating one...');
    const createOutlineResponse = await axios.post(`${API_URL}/outlines`, {
      title: 'Test Outline',
      userId: user.id
    }, authHeaders);
    outline = createOutlineResponse.data;
  } else {
    outline = outlinesResponse.data[0];
  }
  console.log('✅ Got outline:', outline.id);
  
  console.log('🔵 Step 3: Create nested items structure');
  
  // Create main item
  const mainItem = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'MAIN TASK 1', parentId: null, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created main item:', mainItem.data.id);
  
  // Create first sub-item
  const subItem1 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.1', parentId: mainItem.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-item 1.1:', subItem1.data.id);
  
  // Create second sub-item
  const subItem2 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.2', parentId: mainItem.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-item 1.2:', subItem2.data.id);
  
  // Create sub-sub-items under subItem2
  const subSubItem1 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-sub-task 1.2.1', parentId: subItem2.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-sub-item 1.2.1:', subSubItem1.data.id);
  
  const subSubItem2 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-sub-task 1.2.2', parentId: subItem2.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-sub-item 1.2.2:', subSubItem2.data.id);
  
  // Create third sub-item under main
  const subItem3 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.3', parentId: mainItem.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-item 1.3:', subItem3.data.id);
  
  console.log('\n🔵 Step 4: Get all items to verify structure');
  const itemsResponse = await axios.get(
    `${API_URL}/outlines/${outline.id}/items`,
    authHeaders
  );
  
  console.log('📝 Items created:', itemsResponse.data.length);
  itemsResponse.data.forEach(item => {
    const indent = item.parentId ? (item.parentId === mainItem.data.id ? '  ' : '    ') : '';
    console.log(`${indent}- ${item.content} (parent: ${item.parentId || 'root'})`);
  });
  
  console.log('\n🔵 Step 5: Simulate logout/login by creating new session');
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: testEmail,
    password: testPassword
  });
  
  const newToken = loginResponse.data.accessToken;
  const newAuthHeaders = {
    headers: { Authorization: `Bearer ${newToken}` }
  };
  
  console.log('✅ Logged in with new session');
  
  console.log('\n🔵 Step 6: Get items again to verify persistence');
  const itemsAfterLogin = await axios.get(
    `${API_URL}/outlines/${outline.id}/items`,
    newAuthHeaders
  );
  
  console.log('📝 Items after re-login:', itemsAfterLogin.data.length);
  
  // Build a map of items by ID for hierarchy checking
  const itemMap = {};
  itemsAfterLogin.data.forEach(item => {
    itemMap[item.id] = item;
  });
  
  // Verify each expected item exists
  const expectedItems = [
    { content: 'MAIN TASK 1', parentId: null },
    { content: 'Sub-task 1.1', shouldHaveParent: true },
    { content: 'Sub-task 1.2', shouldHaveParent: true },
    { content: 'Sub-sub-task 1.2.1', shouldHaveParent: true },
    { content: 'Sub-sub-task 1.2.2', shouldHaveParent: true },
    { content: 'Sub-task 1.3', shouldHaveParent: true }
  ];
  
  console.log('\n🔍 VERIFICATION RESULTS:');
  let allFound = true;
  
  expectedItems.forEach(expected => {
    const found = itemsAfterLogin.data.find(item => item.content === expected.content);
    if (found) {
      const parentCheck = expected.shouldHaveParent ? (found.parentId ? '✅' : '❌') : '✅';
      console.log(`✅ ${expected.content} - Found (Parent: ${parentCheck})`);
      
      // Check hierarchy
      if (found.parentId && itemMap[found.parentId]) {
        console.log(`   └─ Parent: "${itemMap[found.parentId].content}"`);
      }
    } else {
      console.log(`❌ ${expected.content} - NOT FOUND`);
      allFound = false;
    }
  });
  
  if (allFound && itemsAfterLogin.data.length === 6) {
    console.log('\n✅✅✅ SUCCESS: All nested items persisted with correct hierarchy!');
  } else {
    console.log('\n❌❌❌ FAILURE: Some items were lost or hierarchy broken!');
  }
}

// Run the test
testNestedPersistence().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});