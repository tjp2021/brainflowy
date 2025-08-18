"""Outline models and schemas"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


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
    userId: str


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


# Allow forward references
OutlineItem.model_rebuild()