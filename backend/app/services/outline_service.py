"""Outline service for managing hierarchical data operations"""
from typing import List, Dict, Any, Optional, Set
from datetime import datetime


class OutlineService:
    """Service for outline operations"""
    
    def build_item_tree(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build hierarchical tree structure from flat items list"""
        # Create a map for quick lookup
        item_map = {item["id"]: {**item, "children": []} for item in items}
        root_items = []
        
        # Build tree structure
        for item in items:
            if item.get("parentId"):
                parent = item_map.get(item["parentId"])
                if parent:
                    parent["children"].append(item_map[item["id"]])
            else:
                root_items.append(item_map[item["id"]])
        
        # Sort by order
        def sort_by_order(items_list):
            items_list.sort(key=lambda x: x.get("order", 0))
            for item in items_list:
                if item.get("children"):
                    sort_by_order(item["children"])
        
        sort_by_order(root_items)
        return root_items
    
    def get_item_and_children(self, items: List[Dict[str, Any]], item_id: str) -> Set[str]:
        """Get an item and all its descendant IDs"""
        ids_to_remove = {item_id}
        
        # Find all children recursively
        def find_children(parent_id: str):
            for item in items:
                if item.get("parentId") == parent_id:
                    ids_to_remove.add(item["id"])
                    find_children(item["id"])
        
        find_children(item_id)
        return ids_to_remove
    
    def indent_item(self, items: List[Dict[str, Any]], item_id: str) -> Optional[Dict[str, Any]]:
        """Indent an item (make it a child of the previous sibling)"""
        # Find the item
        target_item = None
        target_index = -1
        
        for i, item in enumerate(items):
            if item["id"] == item_id:
                target_item = item
                target_index = i
                break
        
        if not target_item:
            return None
        
        # Find previous sibling (same parent, lower order)
        siblings = [
            (i, item) for i, item in enumerate(items)
            if item.get("parentId") == target_item.get("parentId") 
            and item.get("order", 0) < target_item.get("order", 0)
        ]
        
        if not siblings:
            return None
        
        # Get the last sibling (highest order among previous siblings)
        siblings.sort(key=lambda x: x[1].get("order", 0))
        prev_sibling_index, prev_sibling = siblings[-1]
        
        # Update target item's parent
        target_item["parentId"] = prev_sibling["id"]
        target_item["order"] = 0  # First child of new parent
        target_item["updatedAt"] = datetime.utcnow().isoformat()
        
        # Update order of new siblings
        new_siblings = [
            item for item in items
            if item.get("parentId") == prev_sibling["id"] and item["id"] != item_id
        ]
        for i, sibling in enumerate(new_siblings):
            sibling["order"] = i + 1
        
        return target_item
    
    def outdent_item(self, items: List[Dict[str, Any]], item_id: str) -> Optional[Dict[str, Any]]:
        """Outdent an item (move it up one level)"""
        # Find the item
        target_item = None
        
        for item in items:
            if item["id"] == item_id:
                target_item = item
                break
        
        if not target_item or not target_item.get("parentId"):
            return None  # Can't outdent root items
        
        # Find parent
        parent = None
        for item in items:
            if item["id"] == target_item["parentId"]:
                parent = item
                break
        
        if not parent:
            return None
        
        # Update target item
        target_item["parentId"] = parent.get("parentId")  # Grandparent becomes parent
        
        # Calculate new order (after parent)
        if parent.get("parentId"):
            # Find parent's siblings
            parent_siblings = [
                item for item in items
                if item.get("parentId") == parent.get("parentId")
            ]
            parent_order = parent.get("order", 0)
            target_item["order"] = parent_order + 1
            
            # Update order of siblings after parent
            for sibling in parent_siblings:
                if sibling.get("order", 0) > parent_order:
                    sibling["order"] = sibling.get("order", 0) + 1
        else:
            # Moving to root level
            root_items = [item for item in items if not item.get("parentId")]
            target_item["order"] = len(root_items)
        
        target_item["updatedAt"] = datetime.utcnow().isoformat()
        
        return target_item


# Global service instance
outline_service = OutlineService()