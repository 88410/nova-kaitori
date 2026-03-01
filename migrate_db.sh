#!/bin/bash
# 数据库迁移脚本 - 添加 daily_high_prices 表

cd /home/ubuntu/.openclaw/workspace/nova-kaitori/backend

# 使用 Python 运行迁移
python3 << 'EOF'
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Date, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 创建引擎
engine = create_engine(settings.DATABASE_URL)

# 检查表是否存在
from sqlalchemy import inspect
inspector = inspect(engine)

if 'daily_high_prices' in inspector.get_table_names():
    print("daily_high_prices 表已存在，跳过创建")
else:
    print("创建 daily_high_prices 表...")
    
    # 创建表
    Base = declarative_base()
    
    class DailyHighPrice(Base):
        __tablename__ = "daily_high_prices"
        
        id = Column(Integer, primary_key=True, index=True)
        product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
        date = Column(Date, nullable=False, index=True)
        open_price = Column(Integer)
        high_price = Column(Integer)
        low_price = Column(Integer)
        close_price = Column(Integer)
        best_store_name = Column(String(100))
        created_at = Column(DateTime)
        
        __table_args__ = (
            UniqueConstraint('product_id', 'date', name='uix_daily_high'),
        )
    
    Base.metadata.create_all(engine, tables=[DailyHighPrice.__table__])
    print("daily_high_prices 表创建成功！")

print("迁移完成！")
EOF
