// Test hierarchy persistence - CREATE, SAVE, LOGOUT, LOGIN, VERIFY
const axios = require('axios');

const API_URL = 'http://localhost:8001/api/v1';
const timestamp = Date.now();
const testEmail = `hierarchy_test_${timestamp}@example.com`;
const testPassword = 'TestPass123!';

async function testHierarchyPersistence() {
  console.log('\n🔷 HIERARCHY PERSISTENCE TEST 🔷\n');
  
  // Step 1: Register user
  console.log('1️⃣ Registering user...');
  const registerResponse = await axios.post(`${API_URL}/auth/register`, {
    email: testEmail,
    password: testPassword,
    displayName: 'Hierarchy Test'
  });
  
  const { accessToken: token1, user } = registerResponse.data;
  console.log('✅ User registered:', user.email);
  
  // Step 2: Create outline
  console.log('\n2️⃣ Creating outline...');
  const headers1 = { headers: { Authorization: `Bearer ${token1}` } };
  
  const outlineResponse = await axios.post(`${API_URL}/outlines`, {
    title: 'Hierarchy Test Outline',
    userId: user.id
  }, headers1);
  
  const outline = outlineResponse.data;
  console.log('✅ Outline created:', outline.id);
  
  // Step 3: Create hierarchical structure
  console.log('\n3️⃣ Creating hierarchical structure...');
  
  // Create MAIN TASK (root level)
  const mainTask = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'MAIN TASK', parentId: null, style: 'header' },
    headers1
  );
  console.log('✅ Created: MAIN TASK (root)');
  
  // Create Sub-task 1.1 (child of MAIN)
  const sub11 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.1', parentId: mainTask.data.id, style: 'normal' },
    headers1
  );
  console.log('✅ Created: Sub-task 1.1 (→ MAIN TASK)');
  
  // Create Sub-task 1.2 (child of MAIN)
  const sub12 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.2', parentId: mainTask.data.id, style: 'normal' },
    headers1
  );
  console.log('✅ Created: Sub-task 1.2 (→ MAIN TASK)');
  
  // Create Sub-sub-task 1.2.1 (child of 1.2)
  const subsub121 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-sub-task 1.2.1', parentId: sub12.data.id, style: 'normal' },
    headers1
  );
  console.log('✅ Created: Sub-sub-task 1.2.1 (→ Sub-task 1.2)');
  
  // Create Sub-sub-task 1.2.2 (child of 1.2)
  const subsub122 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-sub-task 1.2.2', parentId: sub12.data.id, style: 'normal' },
    headers1
  );
  console.log('✅ Created: Sub-sub-task 1.2.2 (→ Sub-task 1.2)');
  
  // Create Sub-task 1.3 (child of MAIN)
  const sub13 = await axios.post(
    `${API_URL}/outlines/${outline.id}/items`,
    { content: 'Sub-task 1.3', parentId: mainTask.data.id, style: 'normal' },
    headers1
  );
  console.log('✅ Created: Sub-task 1.3 (→ MAIN TASK)');
  
  // Step 4: Verify structure BEFORE logout
  console.log('\n4️⃣ Verifying structure BEFORE logout...');
  const itemsBefore = await axios.get(
    `${API_URL}/outlines/${outline.id}/items`,
    headers1
  );
  
  console.log('📊 Structure returned:');
  const printStructure = (items, indent = '') => {
    items.forEach(item => {
      console.log(`${indent}${item.content} [id: ${item.id}, parent: ${item.parentId || 'root'}]`);
      if (item.children && item.children.length > 0) {
        printStructure(item.children, indent + '  ');
      }
    });
  };
  
  printStructure(itemsBefore.data);
  
  // Verify counts
  const countItems = (items) => {
    let count = items.length;
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        count += countItems(item.children);
      }
    });
    return count;
  };
  
  const totalBefore = countItems(itemsBefore.data);
  console.log(`\n📈 Total items in hierarchy: ${totalBefore}`);
  
  // Step 5: Logout and login again
  console.log('\n5️⃣ Simulating logout/login...');
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: testEmail,
    password: testPassword
  });
  
  const { accessToken: token2 } = loginResponse.data;
  const headers2 = { headers: { Authorization: `Bearer ${token2}` } };
  console.log('✅ Logged back in with new session');
  
  // Step 6: Get items after re-login
  console.log('\n6️⃣ Verifying structure AFTER re-login...');
  const itemsAfter = await axios.get(
    `${API_URL}/outlines/${outline.id}/items`,
    headers2
  );
  
  console.log('📊 Structure returned:');
  printStructure(itemsAfter.data);
  
  const totalAfter = countItems(itemsAfter.data);
  console.log(`\n📈 Total items in hierarchy: ${totalAfter}`);
  
  // Step 7: Verify hierarchy integrity
  console.log('\n7️⃣ FINAL VERIFICATION:');
  
  // Check all expected items exist
  const findItem = (items, content) => {
    for (const item of items) {
      if (item.content === content) return item;
      if (item.children) {
        const found = findItem(item.children, content);
        if (found) return found;
      }
    }
    return null;
  };
  
  const expectedItems = [
    { content: 'MAIN TASK', shouldBeRoot: true },
    { content: 'Sub-task 1.1', parentContent: 'MAIN TASK' },
    { content: 'Sub-task 1.2', parentContent: 'MAIN TASK' },
    { content: 'Sub-sub-task 1.2.1', parentContent: 'Sub-task 1.2' },
    { content: 'Sub-sub-task 1.2.2', parentContent: 'Sub-task 1.2' },
    { content: 'Sub-task 1.3', parentContent: 'MAIN TASK' }
  ];
  
  let allCorrect = true;
  
  expectedItems.forEach(expected => {
    const item = findItem(itemsAfter.data, expected.content);
    if (!item) {
      console.log(`❌ MISSING: ${expected.content}`);
      allCorrect = false;
    } else if (expected.shouldBeRoot && item.parentId) {
      console.log(`❌ WRONG LEVEL: ${expected.content} should be root but has parent`);
      allCorrect = false;
    } else if (expected.parentContent) {
      // Check if it's in the correct parent
      const parent = findItem(itemsAfter.data, expected.parentContent);
      if (!parent) {
        console.log(`❌ PARENT MISSING: ${expected.parentContent} for ${expected.content}`);
        allCorrect = false;
      } else {
        const isChild = parent.children && parent.children.some(c => c.content === expected.content);
        if (isChild) {
          console.log(`✅ ${expected.content} → ${expected.parentContent}`);
        } else {
          console.log(`❌ WRONG PARENT: ${expected.content} not under ${expected.parentContent}`);
          allCorrect = false;
        }
      }
    } else {
      console.log(`✅ ${expected.content}`);
    }
  });
  
  // Final result
  console.log('\n' + '='.repeat(50));
  if (allCorrect && totalAfter === 6) {
    console.log('✅✅✅ HIERARCHY PERSISTENCE TEST PASSED! ✅✅✅');
    console.log('All items preserved with correct parent-child relationships');
  } else {
    console.log('❌❌❌ HIERARCHY PERSISTENCE TEST FAILED! ❌❌❌');
    console.log(`Expected 6 items, got ${totalAfter}`);
    console.log('Some items missing or hierarchy broken');
    process.exit(1);
  }
  console.log('='.repeat(50));
}

// Run the test
testHierarchyPersistence().catch(err => {
  console.error('❌ Test failed with error:', err.response?.data || err.message);
  process.exit(1);
});