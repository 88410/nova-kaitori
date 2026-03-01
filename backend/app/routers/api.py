from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from app.database import get_db
from app.models.models import Product, Store, Price, PriceHistory, DailyHighPrice
from app.schemas.schemas import (
    Product as ProductSchema,
    ProductCreate,
    Store as StoreSchema,
    Price as PriceSchema,
    PriceWithProduct,
    ProductSearchResult,
    PriceHistoryEntry,
    ProductPriceHistory,
    PriceStats
)
import json

router = APIRouter(prefix="/api/v1")

# 利益情報を含む価格レスポンス用のヘルパー関数
def price_to_dict(price: Price) -> dict:
    """価格モデルを辞書に変換（利益情報付き）"""
    return {
        "id": price.id,
        "product_id": price.product_id,
        "store_id": price.store_id,
        "price": price.price,
        "price_change": price.price_change,
        "price_change_percent": price.price_change_percent,
        "is_best_price": price.is_best_price,
        "url": price.url,
        "scraped_at": price.scraped_at.isoformat() if price.scraped_at else None,
        "created_at": price.created_at.isoformat() if price.created_at else None,
        "store": {
            "id": price.store.id,
            "name": price.store.name,
            "name_kana": price.store.name_kana,
            "logo_url": price.store.logo_url,
            "website_url": price.store.website_url,
            "is_active": price.store.is_active,
            "priority": price.store.priority,
            "created_at": price.store.created_at.isoformat() if price.store.created_at else None,
        } if price.store else None,
        "product": {
            "id": price.product.id,
            "name": price.product.name,
            "model": price.product.model,
            "capacity": price.product.capacity,
            "color": price.product.color,
            "carrier": price.product.carrier,
            "condition": price.product.condition,
            "image_url": price.product.image_url,
            "retail_price": price.product.retail_price,
        } if price.product else None,
        "profit": price.profit,
        "profit_percent": price.profit_percent,
    }

# Stores
@router.get("/stores", response_model=List[StoreSchema])
def get_stores(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    stores = db.query(Store).filter(Store.is_active == 1).order_by(Store.priority.desc()).offset(skip).limit(limit).all()
    return stores

@router.get("/stores/{store_id}", response_model=StoreSchema)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

# Products
@router.get("/products", response_model=List[ProductSchema])
def get_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    model: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(Product)
    if model:
        query = query.filter(Product.model.ilike(f"%{model}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/products/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# Prices
@router.get("/prices")
def get_prices(
    db: Session = Depends(get_db),
    product_id: Optional[int] = None,
    store_id: Optional[int] = None,
    limit: int = 1000
):
    # サブクエリ: 各 product_id + store_id の最新 scraped_at を取得
    subquery = db.query(
        Price.product_id,
        Price.store_id,
        func.max(Price.scraped_at).label('max_scraped_at')
    ).group_by(Price.product_id, Price.store_id).subquery()
    
    # メインクエリ: 最新の価格のみを取得
    query = db.query(Price).join(
        subquery,
        (Price.product_id == subquery.c.product_id) &
        (Price.store_id == subquery.c.store_id) &
        (Price.scraped_at == subquery.c.max_scraped_at)
    ).join(Store).join(Product)
    
    if product_id:
        query = query.filter(Price.product_id == product_id)
    if store_id:
        query = query.filter(Price.store_id == store_id)
    
    prices = query.order_by(desc(Price.price)).limit(limit).all()
    return [price_to_dict(p) for p in prices]

@router.get("/prices/latest/{product_id}")
def get_latest_prices(product_id: int, db: Session = Depends(get_db)):
    # Get latest price for each store
    subquery = db.query(
        Price.store_id,
        func.max(Price.scraped_at).label('max_scraped_at')
    ).filter(Price.product_id == product_id).group_by(Price.store_id).subquery()
    
    prices = db.query(Price).join(
        subquery,
        (Price.store_id == subquery.c.store_id) & 
        (Price.scraped_at == subquery.c.max_scraped_at)
    ).filter(Price.product_id == product_id).all()
    
    return [price_to_dict(p) for p in prices]

@router.get("/prices/compare/{jan_code}", response_model=ProductSearchResult)
def compare_prices_by_jan(jan_code: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.jan_code == jan_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    prices = db.query(Price).filter(Price.product_id == product.id).order_by(desc(Price.scraped_at)).all()
    
    seen_stores = set()
    latest_prices = []
    for p in prices:
        if p.store_id not in seen_stores:
            seen_stores.add(p.store_id)
            latest_prices.append(p)
    
    latest_prices.sort(key=lambda x: x.price, reverse=True)
    best_price = latest_prices[0].price if latest_prices else None
    
    return ProductSearchResult(
        product=product,
        best_price=best_price,
        store_count=len(latest_prices),
        prices=latest_prices
    )

# Price History
@router.get("/history/{product_id}/{store_id}", response_model=ProductPriceHistory)
def get_price_history(
    product_id: int,
    store_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timedelta
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    since = datetime.now() - timedelta(days=days)
    history = db.query(PriceHistory).filter(
        PriceHistory.product_id == product_id,
        PriceHistory.store_id == store_id,
        PriceHistory.recorded_at >= since
    ).order_by(PriceHistory.recorded_at).all()
    
    return ProductPriceHistory(
        product=product,
        store=store,
        history=[PriceHistoryEntry(price=h.price, recorded_at=h.recorded_at) for h in history]
    )

# K-line (candlestick) data for product price history
@router.get("/prices/kline/{product_id}")
def get_kline_data(
    product_id: int,
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """获取产品的K线数据（每日最高价格）"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    since = datetime.now() - timedelta(days=days)
    
    # 从DailyHighPrice表获取K线数据
    daily_data = db.query(DailyHighPrice).filter(
        DailyHighPrice.product_id == product_id,
        DailyHighPrice.date >= since
    ).order_by(DailyHighPrice.date).all()
    
    # 如果没有DailyHighPrice数据，从Price表实时计算
    if not daily_data:
        # 获取历史最高价格数据
        subquery = db.query(
            func.date(Price.scraped_at).label('date'),
            func.max(Price.price).label('high_price'),
            func.min(Price.price).label('low_price')
        ).filter(
            Price.product_id == product_id,
            Price.scraped_at >= since
        ).group_by(func.date(Price.scraped_at)).subquery()
        
        # 获取每天最早和最晚的价格作为开盘和收盘价
        daily_stats = db.query(subquery).order_by(subquery.c.date).all()
        
        kline_data = []
        for stat in daily_stats:
            # 获取当天的第一个价格（开盘）
            open_price = db.query(Price).filter(
                Price.product_id == product_id,
                func.date(Price.scraped_at) == stat.date
            ).order_by(Price.scraped_at.asc()).first()
            
            # 获取当天的最后一个价格（收盘）
            close_price = db.query(Price).filter(
                Price.product_id == product_id,
                func.date(Price.scraped_at) == stat.date
            ).order_by(Price.scraped_at.desc()).first()
            
            # 获取当天最高价的店铺
            best_store = db.query(Price, Store).join(Store).filter(
                Price.product_id == product_id,
                func.date(Price.scraped_at) == stat.date,
                Price.price == stat.high_price
            ).order_by(Price.scraped_at.desc()).first()
            
            kline_data.append({
                "date": stat.date.isoformat(),
                "open": open_price.price if open_price else stat.high_price,
                "high": stat.high_price,
                "low": stat.low_price,
                "close": close_price.price if close_price else stat.high_price,
                "best_store": best_store.Store.name if best_store else None
            })
        
        return kline_data
    
    # 使用DailyHighPrice表的数据
    return [{
        "date": d.date.isoformat(),
        "open": d.open_price,
        "high": d.high_price,
        "low": d.low_price,
        "close": d.close_price,
        "best_store": d.best_store_name
    } for d in daily_data]

# Batch K-line data for multiple products
@router.get("/prices/kline-batch")
def get_batch_kline_data(
    product_ids: str = Query(..., description="Comma-separated product IDs"),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """批量获取多个产品的K线数据"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    ids = [int(x.strip()) for x in product_ids.split(",") if x.strip().isdigit()]
    since = datetime.now() - timedelta(days=days)
    
    result = {}
    for product_id in ids:
        # 获取每天最高价格
        daily_highs = db.query(
            func.date(Price.scraped_at).label('date'),
            func.max(Price.price).label('high_price')
        ).filter(
            Price.product_id == product_id,
            Price.scraped_at >= since
        ).group_by(func.date(Price.scraped_at)).order_by('date').all()
        
        kline = []
        for dh in daily_highs:
            # 获取当天所有价格
            day_prices = db.query(Price).filter(
                Price.product_id == product_id,
                func.date(Price.scraped_at) == dh.date
            ).order_by(Price.scraped_at).all()
            
            if day_prices:
                prices = [p.price for p in day_prices]
                kline.append({
                    "date": dh.date.isoformat(),
                    "open": prices[0],
                    "high": max(prices),
                    "low": min(prices),
                    "close": prices[-1]
                })
        
        result[product_id] = kline
    
    return result

# Stats
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    
    total_products = db.query(func.count(Product.id)).scalar()
    total_stores = db.query(func.count(Store.id)).filter(Store.is_active == 1).scalar()
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_updates = db.query(func.count(Price.id)).filter(Price.scraped_at >= today).scalar()
    
    yesterday = today - timedelta(days=1)
    price_changes_24h = db.query(func.count(Price.id)).filter(
        Price.scraped_at >= yesterday,
        Price.price_change != 0
    ).scalar()
    
    # 最新の更新時刻を取得
    latest_price = db.query(Price).order_by(desc(Price.scraped_at)).first()
    last_updated = latest_price.scraped_at.isoformat() if latest_price and latest_price.scraped_at else None
    
    return {
        "total_products": total_products or 0,
        "total_stores": total_stores or 0,
        "today_updates": today_updates or 0,
        "price_changes_24h": price_changes_24h or 0,
        "last_updated": last_updated
    }

# Search
@router.get("/search")
def search_products(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.name.ilike(f"%{q}%") | Product.model.ilike(f"%{q}%")
    ).limit(20).all()
    
    results = []
    for product in products:
        prices = db.query(Price).filter(Price.product_id == product.id).order_by(desc(Price.scraped_at)).limit(20).all()
        seen_stores = set()
        latest_prices = []
        for p in prices:
            if p.store_id not in seen_stores:
                seen_stores.add(p.store_id)
                latest_prices.append(price_to_dict(p))
        
        best_price_val = max([p['price'] for p in latest_prices]) if latest_prices else None
        results.append({
            "product": product,
            "best_price": best_price_val,
            "store_count": len(latest_prices),
            "prices": latest_prices
        })
    
    return results
