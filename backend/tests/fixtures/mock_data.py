"""Test fixtures matching frontend mock data exactly"""
from datetime import datetime
from typing import Dict, Any

# Test user matching mockAuth.ts initTestUser()
TEST_USER = {
    "id": "user_test",
    "email": "test@brainflowy.com",
    "name": "Test User",
    "settings": {
        "theme": "light",
        "fontSize": 16,
        "autoSave": True,
        "shortcuts": {}
    },
    "createdAt": datetime.utcnow().isoformat(),
    "updatedAt": datetime.utcnow().isoformat()
}

TEST_USER_PASSWORD = "password123"

# Sample outline matching mockOutlines.ts initSampleData()
SAMPLE_OUTLINE = {
    "id": "outline_1",
    "title": "Welcome to BrainFlowy",
    "userId": "user_test",
    "createdAt": datetime.utcnow().isoformat(),
    "updatedAt": datetime.utcnow().isoformat(),
    "itemCount": 6
}

SAMPLE_OUTLINE_ITEMS = [
    {
        "id": "item_1",
        "content": "Getting Started with BrainFlowy",
        "parentId": None,
        "outlineId": "outline_1",
        "order": 0,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    },
    {
        "id": "item_2",
        "content": "Create hierarchical outlines",
        "parentId": "item_1",
        "outlineId": "outline_1",
        "order": 0,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    },
    {
        "id": "item_3",
        "content": "Use voice input for quick capture",
        "parentId": "item_1",
        "outlineId": "outline_1",
        "order": 1,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    },
    {
        "id": "item_4",
        "content": "Key Features",
        "parentId": None,
        "outlineId": "outline_1",
        "order": 1,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    },
    {
        "id": "item_5",
        "content": "Mobile-first design with 44px touch targets",
        "parentId": "item_4",
        "outlineId": "outline_1",
        "order": 0,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    },
    {
        "id": "item_6",
        "content": "Swipe gestures for indent/outdent",
        "parentId": "item_4",
        "outlineId": "outline_1",
        "order": 1,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
]

# Sample voice transcription responses from mockVoice.ts
SAMPLE_TRANSCRIPTIONS = [
    "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team",
    "The main features we need are user authentication, real-time sync, and voice input with AI structuring",
    "Meeting notes: discussed quarterly goals, need to increase revenue by 20%, focus on customer retention",
    "Shopping list: milk, bread, eggs, coffee, fruits including apples and bananas, vegetables"
]

# Expected structured output for voice input
SAMPLE_STRUCTURED_OUTPUT = {
    "original": "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team",
    "structured": [
        {"content": "Today I need to", "level": 0},
        {"content": "finish the project proposal", "level": 1},
        {"content": "review the budget documents", "level": 1},
        {"content": "and schedule a meeting with the team", "level": 1}
    ],
    "suggestions": ["Consider breaking this into separate categories"]
}

def get_auth_response(user: Dict[str, Any]) -> Dict[str, Any]:
    """Generate auth response matching mockAuth.ts format"""
    return {
        "user": user,
        "accessToken": f"mock_access_token_{datetime.utcnow().timestamp()}",
        "refreshToken": f"mock_refresh_token_{datetime.utcnow().timestamp()}"
    }

def build_item_tree(items: list) -> list:
    """Build hierarchical tree from flat items list - matches mockOutlines.ts logic"""
    item_map = {item["id"]: {**item, "children": []} for item in items}
    root_items = []
    
    for item in items:
        if item["parentId"]:
            parent = item_map.get(item["parentId"])
            if parent:
                parent["children"].append(item_map[item["id"]])
        else:
            root_items.append(item_map[item["id"]])
    
    # Sort by order
    def sort_by_order(items_list):
        items_list.sort(key=lambda x: x["order"])
        for item in items_list:
            if item["children"]:
                sort_by_order(item["children"])
    
    sort_by_order(root_items)
    return root_items