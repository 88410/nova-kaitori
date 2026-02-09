import csv
import io
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Product, Store, Price, PriceHistory
import re

# Google Sheets CSV URL (using gviz API for public sheets)
SHEET_URL = "https://docs.google.com/spreadsheets/d/1-Eq4q3QTTQIXrxZl0bvAnGiOtelj2JOWeEQeKaTA4iE/gviz/tq?tqx=out:csv&gid=0"

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

def infer_capacity(model, apple_price, raw_capacity):
    """根据 Apple 公式価格推断容量"""
    # 如果 capacity 已经有值，直接返回
    if raw_capacity and raw_capacity.strip():
        return raw_capacity.strip()
    
    # 根据价格推断容量
    if not apple_price:
        return ""
    
    # iPhone 17 Pro Max / 16 Pro Max 价格区间
    if model in ['17 PM', '16PM']:
        if 190000 <= apple_price <= 200000:
            return "256"
        elif 220000 <= apple_price <= 235000:
            return "512"
        elif 240000 <= apple_price <= 270000:
            return "1TB"
        elif 300000 <= apple_price <= 340000:
            return "2TB"
    
    # iPhone 17 Pro / 16 Pro
    elif model in ['17 Pro', '16 Pro']:
        if 170000 <= apple_price <= 185000:
            return "256"
        elif 210000 <= apple_price <= 220000:
            return "512"
        elif 220000 <= apple_price <= 260000:
            return "1TB"
    
    # iPhone 17 / 16
    elif model in ['17', '16']:
        if 120000 <= apple_price <= 135000:
            return "256"
        elif 150000 <= apple_price <= 170000:
            return "512"
    
    # iPhone 17 Air
    elif model == 'Air':
        if 150000 <= apple_price <= 165000:
            return "256"
        elif 180000 <= apple_price <= 200000:
            return "512"
        elif 220000 <= apple_price <= 240000:
            return "1TB"
    
    # iPhone 16e
    elif model == '16e':
        if 90000 <= apple_price <= 105000:
            return "128"
        elif 105000 <= apple_price <= 120000:
            return "256"
        elif 130000 <= apple_price <= 150000:
            return "512"
    
    # iPhone 16 Plus
    elif model == '16Plus':
        if 130000 <= apple_price <= 145000:
            return "128"
        elif 145000 <= apple_price <= 165000:
            return "256"
        elif 170000 <= apple_price <= 195000:
            return "512"
    
    return ""


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
    
    # iPhoneデータの行を抽出（1行目以降、ヘッダー行の次から）
    iphone_data = []
    for row in rows[1:]:  # 从第1行开始（跳过ヘッダー行rows[0]）
        if len(row) < 3:
            continue
        
        model = row[0].strip()
        
        # 対象モデルのみ抽出
        if model not in target_models:
            continue
        
        raw_capacity = row[1].strip()
        apple_price = parse_price(row[2])  # Apple公式価格
        
        # 推断缺失的容量
        capacity = infer_capacity(model, apple_price, raw_capacity)
        
        # 【强制过滤】如果 capacity 为空，跳过此行
        if not capacity or capacity.strip() == '' or capacity.strip() == 'GB':
            print(f"[SKIP] {model} 容量为空，跳过")
            continue
        
        # 各店舗の価格を収集（AG列=第33列开始）
        store_prices = {}
        seen_stores = set()  # 用于去重
        for i, header in enumerate(headers):
            if i < 32:  # 跳过前32列（A-AF），从AG列(index 32)开始
                continue
            if i >= len(row):
                break
            # 去掉" リンク"后缀进行匹配
            header_clean = header.strip().replace(' リンク', '').replace('リンク', '')
            store_name = STORE_MAPPING.get(header_clean)
            if store_name and store_name not in seen_stores:  # 只保留第一次出现的店铺
                price = parse_price(row[i])
                if price:
                    store_prices[store_name] = price
                    seen_stores.add(store_name)
        
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
            # 【强制保护】数据库插入前检查 capacity，为空则跳过
            cap = item.get('capacity', '') or ''
            if not cap or cap.strip() == '' or cap.strip() == 'GB':
                print(f"[DB SKIP] {item['model']} 容量为空，不插入数据库")
                continue
            
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
                    url='',
                    scraped_at=datetime.now()
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
