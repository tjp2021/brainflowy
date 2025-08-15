"""
Voice and AI tests based on mockVoice.ts behavior.
These tests define the contract for voice transcription and AI structuring.
"""
import pytest
from httpx import AsyncClient
import base64

@pytest.mark.voice
class TestVoiceTranscription:
    """Test suite for voice transcription matching mockVoiceService"""
    
    @pytest.mark.asyncio
    async def test_transcribe_audio(self, client: AsyncClient, auth_headers, voice_audio_blob):
        """Test audio transcription - matches mockVoiceService.transcribeAudio()"""
        # Convert bytes to base64 for JSON transport
        audio_base64 = base64.b64encode(voice_audio_blob).decode('utf-8')
        
        response = await client.post(
            "/api/v1/voice/transcribe",
            headers=auth_headers,
            json={"audio": audio_base64}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Verify response structure matches TranscriptionResult
        assert "text" in result
        assert "confidence" in result
        assert "duration" in result
        
        # Verify data types and ranges
        assert isinstance(result["text"], str)
        assert len(result["text"]) > 0
        assert 0.0 <= result["confidence"] <= 1.0
        assert result["duration"] > 0
        
        # Confidence should be high (mock returns 0.92-1.0)
        assert result["confidence"] >= 0.92
    
    @pytest.mark.asyncio
    async def test_transcribe_empty_audio(self, client: AsyncClient, auth_headers):
        """Test transcription with empty audio"""
        response = await client.post(
            "/api/v1/voice/transcribe",
            headers=auth_headers,
            json={"audio": ""}
        )
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_transcribe_requires_auth(self, client: AsyncClient, voice_audio_blob):
        """Test that transcription requires authentication"""
        audio_base64 = base64.b64encode(voice_audio_blob).decode('utf-8')
        
        response = await client.post(
            "/api/v1/voice/transcribe",
            json={"audio": audio_base64}
        )
        
        assert response.status_code == 401


@pytest.mark.voice
class TestAIStructuring:
    """Test suite for AI text structuring"""
    
    @pytest.mark.asyncio
    async def test_structure_text(self, client: AsyncClient, auth_headers):
        """Test AI structuring - matches mockVoiceService.structureText()"""
        test_text = "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team"
        
        response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": test_text}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Verify response structure matches StructuredOutline
        assert "original" in result
        assert "structured" in result
        assert "suggestions" in result
        
        # Verify original text is preserved
        assert result["original"] == test_text
        
        # Verify structured items
        assert isinstance(result["structured"], list)
        assert len(result["structured"]) > 0
        
        for item in result["structured"]:
            assert "content" in item
            assert "level" in item
            assert isinstance(item["content"], str)
            assert isinstance(item["level"], int)
            assert item["level"] >= 0
        
        # Verify suggestions
        assert isinstance(result["suggestions"], list)
        if len(result["suggestions"]) > 0:
            assert all(isinstance(s, str) for s in result["suggestions"])
    
    @pytest.mark.asyncio
    async def test_structure_text_hierarchy(self, client: AsyncClient, auth_headers):
        """Test that AI creates proper hierarchy with levels"""
        # Text with clear hierarchy indicators
        test_text = "Project planning: define goals, including milestones and deadlines, assign resources such as team members and budget"
        
        response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": test_text}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Should have items at different levels
        levels = [item["level"] for item in result["structured"]]
        assert max(levels) > 0  # Should have at least one sub-item
        
        # Parent items (level 0) should come before their children (level 1)
        for i, item in enumerate(result["structured"]):
            if item["level"] == 1 and i > 0:
                # There should be a level 0 item before this
                assert any(
                    result["structured"][j]["level"] == 0 
                    for j in range(i)
                )
    
    @pytest.mark.asyncio
    async def test_structure_empty_text(self, client: AsyncClient, auth_headers):
        """Test structuring with empty text"""
        response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": ""}
        )
        
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_improve_outline(self, client: AsyncClient, auth_headers):
        """Test AI outline improvement - matches mockVoiceService.improveOutline()"""
        items = [
            {"content": "meeting notes", "level": 0},
            {"content": "discuss budget", "level": 1},
            {"content": "review timeline", "level": 1}
        ]
        
        response = await client.post(
            "/api/v1/voice/improve",
            headers=auth_headers,
            json={"items": items}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Should return improved structure
        assert "original" in result
        assert "structured" in result
        assert "suggestions" in result
        
        # Improved items should have proper capitalization and punctuation
        for item in result["structured"]:
            assert item["content"][0].isupper()  # First letter capitalized
            # Could have period at end (mock adds it if missing)


@pytest.mark.voice
class TestVoiceIntegration:
    """Test voice integration with outlines"""
    
    @pytest.mark.asyncio
    async def test_voice_update_outline(self, client: AsyncClient, auth_headers, sample_outline):
        """Test updating outline with voice command"""
        voice_command = "Change that bullet about the vector DB to use Cosmos not Postgres directly"
        
        response = await client.put(
            f"/outlines/{sample_outline['id']}/voice",
            headers=auth_headers,
            json={"command": voice_command}
        )
        
        assert response.status_code == 200
        updated_outline = response.json()
        
        # Should return updated outline
        assert "id" in updated_outline
        assert updated_outline["id"] == sample_outline["id"]
        # The outline should be modified based on the voice command
        # Exact validation depends on AI implementation
    
    @pytest.mark.asyncio
    async def test_voice_add_items(self, client: AsyncClient, auth_headers, sample_outline):
        """Test adding items to outline via voice"""
        voice_text = "Add three new tasks: review code, write tests, deploy to staging"
        
        # First structure the text
        structure_response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": voice_text}
        )
        structured_items = structure_response.json()["structured"]
        
        # Then add structured items to outline
        response = await client.post(
            f"/outlines/{sample_outline['id']}/items/bulk",
            headers=auth_headers,
            json={"items": structured_items}
        )
        
        assert response.status_code == 201
        added_items = response.json()
        
        assert isinstance(added_items, list)
        assert len(added_items) > 0
        
        # Each item should have been created
        for item in added_items:
            assert "id" in item
            assert "content" in item
            assert "outlineId" in item
            assert item["outlineId"] == sample_outline["id"]
    
    @pytest.mark.asyncio
    async def test_voice_workflow_end_to_end(self, client: AsyncClient, auth_headers, sample_outline, voice_audio_blob):
        """Test complete voice workflow: record -> transcribe -> structure -> add to outline"""
        # Step 1: Transcribe audio
        audio_base64 = base64.b64encode(voice_audio_blob).decode('utf-8')
        transcribe_response = await client.post(
            "/api/v1/voice/transcribe",
            headers=auth_headers,
            json={"audio": audio_base64}
        )
        assert transcribe_response.status_code == 200
        transcribed_text = transcribe_response.json()["text"]
        
        # Step 2: Structure the transcribed text
        structure_response = await client.post(
            "/api/v1/voice/structure",
            headers=auth_headers,
            json={"text": transcribed_text}
        )
        assert structure_response.status_code == 200
        structured_items = structure_response.json()["structured"]
        
        # Step 3: Add structured items to outline
        add_response = await client.post(
            f"/outlines/{sample_outline['id']}/items/bulk",
            headers=auth_headers,
            json={"items": structured_items}
        )
        assert add_response.status_code == 201
        
        # Step 4: Verify items were added
        items_response = await client.get(
            f"/outlines/{sample_outline['id']}/items",
            headers=auth_headers
        )
        assert items_response.status_code == 200
        items = items_response.json()
        
        # Should have more items than before
        assert len(items) > 0