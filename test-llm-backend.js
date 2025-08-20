const fetch = require('node-fetch');

async function testLLMEndpoint() {
  const baseUrl = 'http://localhost:8001/api/v1';
  
  try {
    // 1. Register a test user
    console.log('1. Registering test user...');
    const timestamp = Date.now();
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${timestamp}@example.com`,
        password: 'TestPass123!',
        displayName: 'Test User'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.detail}`);
    }
    
    const accessToken = registerData.accessToken || registerData.access_token;
    console.log('Got access token');
    
    // 2. Create an outline
    console.log('\n2. Creating outline...');
    const outlineResponse = await fetch(`${baseUrl}/outlines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Test Brainlift'
      })
    });
    
    const outlineData = await outlineResponse.json();
    console.log('Outline created:', outlineData);
    const outlineId = outlineData.id;
    
    // 3. Test CREATE action
    console.log('\n3. Testing CREATE action...');
    const createResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'create',
        parentId: null,
        section: 'spov',
        userPrompt: 'Create an SPOV about customer retention'
      })
    });
    
    const createData = await createResponse.json();
    console.log('CREATE response:', JSON.stringify(createData, null, 2));
    
    // 4. Test EDIT action
    console.log('\n4. Testing EDIT action...');
    const editResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'edit',
        targetId: 'test-item-id',
        section: 'purpose',
        userPrompt: 'Make this purpose about pricing strategy'
      })
    });
    
    const editData = await editResponse.json();
    console.log('EDIT response:', JSON.stringify(editData, null, 2));
    
    // 5. Test RESEARCH action
    console.log('\n5. Testing RESEARCH action...');
    const researchResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'research',
        section: 'general',
        userPrompt: 'Research SaaS pricing models'
      })
    });
    
    const researchData = await researchResponse.json();
    console.log('RESEARCH response:', JSON.stringify(researchData, null, 2));
    
    // 6. Test suggestions endpoint
    console.log('\n6. Testing suggestions endpoint...');
    const suggestionsResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action/suggestions?section=spov`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const suggestionsData = await suggestionsResponse.json();
    console.log('Suggestions:', JSON.stringify(suggestionsData, null, 2));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      const text = await error.response.text();
      console.error('Response body:', text);
    }
  }
}

testLLMEndpoint();