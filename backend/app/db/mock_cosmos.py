"""Mock Cosmos DB client for testing"""
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import json
import os
from pathlib import Path

class MockCosmosDBClient:
    """Mock Cosmos DB client for testing with file persistence"""
    
    def __init__(self):
        self.users = {}  # Store users by ID
        self.documents = {}  # Store documents by ID
        self.is_initialized = False
        # Use a persistent file for mock data
        self.data_file = Path("mock_db_data.json")
        self._load_data()
    
    def _load_data(self):
        """Load data from file if it exists"""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    self.users = data.get('users', {})
                    self.documents = data.get('documents', {})
            except (json.JSONDecodeError, IOError):
                # If file is corrupted, start fresh
                self.users = {}
                self.documents = {}
    
    def _save_data(self):
        """Save data to file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump({
                    'users': self.users,
                    'documents': self.documents
                }, f, indent=2)
        except IOError:
            pass  # Silently fail if we can't write
    
    async def initialize(self):
        """Initialize mock database"""
        self._load_data()
        self.is_initialized = True
    
    async def close(self):
        """Close mock database"""
        self.is_initialized = False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health"""
        return {
            "connected": self.is_initialized,
            "database": "MockDB" if self.is_initialized else None
        }
    
    # User operations
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user document"""
        # Check if email already exists
        for user in self.users.values():
            if user.get("email") == user_data.get("email"):
                raise ValueError("User already exists")
        
        # Add timestamps if not present
        if "createdAt" not in user_data:
            user_data["createdAt"] = datetime.utcnow().isoformat()
        if "updatedAt" not in user_data:
            user_data["updatedAt"] = datetime.utcnow().isoformat()
        
        # Store user
        self.users[user_data["id"]] = user_data
        self._save_data()  # Persist to file
        return user_data
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        return self.users.get(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email"""
        for user in self.users.values():
            if user.get("email") == email:
                return user
        return None
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a user document"""
        if user_id not in self.users:
            raise ValueError("User not found")
        
        user_data["updatedAt"] = datetime.utcnow().isoformat()
        self.users[user_id] = user_data
        self._save_data()  # Persist to file
        return user_data
    
    # Document (Outline) operations
    async def create_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        if "id" not in doc_data:
            doc_data["id"] = f"doc_{uuid.uuid4().hex[:8]}"
        
        if "createdAt" not in doc_data:
            doc_data["createdAt"] = datetime.utcnow().isoformat()
        if "updatedAt" not in doc_data:
            doc_data["updatedAt"] = datetime.utcnow().isoformat()
        
        self.documents[doc_data["id"]] = doc_data
        self._save_data()  # Persist to file
        return doc_data
    
    async def get_document(self, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        doc = self.documents.get(doc_id)
        if doc and doc.get("userId") == user_id:
            return doc
        return None
    
    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a user"""
        user_docs = [
            doc for doc in self.documents.values()
            if doc.get("userId") == user_id
        ]
        # Sort by updatedAt descending
        user_docs.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
        return user_docs
    
    async def update_document(self, doc_id: str, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a document"""
        if doc_id not in self.documents:
            raise ValueError("Document not found")
        
        doc_data["updatedAt"] = datetime.utcnow().isoformat()
        self.documents[doc_id] = doc_data
        self._save_data()  # Persist to file
        return doc_data
    
    async def delete_document(self, doc_id: str, user_id: str) -> bool:
        """Delete a document"""
        doc = self.documents.get(doc_id)
        if doc and doc.get("userId") == user_id:
            del self.documents[doc_id]
            self._save_data()  # Persist to file
            return True
        return False


# Create a singleton instance
mock_cosmos_client = MockCosmosDBClient()