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

    # AI Screening settings
    ai_provider: str = Field(default='openai', alias='AI_PROVIDER')  # 'anthropic' or 'openai'
    anthropic_api_key: str = Field(default='', alias='ANTHROPIC_API_KEY')
    openai_api_key: str = Field(default='', alias='OPENAI_API_KEY')
    ai_screening_model: str = Field(default='', alias='AI_SCREENING_MODEL')
    ai_screening_enabled: bool = Field(default=True, alias='AI_SCREENING_ENABLED')

    @property
    def effective_ai_model(self) -> str:
        if self.ai_screening_model:
            return self.ai_screening_model
        if self.ai_provider == 'anthropic':
            return 'claude-3-5-haiku-20241022'
        return 'gpt-4o-mini'

    @property
    def ai_api_key(self) -> str:
        if self.ai_provider == 'anthropic':
            return self.anthropic_api_key
        return self.openai_api_key

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=str(Path(__file__).resolve().parents[1] / '.env'),
        env_file_encoding='utf-8',
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
