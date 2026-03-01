"""
数据库重新设计方案

1. price_records - 主价格表 (商品-店铺-价格-日期)
2. daily_high_prices - 每日最高价格历史 (用于K线)

K线数据结构:
- open: 当天第一个价格
- high: 当天最高价格  
- low: 当天最低价格
- close: 当天最后一个价格
- date: 日期
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, date

class PriceRecord(Base):
    """价格记录表 - 记录每个商品在每个店铺的每次价格变动"""
    __tablename__ = "price_records"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    price = Column(Integer, nullable=False)  # 收购价格
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)  # 记录时间
    date = Column(Date, default=date.today, index=True)  # 日期（方便查询）
    
    # 关系
    product = relationship("Product", back_populates="price_records")
    store = relationship("Store", back_populates="price_records")
    
    __table_args__ = (
        UniqueConstraint('product_id', 'store_id', 'date', name='uix_price_per_day'),
    )

class DailyHighPrice(Base):
    """每日最高价格历史 - 用于K线图表"""
    __tablename__ = "daily_high_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # K线数据
    open_price = Column(Integer)   # 开盘价（当天第一个最高价格）
    high_price = Column(Integer)   # 最高价
    low_price = Column(Integer)    # 最低价
    close_price = Column(Integer)  # 收盘价（当天最后一个最高价格）
    
    # 最佳店铺信息
    best_store_name = Column(String(100))  # 当天最高价格的店铺
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    product = relationship("Product", back_populates="daily_highs")
    
    __table_args__ = (
        UniqueConstraint('product_id', 'date', name='uix_daily_high'),
    )

# 需要修改Product模型，添加关系
# price_records = relationship("PriceRecord", back_populates="product", order_by="PriceRecord.recorded_at.desc()")
# daily_highs = relationship("DailyHighPrice", back_populates="product", order_by="DailyHighPrice.date.desc()")
