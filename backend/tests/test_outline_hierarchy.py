"""Test outline hierarchy persistence and retrieval"""
import pytest
from datetime import datetime
from app.services.outline_service import OutlineService

@pytest.fixture
def outline_service():
    return OutlineService()

@pytest.fixture
def nested_items():
    """Create a nested item structure for testing"""
    return [
        # Main item (root level)
        {
            "id": "item_1",
            "content": "MAIN TASK 1",
            "parentId": None,
            "order": 0,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        # First sub-item
        {
            "id": "item_1_1",
            "content": "Sub-task 1.1",
            "parentId": "item_1",
            "order": 0,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        # Second sub-item
        {
            "id": "item_1_2",
            "content": "Sub-task 1.2",
            "parentId": "item_1",
            "order": 1,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        # Sub-sub-items under item_1_2
        {
            "id": "item_1_2_1",
            "content": "Sub-sub-task 1.2.1",
            "parentId": "item_1_2",
            "order": 0,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "id": "item_1_2_2",
            "content": "Sub-sub-task 1.2.2",
            "parentId": "item_1_2",
            "order": 1,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        # Third sub-item under main
        {
            "id": "item_1_3",
            "content": "Sub-task 1.3",
            "parentId": "item_1",
            "order": 2,
            "style": "normal",
            "formatting": None,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
    ]

def test_build_item_tree_returns_complete_hierarchy(outline_service, nested_items):
    """Test that build_item_tree returns the complete hierarchy"""
    # Build the tree
    tree = outline_service.build_item_tree(nested_items)
    
    # Should have 1 root item
    assert len(tree) == 1, f"Expected 1 root item, got {len(tree)}"
    
    root = tree[0]
    assert root["id"] == "item_1"
    assert root["content"] == "MAIN TASK 1"
    assert root["parentId"] is None
    
    # Root should have 3 children
    assert len(root["children"]) == 3, f"Expected 3 children for root, got {len(root['children'])}"
    
    # Check first child
    child1 = root["children"][0]
    assert child1["id"] == "item_1_1"
    assert child1["content"] == "Sub-task 1.1"
    assert len(child1["children"]) == 0
    
    # Check second child (which has sub-children)
    child2 = root["children"][1]
    assert child2["id"] == "item_1_2"
    assert child2["content"] == "Sub-task 1.2"
    assert len(child2["children"]) == 2, f"Expected 2 sub-children for item_1_2, got {len(child2['children'])}"
    
    # Check sub-children
    subchild1 = child2["children"][0]
    assert subchild1["id"] == "item_1_2_1"
    assert subchild1["content"] == "Sub-sub-task 1.2.1"
    
    subchild2 = child2["children"][1]
    assert subchild2["id"] == "item_1_2_2"
    assert subchild2["content"] == "Sub-sub-task 1.2.2"
    
    # Check third child
    child3 = root["children"][2]
    assert child3["id"] == "item_1_3"
    assert child3["content"] == "Sub-task 1.3"
    assert len(child3["children"]) == 0

def test_build_item_tree_handles_multiple_roots(outline_service):
    """Test that build_item_tree handles multiple root items"""
    items = [
        {"id": "root1", "content": "Root 1", "parentId": None, "order": 0},
        {"id": "root2", "content": "Root 2", "parentId": None, "order": 1},
        {"id": "child1", "content": "Child of Root 1", "parentId": "root1", "order": 0},
        {"id": "child2", "content": "Child of Root 2", "parentId": "root2", "order": 0}
    ]
    
    tree = outline_service.build_item_tree(items)
    
    assert len(tree) == 2, f"Expected 2 root items, got {len(tree)}"
    
    # First root
    assert tree[0]["id"] == "root1"
    assert len(tree[0]["children"]) == 1
    assert tree[0]["children"][0]["id"] == "child1"
    
    # Second root
    assert tree[1]["id"] == "root2"
    assert len(tree[1]["children"]) == 1
    assert tree[1]["children"][0]["id"] == "child2"

def test_build_item_tree_preserves_order(outline_service):
    """Test that build_item_tree preserves item order"""
    items = [
        {"id": "root", "content": "Root", "parentId": None, "order": 0},
        {"id": "child3", "content": "Child 3", "parentId": "root", "order": 2},
        {"id": "child1", "content": "Child 1", "parentId": "root", "order": 0},
        {"id": "child2", "content": "Child 2", "parentId": "root", "order": 1}
    ]
    
    tree = outline_service.build_item_tree(items)
    
    assert len(tree) == 1
    root = tree[0]
    assert len(root["children"]) == 3
    
    # Children should be sorted by order
    assert root["children"][0]["id"] == "child1"
    assert root["children"][1]["id"] == "child2"
    assert root["children"][2]["id"] == "child3"

def test_build_item_tree_handles_empty_list(outline_service):
    """Test that build_item_tree handles empty item list"""
    tree = outline_service.build_item_tree([])
    assert tree == []

def test_build_item_tree_handles_orphaned_items(outline_service):
    """Test that build_item_tree handles items with non-existent parents"""
    items = [
        {"id": "root", "content": "Root", "parentId": None, "order": 0},
        {"id": "orphan", "content": "Orphan", "parentId": "non_existent", "order": 0}
    ]
    
    tree = outline_service.build_item_tree(items)
    
    # Should only have the root item, orphan should be ignored
    assert len(tree) == 1
    assert tree[0]["id"] == "root"
    assert len(tree[0]["children"]) == 0

def count_all_items(tree):
    """Helper function to count all items in a tree"""
    count = 0
    for item in tree:
        count += 1
        if "children" in item and item["children"]:
            count += count_all_items(item["children"])
    return count

def test_build_item_tree_includes_all_valid_items(outline_service, nested_items):
    """Test that all valid items are included in the tree"""
    tree = outline_service.build_item_tree(nested_items)
    
    # Count all items in the tree
    total_items = count_all_items(tree)
    
    # Should have all 6 items
    assert total_items == 6, f"Expected 6 items in tree, got {total_items}"

def test_build_item_tree_prevents_circular_references(outline_service):
    """Test that build_item_tree prevents circular references"""
    items = [
        {"id": "item1", "content": "Item 1", "parentId": "item2", "order": 0},
        {"id": "item2", "content": "Item 2", "parentId": "item1", "order": 0}
    ]
    
    # Should not crash and should handle gracefully
    tree = outline_service.build_item_tree(items)
    
    # Since both items have circular references, neither should be a root
    assert len(tree) == 0

def test_build_item_tree_prevents_self_reference(outline_service):
    """Test that build_item_tree prevents self-references"""
    items = [
        {"id": "item1", "content": "Item 1", "parentId": "item1", "order": 0}
    ]
    
    tree = outline_service.build_item_tree(items)
    
    # Item with self-reference should not be included as root
    assert len(tree) == 0