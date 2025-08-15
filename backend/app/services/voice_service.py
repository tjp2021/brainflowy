"""Voice and AI service for transcription and text structuring"""
import re
from typing import List, Dict, Any
from app.models.voice import StructuredItem


class VoiceService:
    """Service for voice transcription and AI operations"""
    
    def mock_transcribe(self, audio_data: bytes) -> str:
        """Mock transcription - replace with Whisper API"""
        # For testing, return sample transcriptions based on audio size
        size = len(audio_data)
        
        samples = [
            "Today I need to finish the project proposal, review the budget documents, and schedule a meeting with the team",
            "The main features we need are user authentication, real-time sync, and voice input with AI structuring",
            "Meeting notes: discussed quarterly goals, need to increase revenue by 20%, focus on customer retention",
            "Shopping list: milk, bread, eggs, coffee, fruits including apples and bananas, vegetables"
        ]
        
        # Return a sample based on size
        return samples[size % len(samples)]
    
    def mock_structure_text(self, text: str) -> List[StructuredItem]:
        """Mock text structuring - replace with Claude/GPT API"""
        # Simple rule-based structuring for testing
        structured = []
        
        # Split by common delimiters
        parts = re.split(r'[,;.]|\band\b', text)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) <= 1:
            # Single item
            return [StructuredItem(content=text, level=0)]
        
        # First part is main topic
        if parts:
            structured.append(StructuredItem(
                content=parts[0] if len(parts[0]) > 10 else text.split()[0:5],
                level=0
            ))
        
        # Rest are sub-items
        for part in parts[1:]:
            if part:
                structured.append(StructuredItem(content=part, level=1))
        
        return structured
    
    def mock_improve_outline(self, text: str) -> List[StructuredItem]:
        """Mock outline improvement - replace with AI API"""
        # For testing, add some structure
        lines = text.split('\n')
        structured = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Determine level by indentation or markers
            level = 0
            if line.startswith('- ') or line.startswith('* '):
                level = 1
                line = line[2:]
            elif line.startswith('  '):
                level = line.count('  ')
                line = line.strip()
            
            structured.append(StructuredItem(content=line, level=min(level, 3)))
        
        # If no structure detected, apply default
        if not structured:
            return self.mock_structure_text(text)
        
        return structured
    
    def process_voice_command(self, outline: Dict[str, Any], command: str) -> Dict[str, Any]:
        """Process a voice command to update outline"""
        command_lower = command.lower()
        items = outline.get("items", [])
        modified_count = 0
        
        # Simple command processing
        if "delete" in command_lower or "remove" in command_lower:
            # Find and remove items matching command
            keywords = re.findall(r'\b\w+\b', command_lower)
            keywords = [k for k in keywords if k not in ['delete', 'remove', 'the', 'a', 'an']]
            
            if keywords:
                keyword = keywords[0]
                items_to_keep = []
                for item in items:
                    if keyword not in item.get("content", "").lower():
                        items_to_keep.append(item)
                    else:
                        modified_count += 1
                outline["items"] = items_to_keep
        
        elif "add" in command_lower or "insert" in command_lower:
            # Extract text to add
            match = re.search(r'(add|insert)\s+(.+)', command_lower)
            if match:
                content = match.group(2)
                # Add as a new item
                from datetime import datetime
                new_item = {
                    "id": f"item_{int(datetime.utcnow().timestamp() * 1000)}",
                    "content": content.capitalize(),
                    "parentId": None,
                    "outlineId": outline["id"],
                    "order": len([i for i in items if not i.get("parentId")]),
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat()
                }
                items.append(new_item)
                outline["items"] = items
                modified_count = 1
        
        elif "change" in command_lower or "update" in command_lower or "modify" in command_lower:
            # Simple find and replace
            parts = re.split(r'\s+to\s+', command_lower)
            if len(parts) == 2:
                find_text = re.sub(r'^.*?(change|update|modify)\s+', '', parts[0])
                replace_text = parts[1]
                
                for item in items:
                    if find_text in item.get("content", "").lower():
                        item["content"] = item["content"].replace(
                            find_text,
                            replace_text
                        )
                        modified_count += 1
        
        outline["itemCount"] = len(outline.get("items", []))
        outline["lastModifiedCount"] = modified_count
        
        return outline


# Global service instance
voice_service = VoiceService()