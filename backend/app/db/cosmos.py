"""Azure Cosmos DB client and connection management"""
from typing import Optional, Dict, Any, List
from azure.cosmos.aio import CosmosClient
from azure.cosmos import exceptions
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class CosmosDBClient:
    """Async Cosmos DB client wrapper"""
    
    def __init__(self):
        self.client: Optional[CosmosClient] = None
        self.database = None
        self.users_container = None
        self.docs_container = None
    
    async def initialize(self):
        """Initialize Cosmos DB connection and containers"""
        try:
            # Create client
            self.client = CosmosClient(
                settings.COSMOS_ENDPOINT,
                credential=settings.COSMOS_KEY,
                connection_verify=False  # For emulator
            )
            
            # Create or get database
            self.database = await self.client.create_database_if_not_exists(
                id=settings.COSMOS_DATABASE_NAME
            )
            
            # Create or get Users container with /id as partition key
            self.users_container = await self.database.create_container_if_not_exists(
                id=settings.COSMOS_USERS_CONTAINER,
                partition_key={"paths": ["/id"], "kind": "Hash"},
                offer_throughput=400  # Minimum RU/s
            )
            
            # Create or get Docs container with /userId as partition key
            self.docs_container = await self.database.create_container_if_not_exists(
                id=settings.COSMOS_DOCS_CONTAINER,
                partition_key={"paths": ["/userId"], "kind": "Hash"},
                offer_throughput=400
            )
            
            logger.info("Cosmos DB initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Cosmos DB: {e}")
            raise
    
    async def close(self):
        """Close the Cosmos DB connection"""
        if self.client:
            await self.client.close()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            if self.database:
                # Try to read database properties
                props = await self.database.read()
                return {"connected": True, "database": props["id"]}
            return {"connected": False, "error": "Database not initialized"}
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    # User operations
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user document"""
        try:
            return await self.users_container.create_item(body=user_data)
        except exceptions.CosmosResourceExistsError:
            raise ValueError("User already exists")
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        try:
            return await self.users_container.read_item(
                item=user_id,
                partition_key=user_id
            )
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email"""
        query = "SELECT * FROM c WHERE c.email = @email"
        parameters = [{"name": "@email", "value": email}]
        
        items = self.users_container.query_items(
            query=query,
            parameters=parameters
        )
        
        async for item in items:
            return item
        return None
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a user document"""
        return await self.users_container.replace_item(
            item=user_id,
            body=user_data
        )
    
    # Document (Outline) operations
    async def create_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        return await self.docs_container.create_item(body=doc_data)
    
    async def get_document(self, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        try:
            return await self.docs_container.read_item(
                item=doc_id,
                partition_key=user_id
            )
        except exceptions.CosmosResourceNotFoundError:
            return None
    
    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a user"""
        query = "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC"
        parameters = [{"name": "@userId", "value": user_id}]
        
        items = self.docs_container.query_items(
            query=query,
            parameters=parameters,
            partition_key=user_id
        )
        
        documents = []
        async for item in items:
            documents.append(item)
        return documents
    
    async def update_document(self, doc_id: str, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a document"""
        return await self.docs_container.replace_item(
            item=doc_id,
            body=doc_data
        )
    
    async def delete_document(self, doc_id: str, user_id: str):
        """Delete a document"""
        await self.docs_container.delete_item(
            item=doc_id,
            partition_key=user_id
        )


# Global client instance
cosmos_client = CosmosDBClient()