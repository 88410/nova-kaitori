from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "nova_kaitori",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.services.scraper"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tokyo",
    enable_utc=True,
    beat_schedule={
        "scrape-all-prices": {
            "task": "app.services.scraper.scrape_all_prices",
            "schedule": settings.scraper_interval_minutes * 60,  # seconds
        },
    },
)
