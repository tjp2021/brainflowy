const fetch = require('node-fetch');

async function testRegister() {
  const timestamp = Date.now();
  const body = {
    email: `test${timestamp}@example.com`,
    password: 'Test123!',
    displayName: 'Test User'
  };
  
  console.log('Sending:', JSON.stringify(body, null, 2));
  
  const response = await fetch('http://localhost:8001/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  console.log('Response:', response.status);
  console.log('Data:', JSON.stringify(data, null, 2));
}

testRegister().catch(console.error);