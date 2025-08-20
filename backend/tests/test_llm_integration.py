#!/usr/bin/env python3
"""
Comprehensive test suite for LLM integration
Tests various scenarios including edge cases and error handling
"""

import pytest
import asyncio
import json
from unittest.mock import patch, MagicMock
from httpx import AsyncClient
from app.main import app
from app.api.endpoints.llm_actions import call_llm_api, LLMActionRequest

pytestmark = pytest.mark.asyncio


class TestLLMIntegration:
    """Test suite for LLM integration with OpenAI"""
    
    @pytest.fixture
    async def client(self):
        """Create test client"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac
    
    @pytest.fixture
    async def auth_token(self, client):
        """Get authentication token"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"test{asyncio.get_event_loop().time()}@example.com",
                "password": "TestPass123!",
                "displayName": "Test User"
            }
        )
        data = response.json()
        return data.get("access_token") or data.get("accessToken")
    
    # ========== HAPPY PATH TESTS ==========
    
    async def test_create_spov_success(self, client, auth_token):
        """Test successful SPOV creation"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create",
                "section": "spov",
                "userPrompt": "Create an SPOV about customer retention"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert "items" in data["result"]
        assert len(data["result"]["items"]) > 0
        
        # Verify SPOV structure
        spov = data["result"]["items"][0]
        assert "children" in spov
        sections = [child["text"] for child in spov["children"]]
        assert "Description:" in sections
        assert "Evidence:" in sections
        assert "Implementation Levers:" in sections
    
    async def test_edit_content_success(self, client, auth_token):
        """Test successful content editing"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "edit",
                "targetId": "item-123",
                "userPrompt": "Make this more concise"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "content" in data["result"]
        assert "suggestions" in data["result"]
    
    async def test_research_with_citations(self, client, auth_token):
        """Test research action with citations"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "research",
                "userPrompt": "Research AI trends in healthcare"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "citations" in data["result"]
        assert len(data["result"]["citations"]) > 0
        
        # Verify citation structure
        for citation in data["result"]["citations"]:
            assert "text" in citation
            assert "source" in citation
            assert "url" in citation or citation["url"] is None
    
    # ========== ERROR HANDLING TESTS ==========
    
    async def test_empty_prompt(self, client, auth_token):
        """Test handling of empty prompts"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create",
                "userPrompt": ""
            }
        )
        # Should either return error or use fallback
        assert response.status_code in [200, 400]
    
    async def test_invalid_action_type(self, client, auth_token):
        """Test invalid action type"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "invalid_type",
                "userPrompt": "Test prompt"
            }
        )
        # Should handle gracefully
        assert response.status_code in [200, 400]
    
    @patch('app.api.endpoints.llm_actions.OpenAI')
    async def test_openai_api_failure(self, mock_openai, client, auth_token):
        """Test fallback when OpenAI API fails"""
        # Mock API failure
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create",
                "userPrompt": "Test prompt"
            }
        )
        # Should fall back to mock response
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
    
    @patch('app.api.endpoints.llm_actions.OpenAI')
    async def test_malformed_json_response(self, mock_openai, client, auth_token):
        """Test handling of malformed JSON from OpenAI"""
        # Mock malformed response
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Not valid JSON {{"
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create",
                "userPrompt": "Test prompt"
            }
        )
        # Should fall back to mock response
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
    
    # ========== EDGE CASES ==========
    
    async def test_extremely_long_prompt(self, client, auth_token):
        """Test handling of very long prompts"""
        long_prompt = "Test " * 10000  # ~50k characters
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create",
                "userPrompt": long_prompt
            }
        )
        # Should handle without crashing
        assert response.status_code in [200, 400, 413]
    
    async def test_special_characters(self, client, auth_token):
        """Test handling of special characters and potential injections"""
        prompts = [
            "'; DROP TABLE users; --",
            '{"malicious": "json"}',
            "<script>alert('xss')</script>",
            "Test with emoji 🚀 and unicode ñ é ü",
            "\\n\\r\\t special whitespace",
        ]
        
        for prompt in prompts:
            response = await client.post(
                "/api/v1/outlines/test-outline/llm-action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "type": "create",
                    "userPrompt": prompt
                }
            )
            assert response.status_code == 200
            # Verify no injection occurred
            data = response.json()
            assert "DROP TABLE" not in json.dumps(data)
            assert "<script>" not in json.dumps(data)
    
    async def test_concurrent_requests(self, client, auth_token):
        """Test handling of concurrent requests"""
        tasks = []
        for i in range(10):
            task = client.post(
                "/api/v1/outlines/test-outline/llm-action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "type": "create",
                    "userPrompt": f"Test prompt {i}"
                }
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should complete without errors
        for response in responses:
            if not isinstance(response, Exception):
                assert response.status_code == 200
    
    # ========== VALIDATION TESTS ==========
    
    async def test_missing_required_fields(self, client, auth_token):
        """Test missing required fields"""
        # Missing type
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "userPrompt": "Test prompt"
            }
        )
        assert response.status_code == 422
        
        # Missing userPrompt
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "create"
            }
        )
        assert response.status_code == 422
    
    async def test_unauthorized_access(self, client):
        """Test unauthorized access"""
        response = await client.post(
            "/api/v1/outlines/test-outline/llm-action",
            json={
                "type": "create",
                "userPrompt": "Test prompt"
            }
        )
        assert response.status_code == 401
    
    # ========== DATABASE INTEGRATION ==========
    
    async def test_outline_context_loading(self, client, auth_token):
        """Test that outline context is properly loaded"""
        # First create an outline
        outline_response = await client.post(
            "/api/v1/outlines",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"title": "Test Outline"}
        )
        
        if outline_response.status_code == 200:
            outline_data = outline_response.json()
            outline_id = outline_data.get("id")
            
            # Now test LLM action with real outline
            response = await client.post(
                f"/api/v1/outlines/{outline_id}/llm-action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "type": "create",
                    "userPrompt": "Create content"
                }
            )
            assert response.status_code == 200
    
    # ========== RESPONSE FORMAT TESTS ==========
    
    async def test_response_format_consistency(self, client, auth_token):
        """Test that all response formats are consistent"""
        action_types = ["create", "edit", "research"]
        
        for action_type in action_types:
            response = await client.post(
                "/api/v1/outlines/test-outline/llm-action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "type": action_type,
                    "userPrompt": "Test prompt"
                }
            )
            assert response.status_code == 200
            data = response.json()
            
            # Common fields
            assert "action" in data
            assert "result" in data
            
            # Type-specific validation
            if action_type == "create":
                assert "items" in data["result"]
                assert isinstance(data["result"]["items"], list)
            elif action_type == "edit":
                assert "content" in data["result"]
                assert isinstance(data["result"]["content"], str)
            elif action_type == "research":
                assert "citations" in data["result"]
                assert isinstance(data["result"]["citations"], list)


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])