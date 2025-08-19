import json
import urllib.request
from datetime import datetime

# First, create a user and get their token
timestamp = int(datetime.now().timestamp() * 1000)
user_data = {
    'email': f'test{timestamp}@example.com',
    'password': 'Test123!',
    'displayName': 'Test User'
}

print("1. Registering user...")
req = urllib.request.Request(
    'http://localhost:8001/api/v1/auth/register',
    data=json.dumps(user_data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as response:
    auth_result = json.loads(response.read())
    token = auth_result['accessToken']
    user_id = auth_result['user']['id']
    print(f"   User created: {user_id}")
    print(f"   Token: {token[:20]}...")

# Now create an outline
print("\n2. Creating outline...")
outline_data = {
    'title': 'Test Outline',
    'userId': user_id
}

req = urllib.request.Request(
    'http://localhost:8001/api/v1/outlines',
    data=json.dumps(outline_data).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

with urllib.request.urlopen(req) as response:
    outline_result = json.loads(response.read())
    outline_id = outline_result['id']
    print(f"   Outline created: {outline_id}")

# Get user's outlines
print("\n3. Getting user's outlines...")
req = urllib.request.Request(
    'http://localhost:8001/api/v1/outlines',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

with urllib.request.urlopen(req) as response:
    outlines = json.loads(response.read())
    print(f"   Found {len(outlines)} outline(s)")
    for o in outlines:
        print(f"   - {o['id']}: {o['title']}")

# Try again with userId parameter
print("\n4. Getting outlines with userId param...")
req = urllib.request.Request(
    f'http://localhost:8001/api/v1/outlines?userId={user_id}',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

with urllib.request.urlopen(req) as response:
    outlines = json.loads(response.read())
    print(f"   Found {len(outlines)} outline(s)")
    for o in outlines:
        print(f"   - {o['id']}: {o['title']}")