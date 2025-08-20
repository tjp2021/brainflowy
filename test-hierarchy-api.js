#!/usr/bin/env node

// Test hierarchy persistence via API calls

const API_BASE = 'http://localhost:8001/api/v1';
let token = null;
let userId = null;
let outlineId = null;

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function test() {
  console.log('🚀 Starting hierarchy persistence test...\n');
  
  // 1. Register a test user
  const timestamp = Date.now();
  const email = `test${timestamp}@test.com`;
  console.log(`1. Registering user: ${email}`);
  
  const registerData = await apiCall('POST', '/auth/register', {
    email,
    password: 'TestPass123!',
    displayName: 'Test User',
  });
  
  token = registerData.accessToken;
  userId = registerData.user.id;
  console.log(`   ✅ User registered: ${userId}\n`);
  
  // 2. Create an outline
  console.log('2. Creating outline...');
  const outlineData = await apiCall('POST', '/outlines', {
    title: 'Test Hierarchy Outline',
    userId: userId,
  });
  
  outlineId = outlineData.id;
  console.log(`   ✅ Outline created: ${outlineId}\n`);
  
  // 3. Create hierarchical items
  console.log('3. Creating hierarchical items...');
  
  // Create root item
  const item1 = await apiCall('POST', `/outlines/${outlineId}/items`, {
    content: 'Root Item 1',
    parentId: null,
  });
  console.log(`   ✅ Created root item: ${item1.id}`);
  
  // Create child of root
  const item2 = await apiCall('POST', `/outlines/${outlineId}/items`, {
    content: 'Child of Root 1',
    parentId: item1.id,
  });
  console.log(`   ✅ Created child item: ${item2.id} (parent: ${item1.id})`);
  
  // Create grandchild
  const item3 = await apiCall('POST', `/outlines/${outlineId}/items`, {
    content: 'Grandchild',
    parentId: item2.id,
  });
  console.log(`   ✅ Created grandchild: ${item3.id} (parent: ${item2.id})`);
  
  // Create another root item
  const item4 = await apiCall('POST', `/outlines/${outlineId}/items`, {
    content: 'Root Item 2',
    parentId: null,
  });
  console.log(`   ✅ Created root item: ${item4.id}`);
  
  // Create child of second root
  const item5 = await apiCall('POST', `/outlines/${outlineId}/items`, {
    content: 'Child of Root 2',
    parentId: item4.id,
  });
  console.log(`   ✅ Created child item: ${item5.id} (parent: ${item4.id})\n`);
  
  // 4. Retrieve and verify hierarchy
  console.log('4. Retrieving items to verify hierarchy...');
  const items = await apiCall('GET', `/outlines/${outlineId}/items`);
  
  console.log('\n📊 Retrieved hierarchy structure:');
  
  function printTree(items, indent = '') {
    for (const item of items) {
      console.log(`${indent}├─ ${item.content} (id: ${item.id}, parentId: ${item.parentId || 'null'})`);
      if (item.children && item.children.length > 0) {
        printTree(item.children, indent + '│  ');
      }
    }
  }
  
  printTree(items);
  
  // 5. Test indenting (moving an item to be child of another)
  console.log('\n5. Testing indent operation (moving Root Item 2 under Root Item 1)...');
  await apiCall('PUT', `/outlines/${outlineId}/items/${item4.id}`, {
    parentId: item1.id,
  });
  console.log('   ✅ Updated parentId\n');
  
  // 6. Retrieve again to verify update
  console.log('6. Retrieving items after indent operation...');
  const updatedItems = await apiCall('GET', `/outlines/${outlineId}/items`);
  
  console.log('\n📊 Updated hierarchy structure:');
  printTree(updatedItems);
  
  // 7. Verify persistence by simulating page reload
  console.log('\n7. Simulating page reload - retrieving items again...');
  const reloadedItems = await apiCall('GET', `/outlines/${outlineId}/items`);
  
  console.log('\n📊 Hierarchy after "reload":');
  printTree(reloadedItems);
  
  // Validate structure
  console.log('\n🔍 Validating hierarchy structure...');
  
  let validationPassed = true;
  
  // Check that we have the expected root items
  const rootItems = reloadedItems.filter(item => !item.parentId);
  if (rootItems.length !== 1) {
    console.log(`   ❌ Expected 1 root item, found ${rootItems.length}`);
    validationPassed = false;
  } else {
    console.log(`   ✅ Found 1 root item as expected`);
  }
  
  // Check the nested structure
  function countItems(items) {
    let count = 0;
    for (const item of items) {
      count++;
      if (item.children) {
        count += countItems(item.children);
      }
    }
    return count;
  }
  
  const totalCount = countItems(reloadedItems);
  if (totalCount !== 5) {
    console.log(`   ❌ Expected 5 total items, found ${totalCount}`);
    validationPassed = false;
  } else {
    console.log(`   ✅ Found 5 total items as expected`);
  }
  
  // Check specific nesting
  const root = reloadedItems[0];
  if (root && root.children) {
    const childCount = root.children.length;
    if (childCount < 2) {
      console.log(`   ❌ Root should have at least 2 children, found ${childCount}`);
      validationPassed = false;
    } else {
      console.log(`   ✅ Root has ${childCount} children as expected`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (validationPassed) {
    console.log('✅ ALL TESTS PASSED! Hierarchy persistence is working correctly.');
  } else {
    console.log('❌ SOME TESTS FAILED! Check the hierarchy implementation.');
  }
  console.log('='.repeat(50));
}

// Run the test
test().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});