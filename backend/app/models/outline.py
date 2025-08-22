"""Outline models and schemas"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class OutlineItem(BaseModel):
    """Schema for an outline item"""
    id: str
    content: str
    parentId: Optional[str] = None
    outlineId: str
    order: int = 0
    children: List['OutlineItem'] = []
    style: Optional[str] = None  # 'header', 'code', 'quote', 'normal'
    formatting: Optional[Dict[str, Any]] = None  # {'bold': true, 'italic': true, 'size': 'large'}
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class OutlineBase(BaseModel):
    """Base outline schema"""
    title: str


class OutlineCreate(OutlineBase):
    """Schema for creating an outline"""
    pass  # userId will come from authenticated user


class Outline(OutlineBase):
    """Outline schema for database"""
    id: str
    userId: str
    itemCount: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class OutlineWithItems(Outline):
    """Outline with nested items"""
    items: List[OutlineItem] = []


class ItemCreate(BaseModel):
    """Schema for creating an outline item"""
    content: str
    parentId: Optional[str] = None
    style: Optional[str] = None
    formatting: Optional[Dict[str, Any]] = None


class ItemUpdate(BaseModel):
    """Schema for updating an outline item"""
    content: Optional[str] = None
    parentId: Optional[str] = None
    order: Optional[int] = None
    style: Optional[str] = None
    formatting: Optional[Dict[str, Any]] = None


# Batch operation models
class OperationType(str, Enum):
    """Types of batch operations"""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    MOVE = "MOVE"


class BatchOperation(BaseModel):
    """Single operation in a batch"""
    type: OperationType
    id: Optional[str] = None  # Not needed for CREATE
    data: Optional[Dict[str, Any]] = None  # For CREATE and UPDATE
    parentId: Optional[str] = None  # For CREATE and MOVE
    position: Optional[int] = None  # For CREATE and MOVE


class BatchOperationRequest(BaseModel):
    """Request for batch operations"""
    operations: List[BatchOperation]


class BatchOperationResponse(BaseModel):
    """Response from batch operations"""
    success: bool
    items: List[OutlineItem]
    errors: List[str] = []


class TemplateRequest(BaseModel):
    """Request for creating items from template"""
    items: List[Dict[str, Any]]  # Template structure
    clearExisting: bool = False  # Whether to clear existing items first


# Allow forward references
OutlineItem.model_rebuild()