from collections import defaultdict
from datetime import date, datetime, timedelta
from math import sqrt
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import DailyHighPrice, Price, PriceHistory, Product, Store
from app.routers.common import latest_prices_query, price_to_dict
from app.services.daily_highs import refresh_daily_highs_for_product
from app.services.market_average import build_market_average_batch, build_market_average_for_product
from app.schemas.schemas import (
    PriceHistoryEntry,
    ProductPriceHistory,
    ProductSearchResult,
)

router = APIRouter()

JST = ZoneInfo("Asia/Tokyo")
VALID_PRICE_FLOOR = 10000
MAX_STORE_SERIES = 24


def _local_time(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=JST)
    return value.astimezone(JST)


def _bucket_time(value: datetime, interval: str) -> datetime | date:
    local = _local_time(value)
    if interval == "1h":
        return local.replace(minute=0, second=0, microsecond=0)
    if interval == "1w":
        return local.date() - timedelta(days=local.weekday())
    return local.date()


def _bucket_key(value: datetime | date, interval: str) -> str:
    if isinstance(value, datetime):
        return value.isoformat(timespec="hours")
    return value.isoformat()


def _bucket_label(value: datetime | date, interval: str) -> str:
    if isinstance(value, datetime):
        return value.strftime("%m/%d %H:%M")
    if interval == "1w":
        return f"{value.strftime('%m/%d')}週"
    return value.strftime("%m/%d")


def _price_ceiling(product: Product) -> int:
    if product.retail_price and product.retail_price > 0:
        return int(max(product.retail_price * 3, product.retail_price + 300000))
    return 1000000


def _round_value(value: float | None) -> float | None:
    if value is None:
        return None
    return round(value, 2)


def _sma(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = []
    for index in range(len(values)):
        if index + 1 < period:
            result.append(None)
            continue
        window = values[index + 1 - period:index + 1]
        result.append(sum(window) / period)
    return result


def _ema(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    alpha = 2 / (period + 1)
    result = [values[0]]
    for value in values[1:]:
        result.append((value * alpha) + (result[-1] * (1 - alpha)))
    return result


def _bollinger(values: list[float], period: int = 20) -> tuple[list[float | None], list[float | None]]:
    upper: list[float | None] = []
    lower: list[float | None] = []
    for index in range(len(values)):
        if index + 1 < period:
            upper.append(None)
            lower.append(None)
            continue
        window = values[index + 1 - period:index + 1]
        average = sum(window) / period
        variance = sum((value - average) ** 2 for value in window) / period
        deviation = sqrt(variance)
        upper.append(average + deviation * 2)
        lower.append(average - deviation * 2)
    return upper, lower


def _rsi(values: list[float], period: int = 14) -> list[float | None]:
    result: list[float | None] = [None] * len(values)
    if len(values) <= period:
        return result
    for index in range(period, len(values)):
        gains = 0.0
        losses = 0.0
        for position in range(index - period + 1, index + 1):
            change = values[position] - values[position - 1]
            if change >= 0:
                gains += change
            else:
                losses += abs(change)
        average_gain = gains / period
        average_loss = losses / period
        if average_loss == 0:
            result[index] = 100.0
        else:
            relative_strength = average_gain / average_loss
            result[index] = 100 - (100 / (1 + relative_strength))
    return result


def _macd(values: list[float]) -> tuple[list[float], list[float], list[float]]:
    ema12 = _ema(values, 12)
    ema26 = _ema(values, 26)
    macd_line = [fast - slow for fast, slow in zip(ema12, ema26)]
    signal = _ema(macd_line, 9)
    histogram = [line - sig for line, sig in zip(macd_line, signal)]
    return macd_line, signal, histogram


def _indicator_points(
    buckets: list[datetime | date],
    values: list[float | None],
    interval: str
) -> list[dict[str, str | float]]:
    points: list[dict[str, str | float]] = []
    for bucket, value in zip(buckets, values):
        rounded = _round_value(value)
        if rounded is None:
            continue
        points.append({"time": _bucket_key(bucket, interval), "value": rounded})
    return points


# Prices
@router.get("/prices")
def get_prices(
    db: Session = Depends(get_db),
    product_id: Optional[int] = None,
    store_id: Optional[int] = None,
    limit: int = 1000
):
    query = latest_prices_query(db)

    if product_id:
        query = query.filter(Price.product_id == product_id)
    if store_id:
        query = query.filter(Price.store_id == store_id)

    prices = query.order_by(desc(Price.price)).limit(limit).all()
    return [price_to_dict(p) for p in prices]


@router.get("/prices/simple")
def get_prices_simple(
    db: Session = Depends(get_db),
    product_id: Optional[int] = None,
    store_id: Optional[int] = None,
    limit: int = 1000
):
    query = latest_prices_query(db)

    if product_id:
        query = query.filter(Price.product_id == product_id)
    if store_id:
        query = query.filter(Price.store_id == store_id)

    prices = query.order_by(desc(Price.price)).limit(limit).all()
    grouped: dict[str, list[tuple[str, int]]] = {}
    for p in prices:
        model = p.product.model if p.product else None
        capacity = p.product.capacity if p.product and p.product.capacity else None
        product_label = f"{model} {capacity}".strip() if model else None
        store_name = p.store.name if p.store else None
        if not product_label or not store_name:
            continue
        grouped.setdefault(product_label, [])
        grouped[product_label].append((store_name, p.price))

    results = []
    for product_label, items in grouped.items():
        top5 = sorted(items, key=lambda item: item[1], reverse=True)[:5]
        compact = ",".join(f"{store}:{price}" for store, price in top5)
        results.append(f"{product_label}:[{compact}]")
    return results

@router.get("/prices/latest/{product_id}")
def get_latest_prices(product_id: int, db: Session = Depends(get_db)):
    prices = latest_prices_query(db).filter(Price.product_id == product_id).order_by(desc(Price.price)).all()

    return [price_to_dict(p) for p in prices]


@router.get("/prices/market-average/{product_id}")
def get_market_average(
    product_id: int,
    freshness_hours: int = Query(72, ge=1, le=720),
    consensus_band_percent: float = Query(0.06, ge=0.01, le=0.30),
    min_store_count: int = Query(3, ge=1, le=20),
    db: Session = Depends(get_db),
):
    summary = build_market_average_for_product(
        db,
        product_id,
        freshness_hours=freshness_hours,
        consensus_band_percent=consensus_band_percent,
        min_store_count=min_store_count,
    )
    if summary is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return summary


@router.get("/prices/market-average")
def get_market_average_list(
    product_ids: Optional[str] = Query(None, description="Comma-separated product IDs"),
    limit: int = Query(100, ge=1, le=300),
    freshness_hours: int = Query(72, ge=1, le=720),
    consensus_band_percent: float = Query(0.06, ge=0.01, le=0.30),
    min_store_count: int = Query(3, ge=1, le=20),
    db: Session = Depends(get_db),
):
    ids = None
    if product_ids:
        ids = [int(item.strip()) for item in product_ids.split(",") if item.strip().isdigit()]
    return build_market_average_batch(
        db,
        product_ids=ids,
        limit=limit,
        freshness_hours=freshness_hours,
        consensus_band_percent=consensus_band_percent,
        min_store_count=min_store_count,
    )

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

    if not daily_data:
        refresh_daily_highs_for_product(db, product_id, days=days)
        daily_data = db.query(DailyHighPrice).filter(
            DailyHighPrice.product_id == product_id,
            DailyHighPrice.date >= since
        ).order_by(DailyHighPrice.date).all()

    # 使用DailyHighPrice表的数据
    return [{
        "date": d.date.isoformat(),
        "open": d.open_price,
        "high": d.high_price,
        "low": d.low_price,
        "close": d.close_price,
        "best_store": d.best_store_name
    } for d in daily_data]


@router.get("/prices/kline-advanced/{product_id}")
def get_advanced_kline_data(
    product_id: int,
    interval: str = Query("1d", description="1h, 1d, or 1w"),
    days: int = Query(60, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Professional K-line data with store overlays and technical indicators."""
    if interval not in {"1h", "1d", "1w"}:
        raise HTTPException(status_code=400, detail="interval must be 1h, 1d, or 1w")

    if interval == "1h":
        days = min(days, 45)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    since = datetime.now() - timedelta(days=days)
    ceiling = _price_ceiling(product)
    rows = db.query(
        PriceHistory.price.label("price"),
        PriceHistory.recorded_at.label("recorded_at"),
        PriceHistory.store_id.label("store_id"),
        Store.name.label("store_name"),
    ).join(
        Store, Store.id == PriceHistory.store_id
    ).filter(
        PriceHistory.product_id == product_id,
        PriceHistory.recorded_at >= since,
    ).order_by(
        PriceHistory.recorded_at.asc(),
        PriceHistory.id.asc(),
    ).all()

    buckets: dict[datetime | date, list[dict[str, int | str | datetime]]] = defaultdict(list)
    store_buckets: dict[int, dict[datetime | date, dict[str, int | str | datetime]]] = defaultdict(dict)
    store_names: dict[int, str] = {}
    filtered_points = 0

    for row in rows:
        price = int(row.price) if row.price is not None else 0
        if price < VALID_PRICE_FLOOR or price > ceiling:
            filtered_points += 1
            continue
        bucket = _bucket_time(row.recorded_at, interval)
        point = {
            "price": price,
            "store_id": row.store_id,
            "store_name": row.store_name,
            "recorded_at": row.recorded_at,
        }
        buckets[bucket].append(point)
        store_buckets[row.store_id][bucket] = point
        store_names[row.store_id] = row.store_name

    bucket_keys = sorted(buckets.keys())
    candles = []
    for bucket in bucket_keys:
        points = buckets[bucket]
        prices = [int(point["price"]) for point in points]
        first = points[0]
        last = points[-1]
        high_point = max(points, key=lambda item: int(item["price"]))
        candles.append({
            "time": _bucket_key(bucket, interval),
            "label": _bucket_label(bucket, interval),
            "open": int(first["price"]),
            "high": max(prices),
            "low": min(prices),
            "close": int(last["price"]),
            "best_store": high_point["store_name"],
            "best_store_id": high_point["store_id"],
            "sample_count": len(points),
            "store_count": len({point["store_id"] for point in points}),
        })

    store_series = []
    for store_id, by_bucket in store_buckets.items():
        points = []
        for bucket in bucket_keys:
            point = by_bucket.get(bucket)
            if not point:
                continue
            points.append({
                "time": _bucket_key(bucket, interval),
                "label": _bucket_label(bucket, interval),
                "price": int(point["price"]),
            })
        if len(points) >= 2:
            store_series.append({
                "store_id": store_id,
                "store_name": store_names.get(store_id, f"Store {store_id}"),
                "latest_price": points[-1]["price"],
                "points": points,
            })

    store_series.sort(key=lambda item: int(item["latest_price"]), reverse=True)
    store_series = store_series[:MAX_STORE_SERIES]

    closes = [float(candle["close"]) for candle in candles]
    sma7 = _sma(closes, 7)
    sma25 = _sma(closes, 25)
    bb_upper, bb_lower = _bollinger(closes, 20)
    rsi14 = _rsi(closes, 14)
    macd_line, macd_signal, macd_histogram = _macd(closes)

    change = 0
    change_percent = 0.0
    if len(candles) >= 2:
        previous = candles[-2]["close"]
        current = candles[-1]["close"]
        change = int(current) - int(previous)
        if previous:
            change_percent = round((change / int(previous)) * 100, 2)

    summary = {
        "latest_close": candles[-1]["close"] if candles else None,
        "change": change,
        "change_percent": change_percent,
        "high": max((candle["high"] for candle in candles), default=None),
        "low": min((candle["low"] for candle in candles), default=None),
        "store_count": len(store_series),
        "sample_count": sum(candle["sample_count"] for candle in candles),
        "data_points": len(candles),
        "filtered_points": filtered_points,
    }

    return {
        "product_id": product_id,
        "product": {
            "id": product.id,
            "name": product.name,
            "model": product.model,
            "capacity": product.capacity,
            "color": product.color,
            "carrier": product.carrier,
            "retail_price": product.retail_price,
        },
        "interval": interval,
        "days": days,
        "price_floor": VALID_PRICE_FLOOR,
        "price_ceiling": ceiling,
        "candles": candles,
        "store_series": store_series,
        "indicators": {
            "sma7": _indicator_points(bucket_keys, sma7, interval),
            "sma25": _indicator_points(bucket_keys, sma25, interval),
            "bb_upper": _indicator_points(bucket_keys, bb_upper, interval),
            "bb_lower": _indicator_points(bucket_keys, bb_lower, interval),
            "rsi14": _indicator_points(bucket_keys, rsi14, interval),
            "macd": _indicator_points(bucket_keys, macd_line, interval),
            "macd_signal": _indicator_points(bucket_keys, macd_signal, interval),
            "macd_histogram": _indicator_points(bucket_keys, macd_histogram, interval),
        },
        "summary": summary,
    }

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
