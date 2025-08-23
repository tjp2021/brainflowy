"""User models and schemas"""
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserSettings(BaseModel):
    """User settings schema"""
    theme: str = "light"
    fontSize: int = 16
    autoSave: bool = True
    shortcuts: Dict[str, str] = {}


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str


class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str
    displayName: str


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class User(UserBase):
    """User schema for database"""
    id: str
    settings: UserSettings = Field(default_factory=UserSettings)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class UserInDB(User):
    """User schema with hashed password"""
    hashedPassword: str


class AuthResponse(BaseModel):
    """Authentication response schema"""
    user: User
    accessToken: str
    refreshToken: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refreshToken: str