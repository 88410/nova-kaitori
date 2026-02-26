import httpx
from bs4 import BeautifulSoup
import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Product, Store, Price, PriceHistory
import random
import time

# 買取店舗データ
STORES_DATA = [
    {"name": "森森買取", "name_kana": "シンシンカイトリ", "priority": 100, 
     "url": "https://www.shin-shin.co.jp", "search_url": "https://www.shin-shin.co.jp/kaitori/iphone/"},
    {"name": "買取商店", "name_kana": "カイトリショウテン", "priority": 90,
     "url": "https://kaitorishoten.com", "search_url": "https://kaitorishoten.com/iphone/"},
    {"name": "買取一丁目", "name_kana": "カイトリイッチョウメ", "priority": 80,
     "url": "https://kaitori1chome.com", "search_url": "https://kaitori1chome.com/iphone/"},
    {"name": "モバイルミックス", "name_kana": "モバイルミックス", "priority": 70,
     "url": "https://mobile-mix.com", "search_url": "https://mobile-mix.com/iphone/"},
    {"name": "携帯空間", "name_kana": "ケイタイクウカン", "priority": 60,
     "url": "https://keitai-kukan.com", "search_url": "https://keitai-kukan.com/iphone/"},
    {"name": "買取wiki", "name_kana": "カイトリウィキ", "priority": 50,
     "url": "https://kaitori-wiki.com", "search_url": "https://kaitori-wiki.com/iphone/"},
    {"name": "買取ルデヤ", "name_kana": "カイトリルデヤ", "priority": 40,
     "url": "https://kaitori-rudeya.com", "search_url": "https://kaitori-rudeya.com/iphone/"},
    {"name": "PANDA買取", "name_kana": "パンダカイトリ", "priority": 30,
     "url": "https://panda-kaitori.com", "search_url": "https://panda-kaitori.com/iphone/"},
    {"name": "家電市場", "name_kana": "カデンイチバ", "priority": 20,
     "url": "https://kaden-ichiba.jp", "search_url": "https://kaden-ichiba.jp/iphone/"},
    {"name": "モバステ", "name_kana": "モバステ", "priority": 10,
     "url": "https://mobaste.com", "search_url": "https://mobaste.com/iphone/"},
    {"name": "買取ホムラ", "name_kana": "カイトリホムラ", "priority": 5,
     "url": "https://kaitori-homura.com", "search_url": "https://kaitori-homura.com/iphone/"},
    {"name": "アバウテック", "name_kana": "アバウテック", "priority": 5,
     "url": "https://aboutech.jp", "search_url": "https://aboutech.jp/iphone/"},
]

# iPhone製品データ（公式価格情報付き）
IPHONE_MODELS = [
    # iPhone 15 Pro Max
    {"model": "iPhone 15 Pro Max", "capacity": "256GB", "retail_price": 189800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15 Pro Max", "capacity": "512GB", "retail_price": 219800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15 Pro Max", "capacity": "1TB", "retail_price": 249800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    # iPhone 15 Pro
    {"model": "iPhone 15 Pro", "capacity": "128GB", "retail_price": 159800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15 Pro", "capacity": "256GB", "retail_price": 179800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15 Pro", "capacity": "512GB", "retail_price": 209800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15 Pro", "capacity": "1TB", "retail_price": 239800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    # iPhone 15
    {"model": "iPhone 15", "capacity": "128GB", "retail_price": 124800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pink-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15", "capacity": "256GB", "retail_price": 139800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pink-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    {"model": "iPhone 15", "capacity": "512GB", "retail_price": 169800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pink-select-202309?wid=470&hei=556&fmt=png-alpha&.v=1692895703318"},
    # iPhone 14 Pro Max
    {"model": "iPhone 14 Pro Max", "capacity": "128GB", "retail_price": 164800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-max-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro Max", "capacity": "256GB", "retail_price": 179800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-max-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro Max", "capacity": "512GB", "retail_price": 209800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-max-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro Max", "capacity": "1TB", "retail_price": 239800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-max-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    # iPhone 14 Pro
    {"model": "iPhone 14 Pro", "capacity": "128GB", "retail_price": 149800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro", "capacity": "256GB", "retail_price": 164800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro", "capacity": "512GB", "retail_price": 194800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14 Pro", "capacity": "1TB", "retail_price": 224800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-deeppurple-select?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    # iPhone 14
    {"model": "iPhone 14", "capacity": "128GB", "retail_price": 119800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-blue-select-202209?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14", "capacity": "256GB", "retail_price": 134800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-blue-select-202209?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    {"model": "iPhone 14", "capacity": "512GB", "retail_price": 164800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-blue-select-202209?wid=470&hei=556&fmt=png-alpha&.v=1660753619946"},
    # iPhone 13 Pro Max
    {"model": "iPhone 13 Pro Max", "capacity": "128GB", "retail_price": 139800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro Max", "capacity": "256GB", "retail_price": 154800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro Max", "capacity": "512GB", "retail_price": 184800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro Max", "capacity": "1TB", "retail_price": 214800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    # iPhone 13 Pro
    {"model": "iPhone 13 Pro", "capacity": "128GB", "retail_price": 122800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro", "capacity": "256GB", "retail_price": 137800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro", "capacity": "512GB", "retail_price": 167800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13 Pro", "capacity": "1TB", "retail_price": 197800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-sierra-blue-select?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    # iPhone 13
    {"model": "iPhone 13", "capacity": "128GB", "retail_price": 98800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pink-select-2021?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13", "capacity": "256GB", "retail_price": 112800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pink-select-2021?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
    {"model": "iPhone 13", "capacity": "512GB", "retail_price": 142800, "image": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pink-select-2021?wid=470&hei=556&fmt=png-alpha&.v=1631656596000"},
]

# 店舗ごとの価格係数（実際のスクレイピング前のデモデータ用）
STORE_PRICE_MULTIPLIERS = {
    "森森買取": {"min": 0.75, "max": 0.92},
    "買取商店": {"min": 0.73, "max": 0.90},
    "買取一丁目": {"min": 0.72, "max": 0.88},
    "モバイルミックス": {"min": 0.70, "max": 0.87},
    "携帯空間": {"min": 0.70, "max": 0.86},
    "買取wiki": {"min": 0.68, "max": 0.85},
    "買取ルデヤ": {"min": 0.68, "max": 0.84},
    "PANDA買取": {"min": 0.65, "max": 0.82},
    "家電市場": {"min": 0.65, "max": 0.80},
    "モバステ": {"min": 0.63, "max": 0.78},
    "買取ホムラ": {"min": 0.62, "max": 0.77},
    "アバウテック": {"min": 0.60, "max": 0.75},
}

def init_stores(db: Session):
    """買取店舗をデータベースに初期化"""
    for store_data in STORES_DATA:
        existing = db.query(Store).filter(Store.name == store_data["name"]).first()
        if not existing:
            # Storeモデルに存在するフィールドのみ使用
            store_fields = {k: v for k, v in store_data.items() 
                          if k in ['name', 'name_kana', 'logo_url', 'website_url', 'is_active', 'priority']}
            store = Store(**store_fields)
            db.add(store)
    db.commit()
    print(f"{len(STORES_DATA)}店舗を初期化しました")

def init_products(db: Session):
    """iPhone製品をデータベースに初期化"""
    colors = ["ブラック", "ホワイト", "ブルー", "パープル", "ゴールド", "シルバー", "グリーン", "レッド"]
    carriers = ["SIMフリー"]
    
    count = 0
    for iphone in IPHONE_MODELS:
        for color in colors[:4]:  # 主要な色のみ使用
            for carrier in carriers:
                name = f"{iphone['model']} {iphone['capacity']} {color} {carrier}"
                existing = db.query(Product).filter(Product.name == name).first()
                if not existing:
                    product = Product(
                        name=name,
                        model=iphone["model"],
                        capacity=iphone["capacity"],
                        color=color,
                        carrier=carrier,
                        condition="新品",
                        image_url=iphone.get("image"),
                        retail_price=iphone.get("retail_price")
                    )
                    db.add(product)
                    count += 1
    db.commit()
    print(f"{count}製品を初期化しました")

def scrape_store_price(store: Store, product: Product) -> int:
    """
    実際のスクレイピングロジック
    現在はデモデータとして、公式価格の一定割合で価格を生成
    """
    if not product.retail_price:
        return 0
    
    multipliers = STORE_PRICE_MULTIPLIERS.get(store.name, {"min": 0.60, "max": 0.85})
    ratio = random.uniform(multipliers["min"], multipliers["max"])
    
    # 価格は100円単位に丸める
    price = int(product.retail_price * ratio / 100) * 100
    return price

def scrape_all_prices():
    """全店舗の価格をスクレイピング"""
    db = SessionLocal()
    try:
        stores = db.query(Store).filter(Store.is_active == 1).all()
        products = db.query(Product).all()
        
        print(f"{len(products)}製品 × {len(stores)}店舗の価格をスクレイピング中...")
        
        for product in products:
            best_price = 0
            prices_for_product = []
            
            for store in stores:
                # 現在の価格を取得
                current_price = db.query(Price).filter(
                    Price.product_id == product.id,
                    Price.store_id == store.id
                ).order_by(Price.scraped_at.desc()).first()
                
                # 新しい価格を取得（スクレイピング）
                new_price_value = scrape_store_price(store, product)
                
                if new_price_value == 0:
                    continue
                
                # 価格変動を計算
                price_change = 0
                price_change_percent = 0.0
                if current_price:
                    price_change = new_price_value - current_price.price
                    if current_price.price > 0:
                        price_change_percent = round((price_change / current_price.price) * 100, 2)
                
                # 新しい価格を保存
                store_data = next((s for s in STORES_DATA if s['name'] == store.name), {})
                new_price = Price(
                    product_id=product.id,
                    store_id=store.id,
                    price=new_price_value,
                    price_change=price_change,
                    price_change_percent=price_change_percent,
                    url=store_data.get('search_url', '')
                )
                db.add(new_price)
                prices_for_product.append(new_price)
                
                # 価格履歴にも保存
                history = PriceHistory(
                    product_id=product.id,
                    store_id=store.id,
                    price=new_price_value
                )
                db.add(history)
                
                # 最高価格を追跡
                if new_price_value > best_price:
                    best_price = new_price_value
            
            # 最高価格フラグを更新
            db.commit()
            
            # is_best_priceフラグをリセットして再設定
            if prices_for_product:
                for price in prices_for_product:
                    price.is_best_price = 1 if price.price == best_price else 0
                
                db.commit()
        
        print(f"{len(products) * len(stores)}件の価格データを取得しました")
        
    finally:
        db.close()

# Celeryタスクラッパー
try:
    from celery import shared_task
    
    @shared_task
    def scrape_all_prices_task():
        scrape_all_prices()
        
except ImportError:
    pass
