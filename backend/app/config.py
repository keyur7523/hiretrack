from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(alias='DATABASE_URL')
    redis_url: str = Field(alias='REDIS_URL')
    jwt_secret: str = Field(alias='JWT_SECRET')
    jwt_algorithm: str = Field(default='HS256', alias='JWT_ALGORITHM')
    access_token_expire_minutes: int = Field(default=60, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    env: str = Field(default='dev', alias='ENV')
    cors_origins: str = Field(default='http://localhost:5173', alias='CORS_ORIGINS')

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=str(Path(__file__).resolve().parents[1] / '.env'),
        env_file_encoding='utf-8',
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
