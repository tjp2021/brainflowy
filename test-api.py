import json
import urllib.request
from datetime import datetime

timestamp = int(datetime.now().timestamp() * 1000)
data = {
    'email': f'test{timestamp}@example.com',
    'password': 'Test123!',
    'displayName': 'Test User'
}

print(f"Testing registration with: {json.dumps(data, indent=2)}")

req = urllib.request.Request(
    'http://localhost:8001/api/v1/auth/register',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        print(f"Status: {response.status}")
        print(f"Response: {json.dumps(result, indent=2)}")
except urllib.error.HTTPError as e:
    print(f"Error Status: {e.code}")
    print(f"Error: {e.read().decode()}")