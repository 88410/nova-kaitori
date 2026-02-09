from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str = "postgresql://nova:nova_password@localhost:5432/nova_kaitori"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    scraper_interval_minutes: int = 30
    scraper_timeout_seconds: int = 60
    ad_enabled: bool = False
    ad_provider: str = "none"
    ad_client_id: str = ""
    ad_slot_id: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"

settings = Settings()
