# 買取店スクレイピング実装ガイド

## 実装の流れ

1. 店舗サイトを調査
2. 価格ページのURL構造を確認
3. スクレイピングロジックを実装
4. テスト実行
5. 定期実行設定

## サンプル実装

### 1. HTMLスクレイピング (BeautifulSoup)

```python
import httpx
from bs4 import BeautifulSoup

async def scrape_morimori(product: Product) -> int:
    url = f"https://www.morimori-kaitori.com/iphone/{product.model.replace(' ', '-').lower()}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 価格要素を特定（サイトのHTML構造に応じて変更）
        price_elem = soup.select_one('.price-value')
        if price_elem:
            price_text = price_elem.text.strip()
            # "¥120,000" -> 120000
            price = int(price_text.replace('¥', '').replace(',', ''))
            return price
        
        return 0
```

### 2. API直接アクセス

```python
import httpx

async def scrape_kaitori_shops(product: Product) -> int:
    # 店舗の内部APIを直接呼び出し
    api_url = "https://api.kaitori-shops.com/v1/prices"
    
    params = {
        "model": product.model,
        "capacity": product.capacity,
        "color": product.color,
        "carrier": product.carrier,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, params=params, timeout=30)
        data = response.json()
        
        return data.get("price", 0)
```

### 3. Selenium (動的サイト)

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def scrape_dynamic_site(product: Product) -> int:
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    
    driver = webdriver.Chrome(options=options)
    
    try:
        url = f"https://dynamic-store.com/search?model={product.model}"
        driver.get(url)
        
        # ページが読み込まれるまで待機
        price_elem = driver.find_element(By.CSS_SELECTOR, '.buyback-price')
        price_text = price_elem.text
        
        return int(price_text.replace('¥', '').replace(',', ''))
        
    finally:
        driver.quit()
```

## エラーハンドリング

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def scrape_with_retry(store: Store, product: Product) -> int:
    try:
        price = await scrape_store_price(store, product)
        return price
    except httpx.HTTPError as e:
        print(f"HTTP Error for {store.name}: {e}")
        raise
    except Exception as e:
        print(f"Error scraping {store.name}: {e}")
        return 0
```

## 対応店舗一覧

| 店舗名 | 方法 | 難易度 |
|--------|------|--------|
| 森森買取 | HTML | 易 |
| 買取商店 | HTML | 易 |
| 買取一丁目 | API | 中 |
| モバイルミックス | HTML | 易 |
| 携帯空間 | API | 中 |
| 買取wiki | HTML | 易 |
| 買取ルデヤ | HTML | 易 |
| PANDA買取 | Selenium | 難 |
| 家電市場 | API | 中 |
| モバステ | HTML | 易 |
| 買取ホムラ | HTML | 易 |
| アバウテック | HTML | 易 |

## 注意事項

- 各サイトの `robots.txt` を確認
- リクエスト間隔を空ける（1秒以上推奨）
- User-Agentを設定
- 大量リクエストは避ける
- サイト変更に備えてエラーハンドリングを充実させる
