from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str = "postgresql://app_user:change_me@localhost:5432/nova_kaitori"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    sheet_url: str = ""
    scraper_interval_minutes: int = 30
    scraper_timeout_seconds: int = 60
    ad_enabled: bool = False
    ad_provider: str = "none"
    ad_client_id: str = ""
    ad_slot_id: str = ""
    kimi_api_key: str = ""
    kimi_model: str = "kimi-k2.5"
    kimi_base_url: str = "https://api.moonshot.cn/v1"
    codex_proxy_url: str = ""
    codex_model: str = "gpt-5.4"
    openai_api_key: str = ""
    openai_model: str = "gpt-5.4-nano"
    openai_base_url: str = "https://api.openai.com/v1"
    fx_rates_url: str = "https://open.er-api.com/v6/latest/JPY"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"

settings = Settings()
