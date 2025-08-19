"""Application configuration"""
from typing import List, Optional
from pydantic import Field
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    PROJECT_NAME: str = "BrainFlowy"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5176",
    ]
    
    # Azure Cosmos DB
    COSMOS_ENDPOINT: str = Field(default="https://localhost:8081")  # Emulator default
    COSMOS_KEY: str = Field(
        default="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
    )  # Emulator default key
    COSMOS_DATABASE_NAME: str = "BrainFlowy"
    COSMOS_USERS_CONTAINER: str = "Users"
    COSMOS_DOCS_CONTAINER: str = "Docs"
    
    # OpenAI (for Whisper and GPT)
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    
    # Claude API
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    
    # Test Mode
    TESTING: bool = Field(default=False)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()