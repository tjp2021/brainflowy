"""Real AI voice and text structuring service using OpenAI and Anthropic"""
import os
import tempfile
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from anthropic import Anthropic

from app.models.voice import StructuredItem
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIVoiceService:
    """Service for real AI voice transcription and text structuring"""
    
    def __init__(self):
        """Initialize AI clients if API keys are available"""
        self.openai_client = None
        self.anthropic_client = None
        
        # Initialize OpenAI client if API key is available
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        # Initialize Anthropic client if API key is available
        if settings.ANTHROPIC_API_KEY:
            try:
                self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
    
    async def transcribe_audio(self, audio_data: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribe audio using OpenAI Whisper API
        Falls back to mock if OpenAI is not configured
        """
        logger.info(f"🎯 AI Service: Transcribe called with {len(audio_data)} bytes, filename={filename}")
        logger.info(f"🎯 OpenAI client status: {'Configured' if self.openai_client else 'Not configured'}")
        
        if not self.openai_client:
            logger.warning("OpenAI client not configured, using mock transcription")
            return self._mock_transcribe(audio_data)
        
        try:
            # Check if we have valid audio data
            if len(audio_data) < 100:
                logger.warning(f"Audio data too small ({len(audio_data)} bytes), likely not valid audio")
                return ""  # Return empty string for invalid audio, NOT mock data!
                
            # Save audio to temporary file (Whisper API needs a file)
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
                logger.info(f"🎯 Saved audio to temp file: {tmp_file_path}, size: {len(audio_data)} bytes")
            
            try:
                # Open the file and send to Whisper API
                with open(tmp_file_path, "rb") as audio_file:
                    logger.info(f"Sending audio to Whisper API (size: {len(audio_data)} bytes)")
                    
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                    
                    logger.info(f"Transcription successful: {transcript[:100]}...")
                    return transcript
                    
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
                
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            # Don't return mock data for real failures!
            return f"[Transcription failed: {str(e)[:50]}]"
    
    async def structure_text(self, text: str) -> List[StructuredItem]:
        """
        Structure text into hierarchical outline using Claude or GPT-4
        Falls back to rule-based structuring if AI is not configured
        """
        # Try Claude first (better at structuring)
        if self.anthropic_client:
            try:
                return await self._structure_with_claude(text)
            except Exception as e:
                logger.error(f"Claude structuring failed: {e}")
        
        # Try GPT-4 if Claude is not available
        if self.openai_client:
            try:
                return await self._structure_with_gpt(text)
            except Exception as e:
                logger.error(f"GPT structuring failed: {e}")
        
        # Fall back to rule-based structuring
        logger.warning("No AI service configured, using rule-based structuring")
        return self._rule_based_structure(text)
    
    async def _structure_with_claude(self, text: str) -> List[StructuredItem]:
        """Use Claude to structure text into hierarchical outline"""
        try:
            prompt = f"""Convert the following text into a hierarchical outline structure. 
            Create main topics and subtopics based on the content.
            Return a JSON array where each item has 'content' (the text) and 'level' (0 for main topics, 1 for subtopics, etc).
            
            Text to structure:
            {text}
            
            Return only the JSON array, no other text."""
            
            message = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",  # Updated model name
                max_tokens=1000,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse Claude's response
            import json
            # Extract JSON from Claude's response
            response_text = message.content[0].text
            # Try to parse as JSON, handling potential text around it
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                structured_data = json.loads(json_match.group())
            else:
                structured_data = json.loads(response_text)
            
            return [
                StructuredItem(content=item["content"], level=item["level"])
                for item in structured_data
            ]
            
        except Exception as e:
            logger.error(f"Claude structuring error: {e}")
            raise
    
    async def _structure_with_gpt(self, text: str) -> List[StructuredItem]:
        """Use GPT-4 to structure text into hierarchical outline"""
        try:
            prompt = f"""Convert the following text into a hierarchical outline structure. 
            Create main topics and subtopics based on the content.
            Return a JSON array where each item has 'content' (the text) and 'level' (0 for main topics, 1 for subtopics, etc).
            
            Text to structure:
            {text}
            
            Return only the JSON array, no other text."""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Using stable, cost-effective model
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that structures text into hierarchical outlines."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            # Parse GPT's response
            import json
            response_text = response.choices[0].message.content
            # GPT might wrap it in an object or include extra text
            import re
            # Try to extract JSON array
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                structured_data = json.loads(json_match.group())
            else:
                # Try parsing as is
                structured_data = json.loads(response_text)
                if isinstance(structured_data, dict):
                    # Handle wrapped response
                    if "items" in structured_data:
                        structured_data = structured_data["items"]
                    elif "structured" in structured_data:
                        structured_data = structured_data["structured"]
                    else:
                        # Convert dict to list format
                        structured_data = [{"content": k, "level": v.get("level", 0)} for k, v in structured_data.items()]
            
            return [
                StructuredItem(content=item["content"], level=item["level"])
                for item in structured_data
            ]
            
        except Exception as e:
            logger.error(f"GPT structuring error: {e}")
            raise
    
    async def improve_outline(self, text: str) -> List[StructuredItem]:
        """
        Improve and restructure existing outline text using AI
        """
        # Similar to structure_text but with different prompting
        improved_text = f"Improve and reorganize this outline:\n{text}"
        return await self.structure_text(improved_text)
    
    def _mock_transcribe(self, audio_data: bytes) -> str:
        """Fallback mock transcription"""
        size = len(audio_data)
        samples = [
            "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team",
            "The main features we need are user authentication, real-time sync, and voice input with AI structuring",
            "Meeting notes: discussed quarterly goals, need to increase revenue by 20%, focus on customer retention",
            "Shopping list: milk, bread, eggs, coffee, fruits including apples and bananas, vegetables"
        ]
        return samples[size % len(samples)]
    
    def _rule_based_structure(self, text: str) -> List[StructuredItem]:
        """Fallback rule-based text structuring"""
        import re
        
        structured = []
        
        # Split by common delimiters
        parts = re.split(r'[,;.]|\band\b', text)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) <= 1:
            return [StructuredItem(content=text, level=0)]
        
        # First part is main topic
        if parts:
            structured.append(StructuredItem(
                content=parts[0],
                level=0
            ))
        
        # Rest are sub-items
        for part in parts[1:]:
            if part:
                structured.append(StructuredItem(content=part, level=1))
        
        return structured


# Global service instance
ai_voice_service = AIVoiceService()