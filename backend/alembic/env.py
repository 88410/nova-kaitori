# Alembic configuration
from app.database import Base
from app.models.models import Product, Store, Price, PriceHistory

target_metadata = Base.metadata
