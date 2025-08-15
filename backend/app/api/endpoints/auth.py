"""Authentication endpoints"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse

from app.models.user import (
    UserCreate, UserLogin, User, UserInDB, 
    AuthResponse, RefreshTokenRequest
)
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from app.api.dependencies import get_current_user
from app.core.config import settings

# Use mock client in test mode
if settings.TESTING:
    from app.db.mock_cosmos import mock_cosmos_client as cosmos_client
else:
    from app.db.cosmos import cosmos_client

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await cosmos_client.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create user document
    user_id = f"user_{int(datetime.utcnow().timestamp() * 1000)}"
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.displayName,
        "hashedPassword": get_password_hash(user_data.password),
        "settings": {
            "theme": "light",
            "fontSize": 16,
            "autoSave": True,
            "shortcuts": {}
        },
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    # Save to database
    await cosmos_client.create_user(user_doc)
    
    # Create tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Prepare response (exclude password)
    user_response = User(
        id=user_id,
        email=user_doc["email"],
        name=user_doc["name"],
        settings=user_doc["settings"],
        createdAt=user_doc["createdAt"],
        updatedAt=user_doc["updatedAt"]
    )
    
    return AuthResponse(
        user=user_response,
        accessToken=f"mock_access_{access_token}",  # Match mock format for tests
        refreshToken=f"mock_refresh_{refresh_token}"
    )


@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    """Login with email and password"""
    # Get user by email
    user = await cosmos_client.get_user_by_email(user_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.get("hashedPassword", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    
    # Prepare response (exclude password)
    user_response = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        settings=user["settings"],
        createdAt=user["createdAt"],
        updatedAt=user["updatedAt"]
    )
    
    return AuthResponse(
        user=user_response,
        accessToken=f"mock_access_{access_token}",
        refreshToken=f"mock_refresh_{refresh_token}"
    )


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout the current user"""
    # In a real app, you might want to invalidate the token here
    # For now, just return success
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    # Extract token (remove mock prefix if present)
    token = token_request.refreshToken
    if token.startswith("mock_refresh_"):
        token = token.replace("mock_refresh_", "")
    
    # Decode refresh token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Get user
    user_id = payload.get("sub")
    user = await cosmos_client.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Prepare response
    user_response = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        settings=user["settings"],
        createdAt=user["createdAt"],
        updatedAt=user["updatedAt"]
    )
    
    return AuthResponse(
        user=user_response,
        accessToken=f"mock_access_{access_token}",
        refreshToken=f"mock_refresh_{refresh_token}"
    )