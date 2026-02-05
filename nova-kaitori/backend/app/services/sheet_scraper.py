import csv
import io
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Product, Store, Price, PriceHistory
import re

# Google Sheets CSV URL
SHEET_URL = "https://docs.google.com/spreadsheets/d/1-Eq4q3QTTQIXrxZl0bvAnGiOtelj2JOWeEQeKaTA4iE/export?format=csv"

# 店舗名のマッピング（CSV列名 → DB店舗名）
STORE_MAPPING = {
    '森森法人買取': '森森買取',
    '買取商店': '買取商店',
    'モバイル一番': 'モバイル一番',
    '携帯空間': '携帯空間',
    'トゥインクル': 'トゥインクル',
    '買取一丁目': '買取一丁目',
    'モバステ': 'モバステ',
    'mobile-mix': 'モバイルミックス',
    '買取楽園': '買取楽園',
    'ﾄﾞﾗｺﾞﾝﾓﾊﾞｲﾙ': 'ドラゴンモバイル',
    'ベストワン': '買取ベストワン',
    '買取ルデヤ': '買取ルデヤ',
    'ヤマダ電機': 'ヤマダ電機',
    '買取Wiki': '買取wiki',
    '買取BASE': '買取BASE',
    'アキモバ': 'アキモバ',
    '買取ホムラ': '買取ホムラ',
    '買取当番': '買取当番',
    '買取レッド': '買取レッド',
    'PANDA買取': 'PANDA買取',
    'ケータイゴット': 'ケータイゴット',
    'ゲストモバイル': 'ゲストモバイル',
    'ソムリエ': '買取ソムリエ',
}

# iPhone画像URL
IPHONE_IMAGES = {
    '17 PM': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-max-select-2025?wid=470&hei=556&fmt=png-alpha',
    '17 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-select-2025?wid=470&hei=556&fmt=png-alpha',
    '17': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-select-2025?wid=470&hei=556&fmt=png-alpha',
    'Air': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-air-select-2025?wid=470&hei=556&fmt=png-alpha',
    '16PM': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-select-2024?wid=470&hei=556&fmt=png-alpha',
    '16 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-select-2024?wid=470&hei=556&fmt=png-alpha',
    '16': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-select-2024?wid=470&hei=556&fmt=png-alpha',
    '16e': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16e-select-2024?wid=470&hei=556&fmt=png-alpha',
    '16Plus': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-select-2024?wid=470&hei=556&fmt=png-alpha',
}

def parse_price(value):
    """価格文字列を数値に変換"""
    if not value or value in ['', '問い合わせ', '要問い合わせ', '#N/A', '-']:
        return None
    
    # 转换为字符串并清理
    str_value = str(value)
    
    # 如果包含多个数字（如"￥226500 オレンジ -2000"），提取第一个数字
    # 查找格式为 "￥数字" 或纯数字
    import re
    
    # 先尝试找到 ¥xxx 格式
    match = re.search(r'[¥￥]\s*(\d{1,3}(?:,\d{3})+|\d+)', str_value)
    if match:
        cleaned = match.group(1).replace(',', '')
        return int(cleaned)
    
    # 否则提取第一个纯数字
    numbers = re.findall(r'\d{1,3}(?:,\d{3})+|\d+', str_value)
    if numbers:
        cleaned = numbers[0].replace(',', '')
        return int(cleaned)
    
    return None

def fetch_sheet_data():
    """Google SheetsからCSVデータを取得"""
    try:
        response = httpx.get(SHEET_URL, timeout=30, follow_redirects=True)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching sheet: {e}")
        return None

def parse_iphone_data(csv_text):
    """CSVからiPhoneデータを抽出（16・17シリーズ）"""
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)
    
    if len(rows) < 2:
        return []
    
    # ヘッダー行を取得（第0行が店舗名）
    headers = rows[0]
    
    # 対象モデル
    target_models = ['17 PM', '17 Pro', '17', 'Air', '16PM', '16 Pro', '16', '16e', '16Plus']
    
    # iPhoneデータの行を抽出（2行目以降）
    iphone_data = []
    for row in rows[2:]:  # 从第2行开始（跳过日期行）
        if len(row) < 3:
            continue
        
        model = row[0].strip()
        
        # 対象モデルのみ抽出
        if model not in target_models:
            continue
        
        capacity = row[1].strip()
        apple_price = parse_price(row[2])  # Apple公式価格
        
        # 各店舗の価格を収集（从第7列开始）
        store_prices = {}
        for i, header in enumerate(headers):
            if i < 7:  # 跳过前7列（基本情報）
                continue
            if i >= len(row):
                break
            store_name = STORE_MAPPING.get(header.strip())
            if store_name:
                price = parse_price(row[i])
                if price:
                    store_prices[store_name] = price
        
        iphone_data.append({
            'model': model,
            'capacity': capacity,
            'apple_price': apple_price,
            'store_prices': store_prices
        })
    
    return iphone_data

def update_database(data):
    """データベースを更新"""
    db = SessionLocal()
    try:
        # 店舗を初期化
        for csv_name, db_name in STORE_MAPPING.items():
            existing = db.query(Store).filter(Store.name == db_name).first()
            if not existing:
                store = Store(
                    name=db_name,
                    name_kana='',
                    is_active=1,
                    priority=100
                )
                db.add(store)
        db.commit()
        
        # 商品と価格を更新
        for item in data:
            # モデル名変換
            model_map = {
                '17 PM': 'iPhone 17 Pro Max',
                '17 Pro': 'iPhone 17 Pro',
                '17': 'iPhone 17',
                'Air': 'iPhone 17 Air',
                '16PM': 'iPhone 16 Pro Max',
                '16 Pro': 'iPhone 16 Pro',
                '16': 'iPhone 16',
                '16e': 'iPhone 16e',
                '16Plus': 'iPhone 16 Plus',
            }
            model_name = model_map.get(item['model'], f"iPhone {item['model']}")
            
            product_name = f"{model_name} {item['capacity']}"
            
            # 商品を取得または作成
            product = db.query(Product).filter(Product.name == product_name).first()
            if not product:
                product = Product(
                    name=product_name,
                    model=model_name,
                    capacity=item['capacity'],
                    color='',
                    carrier='SIMフリー',
                    condition='新品',
                    image_url=IPHONE_IMAGES.get(item['model']),
                    retail_price=item['apple_price']
                )
                db.add(product)
                db.commit()
                db.refresh(product)
            
            # 店舗価格を更新
            for store_name, price_value in item['store_prices'].items():
                store = db.query(Store).filter(Store.name == store_name).first()
                if not store:
                    continue
                
                # 現在の価格を取得
                current = db.query(Price).filter(
                    Price.product_id == product.id,
                    Price.store_id == store.id
                ).order_by(Price.scraped_at.desc()).first()
                
                # 価格変動を計算
                price_change = 0
                price_change_percent = 0.0
                if current:
                    price_change = price_value - current.price
                    if current.price > 0:
                        price_change_percent = round((price_change / current.price) * 100, 2)
                
                # 新しい価格を保存
                new_price = Price(
                    product_id=product.id,
                    store_id=store.id,
                    price=price_value,
                    price_change=price_change,
                    price_change_percent=price_change_percent,
                    url=''
                )
                db.add(new_price)
                
                # 履歴にも保存
                history = PriceHistory(
                    product_id=product.id,
                    store_id=store.id,
                    price=price_value
                )
                db.add(history)
            
            # 最高価格フラグを更新
            db.commit()
            
            # この商品の最高価格を取得
            prices = db.query(Price).filter(Price.product_id == product.id).order_by(Price.price.desc()).all()
            if prices:
                best_price = prices[0].price
                for p in prices:
                    p.is_best_price = 1 if p.price == best_price else 0
                db.commit()
        
        print(f"Updated {len(data)} iPhone products")
        
    finally:
        db.close()

def scrape_from_sheet():
    """メイン処理"""
    print(f"[{datetime.now()}] Fetching iPhone data from Google Sheets...")
    
    csv_text = fetch_sheet_data()
    if not csv_text:
        print("Failed to fetch data")
        return
    
    data = parse_iphone_data(csv_text)
    print(f"Found {len(data)} iPhone products")
    
    if data:
        update_database(data)
        print("Database updated successfully")
    
    return data, datetime.now()

# Celery task
try:
    from celery import shared_task
    
    @shared_task
    def scrape_sheet_task():
        return scrape_from_sheet()
        
except ImportError:
    pass

if __name__ == "__main__":
    scrape_from_sheet()
