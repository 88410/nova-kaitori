from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    jan_code = Column(String(13), unique=True, index=True, nullable=True)
    name = Column(String(255), index=True, nullable=False)
    brand = Column(String(50), default="Apple")
    model = Column(String(100), nullable=False)
    capacity = Column(String(20), nullable=True)  # 128GB, 256GB, etc.
    color = Column(String(50), nullable=True)
    carrier = Column(String(50), nullable=True)  # SIMフリー, docomo, etc.
    condition = Column(String(50), default="新品")  # 新品, 中古A, 中古B, etc.
    image_url = Column(String(500), nullable=True)
    retail_price = Column(Integer, nullable=True)  # 原价（新品時の値段）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    prices = relationship("Price", back_populates="product", cascade="all, delete-orphan")

class Store(Base):
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    name_kana = Column(String(100), nullable=True)
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    is_active = Column(Integer, default=1)
    priority = Column(Integer, default=0)  # 表示順
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    prices = relationship("Price", back_populates="store")

class Price(Base):
    __tablename__ = "prices"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    price = Column(Integer, nullable=False)  # 円
    price_change = Column(Integer, default=0)  # 前回比
    price_change_percent = Column(Float, default=0.0)
    is_best_price = Column(Integer, default=0)
    url = Column(String(1000), nullable=True)  # 買取ページURL
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="prices")
    store = relationship("Store", back_populates="prices")
    
    # Indexes
    __table_args__ = (
        Index('ix_prices_product_store', 'product_id', 'store_id'),
        Index('ix_prices_scraped_at', 'scraped_at'),
    )
    
    @property
    def profit(self):
        """利润 = 買取価格 - 原价"""
        if self.product and self.product.retail_price:
            return self.price - self.product.retail_price
        return None
    
    @property
    def profit_percent(self):
        """利润率"""
        if self.product and self.product.retail_price and self.product.retail_price > 0:
            return round((self.price - self.product.retail_price) / self.product.retail_price * 100, 2)
        return None

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    price = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('ix_price_history_product_store_date', 'product_id', 'store_id', 'recorded_at'),
    )
