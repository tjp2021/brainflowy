"""Outline management endpoints"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query

from app.models.outline import (
    Outline, OutlineCreate, OutlineWithItems,
    OutlineItem, ItemCreate, ItemUpdate,
    BatchOperation, BatchOperationRequest, BatchOperationResponse,
    TemplateRequest, OperationType
)
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.outline_service import OutlineService
from app.core.config import settings

# Use mock client in test mode
if settings.TESTING:
    from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
else:
    from app.db.cosmos import cosmos_client

router = APIRouter()
outline_service = OutlineService()


@router.get("", response_model=List[Outline])
async def get_outlines(
    userId: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get user's outlines"""
    # Use provided userId or current user's ID
    user_id = userId or current_user.id
    
    # Verify user has access
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get outlines from database
    outlines = await cosmos_client.get_user_documents(user_id)
    
    # Convert to response format
    return [
        Outline(
            id=doc["id"],
            title=doc["title"],
            userId=doc["userId"],
            itemCount=len(doc.get("items", [])),
            createdAt=doc["createdAt"],
            updatedAt=doc["updatedAt"]
        )
        for doc in outlines
    ]


@router.post("", response_model=Outline, status_code=status.HTTP_201_CREATED)
async def create_outline(
    outline_data: OutlineCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new outline"""
    # Create outline document with current user's ID
    outline_id = f"outline_{int(datetime.utcnow().timestamp() * 1000)}"
    outline_doc = {
        "id": outline_id,
        "title": outline_data.title,
        "userId": current_user.id,  # Always use authenticated user's ID
        "items": [],
        "itemCount": 0,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    # Save to database
    await cosmos_client.create_document(outline_doc)
    
    return Outline(**outline_doc)


@router.get("/{outline_id}", response_model=Outline)
async def get_outline(
    outline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific outline"""
    # Get outline from database
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    return Outline(
        id=outline["id"],
        title=outline["title"],
        userId=outline["userId"],
        itemCount=len(outline.get("items", [])),
        createdAt=outline["createdAt"],
        updatedAt=outline["updatedAt"]
    )


@router.put("/{outline_id}", response_model=Outline)
async def update_outline(
    outline_id: str,
    update_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update an outline"""
    # Get existing outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Update fields
    if "title" in update_data:
        outline["title"] = update_data["title"]
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    updated = await cosmos_client.update_document(outline_id, outline)
    
    return Outline(
        id=updated["id"],
        title=updated["title"],
        userId=updated["userId"],
        itemCount=len(updated.get("items", [])),
        createdAt=updated["createdAt"],
        updatedAt=updated["updatedAt"]
    )


@router.delete("/{outline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outline(
    outline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an outline"""
    # Verify outline exists
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Delete from database
    await cosmos_client.delete_document(outline_id, current_user.id)


@router.get("/{outline_id}/items", response_model=List[OutlineItem])
async def get_outline_items(
    outline_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get outline items in hierarchical structure"""
    # Get outline from database
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Build hierarchical structure from flat items
    items = outline.get("items", [])
    return outline_service.build_item_tree(items)


@router.post("/{outline_id}/items", response_model=OutlineItem, status_code=status.HTTP_201_CREATED)
async def create_item(
    outline_id: str,
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new item in an outline"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Create new item with unique ID (using microseconds and random component to avoid collisions)
    import random
    item_id = f"item_{int(datetime.utcnow().timestamp() * 1000000)}_{random.randint(100, 999)}"
    
    # Calculate order (number of siblings)
    items = outline.get("items", [])
    siblings = [i for i in items if i.get("parentId") == item_data.parentId]
    order = len(siblings)
    
    new_item = {
        "id": item_id,
        "content": item_data.content,
        "parentId": item_data.parentId,
        "outlineId": outline_id,
        "order": order,
        "style": item_data.style,
        "formatting": item_data.formatting,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    # Add to outline
    items.append(new_item)
    outline["items"] = items
    outline["itemCount"] = len(items)
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    return OutlineItem(**new_item)


@router.put("/{outline_id}/items/{item_id}", response_model=OutlineItem)
async def update_item(
    outline_id: str,
    item_id: str,
    update_data: ItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an outline item"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Find and update item
    items = outline.get("items", [])
    item_found = False
    
    for item in items:
        if item["id"] == item_id:
            if update_data.content is not None:
                item["content"] = update_data.content
            if update_data.parentId is not None:
                item["parentId"] = update_data.parentId
            if update_data.order is not None:
                item["order"] = update_data.order
            if update_data.style is not None:
                item["style"] = update_data.style
            if update_data.formatting is not None:
                item["formatting"] = update_data.formatting
            item["updatedAt"] = datetime.utcnow().isoformat()
            item_found = True
            updated_item = item
            break
    
    if not item_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Update outline
    outline["items"] = items
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    return OutlineItem(**updated_item)


@router.delete("/{outline_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    outline_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an outline item and its children"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Remove item and children
    items = outline.get("items", [])
    items_to_remove = outline_service.get_item_and_children(items, item_id)
    
    # Filter out removed items
    outline["items"] = [i for i in items if i["id"] not in items_to_remove]
    outline["itemCount"] = len(outline["items"])
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)


@router.post("/{outline_id}/items/{item_id}/indent", response_model=OutlineItem)
async def indent_item(
    outline_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Indent an item (make it a child of the previous sibling)"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Perform indent operation
    items = outline.get("items", [])
    updated_item = outline_service.indent_item(items, item_id)
    
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot indent this item"
        )
    
    # Update outline
    outline["items"] = items
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    return OutlineItem(**updated_item)


@router.post("/{outline_id}/items/{item_id}/outdent", response_model=OutlineItem)
async def outdent_item(
    outline_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Outdent an item (move it up one level)"""
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Perform outdent operation
    items = outline.get("items", [])
    updated_item = outline_service.outdent_item(items, item_id)
    
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot outdent this item"
        )
    
    # Update outline
    outline["items"] = items
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    return OutlineItem(**updated_item)

@router.post("/{outline_id}/batch", response_model=BatchOperationResponse)
async def batch_operations(
    outline_id: str,
    request: BatchOperationRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute multiple operations in a single request"""
    import random
    
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    items = outline.get("items", [])
    errors = []
    
    # Process each operation
    for op in request.operations:
        try:
            if op.type == OperationType.CREATE:
                # Generate ID server-side
                item_id = f"item_{int(datetime.utcnow().timestamp() * 1000000)}_{random.randint(100, 999)}"
                
                # Calculate order
                siblings = [i for i in items if i.get("parentId") == op.parentId]
                order = op.position if op.position is not None else len(siblings)
                
                new_item = {
                    "id": item_id,
                    "content": op.data.get("text", op.data.get("content", "")),
                    "parentId": op.parentId,
                    "outlineId": outline_id,
                    "order": order,
                    "style": op.data.get("style"),
                    "formatting": op.data.get("formatting"),
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat()
                }
                items.append(new_item)
                
            elif op.type == OperationType.UPDATE:
                for item in items:
                    if item["id"] == op.id:
                        if op.data:
                            if "text" in op.data or "content" in op.data:
                                item["content"] = op.data.get("text", op.data.get("content"))
                            if "style" in op.data:
                                item["style"] = op.data["style"]
                            if "formatting" in op.data:
                                item["formatting"] = op.data["formatting"]
                        if op.parentId is not None:
                            item["parentId"] = op.parentId
                        if op.position is not None:
                            item["order"] = op.position
                        item["updatedAt"] = datetime.utcnow().isoformat()
                        break
                        
            elif op.type == OperationType.DELETE:
                # Remove item and its children
                items_to_remove = outline_service.get_item_and_children(items, op.id)
                items = [i for i in items if i["id"] not in items_to_remove]
                
            elif op.type == OperationType.MOVE:
                for item in items:
                    if item["id"] == op.id:
                        item["parentId"] = op.parentId
                        if op.position is not None:
                            item["order"] = op.position
                        item["updatedAt"] = datetime.utcnow().isoformat()
                        break
                        
        except Exception as e:
            errors.append(f"Operation failed for {op.type} {op.id}: {str(e)}")
    
    # Update outline
    outline["items"] = items
    outline["itemCount"] = len(items)
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    # Build hierarchical response
    hierarchical_items = outline_service.build_item_tree(items)
    
    return BatchOperationResponse(
        success=len(errors) == 0,
        items=hierarchical_items,
        errors=errors
    )


@router.post("/{outline_id}/template", response_model=List[OutlineItem])
async def create_from_template(
    outline_id: str,
    request: TemplateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create items from a template structure"""
    import random
    
    # Get outline
    outline = await cosmos_client.get_document(outline_id, current_user.id)
    
    if not outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Clear existing items if requested
    if request.clearExisting:
        outline["items"] = []
    
    items = outline.get("items", [])
    
    def create_items_recursive(template_items, parent_id=None):
        """Recursively create items from template"""
        created_items = []
        
        for idx, template_item in enumerate(template_items):
            # Generate server-side ID
            item_id = f"item_{int(datetime.utcnow().timestamp() * 1000000)}_{random.randint(100, 999)}"
            
            # Create the item
            new_item = {
                "id": item_id,
                "content": template_item.get("text", template_item.get("content", "")),
                "parentId": parent_id,
                "outlineId": outline_id,
                "order": idx,
                "style": template_item.get("style"),
                "formatting": template_item.get("formatting"),
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            
            # Add to flat list
            items.append(new_item)
            
            # Build hierarchical item for response
            hierarchical_item = OutlineItem(**new_item)
            
            # Process children if any
            if "children" in template_item and template_item["children"]:
                child_items = create_items_recursive(template_item["children"], item_id)
                hierarchical_item.children = child_items
            
            created_items.append(hierarchical_item)
        
        return created_items
    
    # Create all template items
    hierarchical_items = create_items_recursive(request.items)
    
    # Update outline
    outline["items"] = items
    outline["itemCount"] = len(items)
    outline["updatedAt"] = datetime.utcnow().isoformat()
    
    # Save to database
    await cosmos_client.update_document(outline_id, outline)
    
    return hierarchical_items
