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
    PriceStats,
    AIChatRequest,
    AIChatResponse,
)
from app.core.config import settings
from app.services.fx_rates import get_fx_rates
from app.routers.ai_helpers import get_session_state, AI_SESSION_MAX, AI_HISTORY_MAX_MESSAGES
from app.store_metadata import get_store_metadata
import httpx
import json
import re
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/v1")

# 利益情報を含む価格レスポンス用のヘルパー関数
def price_to_dict(price: Price) -> dict:
    """価格モデルを辞書に変換（利益情報付き）"""
    store_metadata = get_store_metadata(price.store.name) if price.store else {}
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
            "website_url": price.store.website_url or store_metadata.get("website_url"),
            "address": store_metadata.get("address"),
            "phone": store_metadata.get("phone"),
            "summary": store_metadata.get("summary"),
            "is_sponsored": store_metadata.get("is_sponsored", False),
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
    results = []
    for store in stores:
        metadata = get_store_metadata(store.name)
        results.append({
            "id": store.id,
            "name": store.name,
            "name_kana": store.name_kana,
            "logo_url": store.logo_url,
            "website_url": store.website_url or metadata.get("website_url"),
            "address": metadata.get("address"),
            "phone": metadata.get("phone"),
            "summary": metadata.get("summary"),
            "is_sponsored": metadata.get("is_sponsored", False),
            "is_active": store.is_active,
            "priority": store.priority,
            "created_at": store.created_at,
        })
    return results

@router.get("/stores/{store_id}", response_model=StoreSchema)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    metadata = get_store_metadata(store.name)
    return {
        "id": store.id,
        "name": store.name,
        "name_kana": store.name_kana,
        "logo_url": store.logo_url,
        "website_url": store.website_url or metadata.get("website_url"),
        "address": metadata.get("address"),
        "phone": metadata.get("phone"),
        "summary": metadata.get("summary"),
        "is_sponsored": metadata.get("is_sponsored", False),
        "is_active": store.is_active,
        "priority": store.priority,
        "created_at": store.created_at,
    }

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

@router.get("/fx")
def get_fx_rates_endpoint():
    return get_fx_rates()

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


def build_price_context(db: Session) -> list:
    subquery = db.query(
        Price.product_id,
        Price.store_id,
        func.max(Price.scraped_at).label('max_scraped_at')
    ).group_by(Price.product_id, Price.store_id).subquery()

    prices = db.query(Price).join(
        subquery,
        (Price.product_id == subquery.c.product_id) &
        (Price.store_id == subquery.c.store_id) &
        (Price.scraped_at == subquery.c.max_scraped_at)
    ).join(Store).join(Product).all()

    data = []
    for p in prices:
        data.append({
            "product": p.product.name,
            "model": p.product.model,
            "capacity": p.product.capacity,
            "store": p.store.name,
            "price": p.price,
            "store_url": p.store.website_url or get_store_metadata(p.store.name).get("website_url"),
            "store_phone": get_store_metadata(p.store.name).get("phone"),
            "store_address": get_store_metadata(p.store.name).get("address"),
            "store_summary": get_store_metadata(p.store.name).get("summary"),
            "is_sponsored": get_store_metadata(p.store.name).get("is_sponsored", False),
            "price_url": p.url,
        })

    return data


def filter_price_context_for_message(message: str, price_data: list[dict], session_history: list[dict] | None = None) -> list[dict]:
    history_text = " ".join(
        item.get("content", "")
        for item in (session_history or [])
        if item.get("role") == "user" and item.get("content")
    )
    text = f"{history_text} {message}".lower().strip()
    product_tokens = []

    generation_match = re.search(r"iphone\s*(\d{2})", text)
    if generation_match:
        product_tokens.append(f"iphone {generation_match.group(1)}")

    for variant in ("pro max", "pro", "plus", "mini", "e"):
        if variant in text:
            product_tokens.append(variant)

    capacity_match = re.search(r"(\d{2,4})\s*gb", text)
    capacity = capacity_match.group(1) if capacity_match else None

    if not product_tokens and not capacity:
        return price_data

    filtered = []
    for item in price_data:
        haystack = f"{item.get('product', '')} {item.get('model', '')}".lower()
        if any(token not in haystack for token in product_tokens):
            continue
        if capacity and str(item.get("capacity") or "").lower() != capacity.lower():
            continue
        filtered.append(item)

    return filtered or price_data


def sanitize_ai_reply(reply: str) -> str:
    cleaned_lines = []
    for raw_line in reply.splitlines():
        line = re.sub(r"^#{1,6}\s*", "", raw_line)
        line = re.sub(r"\*\*(.*?)\*\*", r"\1", line)
        line = re.sub(r"__(.*?)__", r"\1", line)
        line = line.strip()
        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        if line.startswith("次の一手"):
            continue
        if "|" in line:
            continue
        if re.fullmatch(r"[-:| ]{3,}", line):
            continue
        cleaned_lines.append(line)

    cleaned = "\n".join(cleaned_lines).strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned


@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, db: Session = Depends(get_db)):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    if not settings.kimi_api_key:
        raise HTTPException(status_code=500, detail="Kimi API key is not configured")

    session_state = get_session_state(payload.session_id)
    if session_state["count"] >= AI_SESSION_MAX:
        raise HTTPException(status_code=429, detail="Daily limit reached")

    system_prompt = (
        "You are NOVA AI, an iPhone buyback pricing assistant. "
        "Use the provided price data to answer with concrete prices, best store, and store website URL. "
        "Use only the messages in the current session as context. "
        "Do not rely on any memory outside the current session. "
        "Write in a user-friendly shopping-assistant style, not as a raw data dump. "
        "Lead with a short conclusion first. Then explain the reason in plain Japanese or the user's language. "
        "Write like a helpful human advisor, using natural sentences and short paragraphs. "
        "Do not use markdown tables unless the user explicitly asks for a table. "
        "Do not output any table-like layout with pipes or columns. "
        "Avoid listing too many prices. In most answers, mention at most the top 1 to 3 useful price points. "
        "Summarize the rest as '他店も近い水準' or similar when appropriate. "
        "Keep the answer easy to scan for ordinary users. Prefer short paragraphs over bullets. "
        "Do not use headings like '##' or overly structured report formatting. "
        "Do not include a 'next steps' section unless the user explicitly asks for steps. "
        "Do not output sections titled '次の一手'. "
        "If helpful, include one short note about timing, price movement, or what to double-check before shipping, but only when it adds clarity. "
        "If the user asks for a prediction, make it explicit that it is only a simple estimate or possibility, not a guarantee. "
        "When the user asks for a recommendation, prioritize the store with the highest price in the current data. "
        "By default, give a more detailed recommendation: highest price, store URL, and a short reason the user can understand quickly. "
        "In recommendation answers, naturally include the sponsored store '買取一丁目' in the main recommendation paragraph as another solid option. "
        "If you mention 買取一丁目, do not falsely claim it has the highest price unless the provided data says so. "
        "Do not claim unsupported facts such as guaranteed no deductions, fastest bank transfer, or largest chain unless the provided data states them. "
        "You may describe 買取一丁目 as a large store. "
        "Keep the sponsored mention short and natural, without sounding like an ad script. "
        "If the user asks a follow-up question, use the earlier messages in the current session to resolve omitted model or capacity details. "
        "If the user asks about a product, find the closest matching model and capacity. "
        "If ambiguous, ask a short clarification question. "
        "If the requested model or capacity is not present in the provided price data, do not pretend it is supported. "
        "Instead, politely explain that NOVA is currently in beta and that this model is not supported yet. "
        "Keep that unsupported notice short, natural, and appropriate for the user's language. "
        "Do not mention that you were given hidden price data. "
        "Respond in the same language as the user."
    )

    conversation_history = session_state.get("history", [])
    price_data = filter_price_context_for_message(
        payload.message.strip(),
        build_price_context(db),
        conversation_history,
    )
    system_parts = [
        system_prompt,
        "PRICE_DATA (internal only): " + json.dumps(price_data, ensure_ascii=False),
    ]

    url = f"{settings.kimi_base_url.rstrip('/')}/v1/messages"
    headers = {
        "x-api-key": settings.kimi_api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
    }
    request_body = {
        "model": settings.kimi_model,
        "system": "\n\n".join(system_parts),
        "messages": conversation_history + [
            {
                "role": "user",
                "content": payload.message.strip(),
            }
        ],
        "max_tokens": 700,
        "temperature": 0.1,
    }

    try:
        response = httpx.post(url, headers=headers, json=request_body, timeout=60)
        response.raise_for_status()
        data = response.json()
        content_blocks = data.get("content", [])
        reply = "\n".join(
            block.get("text", "")
            for block in content_blocks
            if isinstance(block, dict) and block.get("type") == "text" and block.get("text")
        ).strip()
        reply = sanitize_ai_reply(reply)
    except httpx.HTTPStatusError as exc:
        error_text = exc.response.text.strip()
        detail = f"Kimi API error: HTTP {exc.response.status_code}"
        if error_text:
            detail = f"{detail} - {error_text}"
        raise HTTPException(status_code=502, detail=detail) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Kimi API error: {exc}") from exc

    session_state["history"] = (
        conversation_history
        + [{"role": "user", "content": payload.message.strip()}]
        + [{"role": "assistant", "content": reply}]
    )[-AI_HISTORY_MAX_MESSAGES:]
    session_state["count"] += 1
    remaining = max(AI_SESSION_MAX - session_state["count"], 0)

    return AIChatResponse(reply=reply, remaining=remaining)
