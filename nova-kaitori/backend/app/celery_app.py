from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "nova_kaitori",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.services.sheet_scraper"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tokyo",
    enable_utc=True,
    beat_schedule={
        "scrape-sheet-hourly": {
            "task": "app.services.sheet_scraper.scrape_sheet_task",
            "schedule": 3600.0,  # 1小时 = 3600秒
        },
    },
)
