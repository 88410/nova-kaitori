from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Price, Product
from app.routers.common import price_to_dict

router = APIRouter()


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
