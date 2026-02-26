from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    """iPhone製品モデル"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    jan_code = Column(String(13), unique=True, index=True, nullable=True)  # JANコード
    name = Column(String(255), index=True, nullable=False)  # 製品名
    brand = Column(String(50), default="Apple")  # メーカー
    model = Column(String(100), nullable=False)  # モデル名（iPhone 17 Pro Max等）
    capacity = Column(String(20), nullable=True)  # 容量（128GB, 256GB等）
    color = Column(String(50), nullable=True)  # カラー
    carrier = Column(String(50), nullable=True)  # キャリア（SIMフリー, docomo等）
    condition = Column(String(50), default="新品")  # 状態（新品, 中古A, 中古B等）
    image_url = Column(String(500), nullable=True)  # 製品画像URL
    retail_price = Column(Integer, nullable=True)  # 公式価格（新品時の価格）
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 作成日時
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # 更新日時
    
    # リレーションシップ
    prices = relationship("Price", back_populates="product", cascade="all, delete-orphan")

class Store(Base):
    """買取店舗モデル"""
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # 店舗名
    name_kana = Column(String(100), nullable=True)  # 店舗名カナ
    logo_url = Column(String(500), nullable=True)  # ロゴ画像URL
    website_url = Column(String(500), nullable=True)  # 公式サイトURL
    is_active = Column(Integer, default=1)  # 有効フラグ
    priority = Column(Integer, default=0)  # 表示順
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 作成日時
    
    # リレーションシップ
    prices = relationship("Price", back_populates="store")

class Price(Base):
    """買取価格モデル"""
    __tablename__ = "prices"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)  # 製品ID
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)  # 店舗ID
    price = Column(Integer, nullable=False)  # 買取価格（円）
    price_change = Column(Integer, default=0)  # 前回比の価格変動
    price_change_percent = Column(Float, default=0.0)  # 変動率（%）
    is_best_price = Column(Integer, default=0)  # 最高価格フラグ
    url = Column(String(1000), nullable=True)  # 買取ページURL
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())  # スクレイピング日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 作成日時
    
    # リレーションシップ
    product = relationship("Product", back_populates="prices")
    store = relationship("Store", back_populates="prices")
    
    # インデックス
    __table_args__ = (
        Index('ix_prices_product_store', 'product_id', 'store_id'),
        Index('ix_prices_scraped_at', 'scraped_at'),
    )
    
    @property
    def profit(self):
        """利益 = 買取価格 - 公式価格"""
        if self.product and self.product.retail_price:
            return self.price - self.product.retail_price
        return None
    
    @property
    def profit_percent(self):
        """利益率（%）"""
        if self.product and self.product.retail_price and self.product.retail_price > 0:
            return round((self.price - self.product.retail_price) / self.product.retail_price * 100, 2)
        return None

class PriceHistory(Base):
    """価格履歴モデル"""
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)  # 製品ID
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)  # 店舗ID
    price = Column(Integer, nullable=False)  # 買取価格
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())  # 記録日時
    
    # インデックス
    __table_args__ = (
        Index('ix_price_history_product_store_date', 'product_id', 'store_id', 'recorded_at'),
    )
