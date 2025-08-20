// Debug script to check what's in the mock database
const axios = require('axios');

const API_URL = 'http://localhost:8001/api/v1';
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'TestPass123!';

async function debugMockDb() {
  console.log('🔵 Step 1: Register user');
  const registerResponse = await axios.post(`${API_URL}/auth/register`, {
    email: testEmail,
    password: testPassword,
    displayName: 'Test User'
  });
  
  const { accessToken, user } = registerResponse.data;
  console.log('✅ User registered:', user.email);
  
  const authHeaders = {
    headers: { Authorization: `Bearer ${accessToken}` }
  };
  
  console.log('🔵 Step 2: Create outline');
  const createOutlineResponse = await axios.post(`${API_URL}/outlines`, {
    title: 'Debug Outline',
    userId: user.id
  }, authHeaders);
  const outline = createOutlineResponse.data;
  console.log('✅ Created outline:', outline.id);
  
  console.log('🔵 Step 3: Create nested items');
  
  // Create main item
  const mainItem = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'MAIN', parentId: null, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created main item:', mainItem.data.id);
  
  // Create sub-item
  const subItem = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'SUB', parentId: mainItem.data.id, style: 'normal' },
    authHeaders
  );
  console.log('✅ Created sub-item:', subItem.data.id, 'with parentId:', mainItem.data.id);
  
  console.log('\n🔵 Step 4: Get raw outline document');
  // Get the raw outline to see what's stored
  const outlineResponse = await axios.get(
    `${API_URL}/outlines/${outline.id}`,
    authHeaders
  );
  
  console.log('📝 Outline metadata:', {
    id: outlineResponse.data.id,
    title: outlineResponse.data.title,
    itemCount: outlineResponse.data.itemCount
  });
  
  console.log('\n🔵 Step 5: Get items through API');
  const itemsResponse = await axios.get(
    `${API_URL}/outlines/${outline.id}/items`,
    authHeaders
  );
  
  console.log('📝 Items returned by API:', itemsResponse.data.length);
  itemsResponse.data.forEach(item => {
    console.log(`- ${item.content} (id: ${item.id}, parentId: ${item.parentId})`);
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        console.log(`  - ${child.content} (id: ${child.id}, parentId: ${child.parentId})`);
      });
    }
  });
  
  // Let's also check what the outline endpoint directly returns
  console.log('\n🔵 Step 6: Check what build_item_tree should be getting');
  console.log('If items are saved correctly, the outline document should have:');
  console.log('- An items array with 2 items');
  console.log('- First item: MAIN with parentId: null');
  console.log('- Second item: SUB with parentId:', mainItem.data.id);
}

debugMockDb().catch(err => {
  console.error('Debug failed:', err.response?.data || err.message);
  process.exit(1);
});