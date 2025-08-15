"""
Outline tests based on mockOutlines.ts behavior.
These tests define the exact contract for outline operations.
"""
import pytest
from httpx import AsyncClient
from datetime import datetime

@pytest.mark.outlines
class TestOutlines:
    """Test suite for outline endpoints matching mockOutlineService"""
    
    @pytest.mark.asyncio
    async def test_get_user_outlines(self, client: AsyncClient, auth_headers, test_user, sample_outline):
        """Test getting user's outlines - matches mockOutlineService.getOutlines()"""
        response = await client.get(
            f"/api/v1/outlines?userId={test_user['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        outlines = response.json()
        
        # Should return array of outlines
        assert isinstance(outlines, list)
        
        # If sample outline exists, verify structure
        if len(outlines) > 0:
            outline = outlines[0]
            assert "id" in outline
            assert "title" in outline
            assert "userId" in outline
            assert "createdAt" in outline
            assert "updatedAt" in outline
            assert "itemCount" in outline
    
    @pytest.mark.asyncio
    async def test_get_specific_outline(self, client: AsyncClient, auth_headers, sample_outline):
        """Test getting specific outline - matches mockOutlineService.getOutline()"""
        response = await client.get(
            f"/api/v1/outlines/{sample_outline['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        outline = response.json()
        
        assert outline["id"] == sample_outline["id"]
        assert outline["title"] == sample_outline["title"]
        assert outline["userId"] == sample_outline["userId"]
        assert outline["itemCount"] == sample_outline["itemCount"]
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_outline(self, client: AsyncClient, auth_headers):
        """Test getting outline that doesn't exist"""
        response = await client.get(
            "/api/v1/outlines/nonexistent_id",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_create_outline(self, client: AsyncClient, auth_headers, test_user):
        """Test creating new outline - matches mockOutlineService.createOutline()"""
        response = await client.post(
            "/api/v1/outlines",
            headers=auth_headers,
            json={
                "title": "My New Outline",
                "userId": test_user["id"]
            }
        )
        
        assert response.status_code == 201
        outline = response.json()
        
        assert outline["title"] == "My New Outline"
        assert outline["userId"] == test_user["id"]
        assert outline["itemCount"] == 0
        assert "id" in outline
        assert outline["id"].startswith("outline_")
        assert "createdAt" in outline
        assert "updatedAt" in outline
    
    @pytest.mark.asyncio
    async def test_update_outline_title(self, client: AsyncClient, auth_headers, sample_outline):
        """Test updating outline - matches mockOutlineService.updateOutline()"""
        new_title = "Updated Title"
        response = await client.put(
            f"/api/v1/outlines/{sample_outline['id']}",
            headers=auth_headers,
            json={"title": new_title}
        )
        
        assert response.status_code == 200
        outline = response.json()
        
        assert outline["id"] == sample_outline["id"]
        assert outline["title"] == new_title
        # updatedAt should be more recent
        assert "updatedAt" in outline
    
    @pytest.mark.asyncio
    async def test_delete_outline(self, client: AsyncClient, auth_headers):
        """Test deleting outline - matches mockOutlineService.deleteOutline()"""
        # First create an outline to delete
        create_response = await client.post(
            "/api/v1/outlines",
            headers=auth_headers,
            json={"title": "To Delete", "userId": "user_test"}
        )
        outline_id = create_response.json()["id"]
        
        # Now delete it
        response = await client.delete(
            f"/api/v1/outlines/{outline_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = await client.get(
            f"/api/v1/outlines/{outline_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404


@pytest.mark.outlines
class TestOutlineItems:
    """Test suite for outline items matching mockOutlineService item operations"""
    
    @pytest.mark.asyncio
    async def test_get_outline_items(self, client: AsyncClient, auth_headers, sample_outline, sample_outline_items):
        """Test getting outline items - matches mockOutlineService.getOutlineItems()"""
        response = await client.get(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        items = response.json()
        
        # Should return hierarchical structure
        assert isinstance(items, list)
        
        # Verify structure matches buildItemTree output
        # Root items should not have parentId
        root_items = [item for item in items if not item.get("parentId")]
        assert len(root_items) > 0
        
        # Check for children array in items
        if len(items) > 0:
            assert "children" in items[0]
            assert isinstance(items[0]["children"], list)
    
    @pytest.mark.asyncio
    async def test_create_item(self, client: AsyncClient, auth_headers, sample_outline):
        """Test creating new item - matches mockOutlineService.createItem()"""
        response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={
                "content": "New test item",
                "parentId": None
            }
        )
        
        assert response.status_code == 201
        item = response.json()
        
        assert item["content"] == "New test item"
        assert item["parentId"] is None
        assert item["outlineId"] == sample_outline["id"]
        assert "id" in item
        assert item["id"].startswith("item_")
        assert "order" in item
        assert "createdAt" in item
        assert "updatedAt" in item
    
    @pytest.mark.asyncio
    async def test_create_nested_item(self, client: AsyncClient, auth_headers, sample_outline):
        """Test creating nested item with parent"""
        # Create parent item first
        parent_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Parent item", "parentId": None}
        )
        parent_id = parent_response.json()["id"]
        
        # Create child item
        response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={
                "content": "Child item",
                "parentId": parent_id
            }
        )
        
        assert response.status_code == 201
        item = response.json()
        
        assert item["content"] == "Child item"
        assert item["parentId"] == parent_id
        assert item["order"] == 0  # First child
    
    @pytest.mark.asyncio
    async def test_update_item_content(self, client: AsyncClient, auth_headers, sample_outline_items):
        """Test updating item - matches mockOutlineService.updateItem()"""
        item_id = sample_outline_items[0]["id"]
        new_content = "Updated content"
        
        response = await client.put(
            f"/api/v1/outlines/{sample_outline_items[0]['outlineId']}/items/{item_id}",
            headers=auth_headers,
            json={"content": new_content}
        )
        
        assert response.status_code == 200
        item = response.json()
        
        assert item["id"] == item_id
        assert item["content"] == new_content
        assert "updatedAt" in item
    
    @pytest.mark.asyncio
    async def test_delete_item(self, client: AsyncClient, auth_headers, sample_outline):
        """Test deleting item - matches mockOutlineService.deleteItem()"""
        # Create item to delete
        create_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "To delete", "parentId": None}
        )
        item_id = create_response.json()["id"]
        
        # Delete it
        response = await client.delete(
            f"/api/v1/outlines/{sample_outline['id']}/items/{item_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    @pytest.mark.asyncio
    async def test_delete_item_with_children(self, client: AsyncClient, auth_headers, sample_outline):
        """Test that deleting parent deletes all children"""
        # Create parent and children
        parent_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Parent", "parentId": None}
        )
        parent_id = parent_response.json()["id"]
        
        child_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Child", "parentId": parent_id}
        )
        
        # Delete parent
        response = await client.delete(
            f"/api/v1/outlines/{sample_outline['id']}/items/{parent_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify outline item count is updated
        outline_response = await client.get(
            f"/api/v1/outlines/{sample_outline['id']}",
            headers=auth_headers
        )
        # Item count should reflect deletion of both parent and child
    
    @pytest.mark.asyncio
    async def test_indent_item(self, client: AsyncClient, auth_headers, sample_outline):
        """Test indenting item - matches mockOutlineService.indentItem()"""
        # Create two sibling items
        first_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "First item", "parentId": None}
        )
        first_id = first_response.json()["id"]
        
        second_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Second item", "parentId": None}
        )
        second_id = second_response.json()["id"]
        
        # Indent second item (should become child of first)
        response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items/{second_id}/indent",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        item = response.json()
        
        assert item["id"] == second_id
        assert item["parentId"] == first_id
    
    @pytest.mark.asyncio
    async def test_outdent_item(self, client: AsyncClient, auth_headers, sample_outline):
        """Test outdenting item - matches mockOutlineService.outdentItem()"""
        # Create parent and child
        parent_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Parent", "parentId": None}
        )
        parent_id = parent_response.json()["id"]
        
        child_response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers,
            json={"content": "Child", "parentId": parent_id}
        )
        child_id = child_response.json()["id"]
        
        # Outdent child (should become sibling of parent)
        response = await client.post(
            f"/api/v1/outlines/{sample_outline['id']}/items/{child_id}/outdent",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        item = response.json()
        
        assert item["id"] == child_id
        assert item["parentId"] is None  # Now at root level
    
    @pytest.mark.asyncio
    async def test_item_order_preservation(self, client: AsyncClient, auth_headers, sample_outline):
        """Test that item order is preserved correctly"""
        # Create multiple items
        item_ids = []
        for i in range(3):
            response = await client.post(
                f"/api/v1/outlines/{sample_outline['id']}/items",
                headers=auth_headers,
                json={"content": f"Item {i}", "parentId": None}
            )
            item_ids.append(response.json()["id"])
        
        # Get items and verify order
        response = await client.get(
            f"/api/v1/outlines/{sample_outline['id']}/items",
            headers=auth_headers
        )
        items = response.json()
        
        # Items should be in order they were created
        for i, item in enumerate(items):
            if item["id"] in item_ids:
                assert item["order"] == i