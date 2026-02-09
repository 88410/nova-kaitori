from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Store Schemas
class StoreBase(BaseModel):
    name: str
    name_kana: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    is_active: int = 1
    priority: int = 0

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    jan_code: Optional[str] = None
    name: str
    brand: str = "Apple"
    model: str
    capacity: Optional[str] = None
    color: Optional[str] = None
    carrier: Optional[str] = None
    condition: str = "新品"
    image_url: Optional[str] = None
    retail_price: Optional[int] = None  # 原价

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Price Schemas
class PriceBase(BaseModel):
    product_id: int
    store_id: int
    price: int
    price_change: int = 0
    price_change_percent: float = 0.0
    is_best_price: int = 0
    url: Optional[str] = None

class PriceCreate(PriceBase):
    pass

class Price(PriceBase):
    id: int
    scraped_at: datetime
    created_at: datetime
    store: Optional[Store] = None
    profit: Optional[int] = None
    profit_percent: Optional[float] = None
    
    class Config:
        from_attributes = True

# Price with Product info (for listing)
class PriceWithProduct(BaseModel):
    id: int
    price: int
    price_change: int
    price_change_percent: float
    is_best_price: int
    scraped_at: datetime
    store: Store
    product: Product
    
    class Config:
        from_attributes = True

# Price History Schema
class PriceHistoryEntry(BaseModel):
    price: int
    recorded_at: datetime
    
    class Config:
        from_attributes = True

class ProductPriceHistory(BaseModel):
    product: Product
    store: Store
    history: List[PriceHistoryEntry]

# Search/Filter Schemas
class ProductSearchResult(BaseModel):
    product: Product
    best_price: Optional[int] = None
    store_count: int = 0
    prices: List[Price] = []

class PriceFilter(BaseModel):
    product_id: Optional[int] = None
    store_id: Optional[int] = None
    model: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None

# Stats
class PriceStats(BaseModel):
    total_products: int
    total_stores: int
    today_updates: int
    price_changes_24h: int
