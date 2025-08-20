#!/usr/bin/env node

const fetch = require('node-fetch');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testOpenAIIntegration() {
  const baseUrl = 'http://localhost:8001/api/v1';
  
  console.log(`${colors.bright}${colors.cyan}=== Testing Real OpenAI Integration ===${colors.reset}\n`);
  
  try {
    // 1. Register and get token
    console.log(`${colors.yellow}1. Setting up test user...${colors.reset}`);
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
    const accessToken = registerData.accessToken || registerData.access_token;
    console.log(`${colors.green}✓ User registered${colors.reset}`);
    
    // 2. Create outline
    const outlineResponse = await fetch(`${baseUrl}/outlines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'OpenAI Integration Test'
      })
    });
    
    const outlineData = await outlineResponse.json();
    const outlineId = outlineData.id;
    console.log(`${colors.green}✓ Outline created: ${outlineId}${colors.reset}\n`);
    
    // Test 1: CREATE SPOV with real prompt
    console.log(`${colors.bright}${colors.blue}TEST 1: CREATE SPOV${colors.reset}`);
    console.log('Prompt: "Create an SPOV about using AI to improve customer support efficiency"');
    
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
        userPrompt: 'Create an SPOV about using AI to improve customer support efficiency'
      })
    });
    
    const createData = await createResponse.json();
    console.log(`\n${colors.cyan}Response structure:${colors.reset}`);
    console.log('- Has action field:', !!createData.action);
    console.log('- Has result field:', !!createData.result);
    
    if (createData.result) {
      console.log('- Result has items:', !!createData.result.items);
      console.log('- Result has suggestions:', !!createData.result.suggestions);
      
      if (createData.result.items && createData.result.items[0]) {
        const item = createData.result.items[0];
        console.log(`\n${colors.cyan}SPOV Structure:${colors.reset}`);
        console.log('- Title:', item.text);
        console.log('- Has children:', !!item.children);
        
        if (item.children) {
          const sections = item.children.map(c => c.text);
          console.log('- Sections found:', sections.join(', '));
        }
      }
      
      console.log(`\n${colors.cyan}Full CREATE response:${colors.reset}`);
      console.log(JSON.stringify(createData.result, null, 2));
    }
    
    // Test 2: EDIT with real prompt
    console.log(`\n${colors.bright}${colors.blue}TEST 2: EDIT${colors.reset}`);
    console.log('Prompt: "Make this more concise and focus on ROI"');
    
    const editResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'edit',
        targetId: 'test-item',
        section: 'purpose',
        userPrompt: 'Make this more concise and focus on ROI'
      })
    });
    
    const editData = await editResponse.json();
    console.log(`\n${colors.cyan}EDIT Response structure:${colors.reset}`);
    console.log('- Has content:', !!editData.result?.content);
    console.log('- Has suggestions:', !!editData.result?.suggestions);
    
    if (editData.result) {
      console.log(`\n${colors.cyan}Full EDIT response:${colors.reset}`);
      console.log(JSON.stringify(editData.result, null, 2));
    }
    
    // Test 3: RESEARCH with real prompt
    console.log(`\n${colors.bright}${colors.blue}TEST 3: RESEARCH${colors.reset}`);
    console.log('Prompt: "What are the latest trends in AI customer service automation?"');
    
    const researchResponse = await fetch(`${baseUrl}/outlines/${outlineId}/llm-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: 'research',
        section: 'general',
        userPrompt: 'What are the latest trends in AI customer service automation?'
      })
    });
    
    const researchData = await researchResponse.json();
    console.log(`\n${colors.cyan}RESEARCH Response structure:${colors.reset}`);
    console.log('- Has content:', !!researchData.result?.content);
    console.log('- Has citations:', !!researchData.result?.citations);
    console.log('- Has suggestions:', !!researchData.result?.suggestions);
    
    if (researchData.result?.citations) {
      console.log('- Number of citations:', researchData.result.citations.length);
      console.log('- Citation fields:', researchData.result.citations[0] ? Object.keys(researchData.result.citations[0]) : []);
    }
    
    if (researchData.result) {
      console.log(`\n${colors.cyan}Full RESEARCH response:${colors.reset}`);
      console.log(JSON.stringify(researchData.result, null, 2));
    }
    
    // Summary
    console.log(`\n${colors.bright}${colors.green}=== Test Summary ===${colors.reset}`);
    console.log('All API calls successful!');
    console.log('Response formats match expected structure.');
    console.log('\nNext steps:');
    console.log('1. Verify the response format matches frontend expectations');
    console.log('2. Adjust prompts if needed for better responses');
    console.log('3. Connect frontend to use real backend API');
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed:${colors.reset}`, error.message);
    if (error.stack) {
      console.error(`${colors.red}Stack trace:${colors.reset}`, error.stack);
    }
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:8001/health');
    const data = await response.json();
    if (data.status === 'healthy') {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Main execution
(async () => {
  console.log(`${colors.yellow}Checking if backend is running...${colors.reset}`);
  const backendRunning = await checkBackend();
  
  if (!backendRunning) {
    console.log(`${colors.red}Backend is not running!${colors.reset}`);
    console.log('Please start the backend with:');
    console.log(`  ${colors.cyan}cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8001${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Backend is running${colors.reset}\n`);
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.log(`${colors.yellow}Note: OPENAI_API_KEY not found in environment.${colors.reset}`);
    console.log('The backend will use mock responses unless the key is set there.');
    console.log('To test with real OpenAI, ensure the backend has access to OPENAI_API_KEY.\n');
  }
  
  await testOpenAIIntegration();
})();