# NOVA買取サイト - 環境構築ガイド

## ローカル開発環境

### 前提条件
- Docker & Docker Compose
- Node.js 20+ (フロントエンド開発のみの場合)
- Python 3.11+ (バックエンド開発のみの場合)

### 1. Dockerで一括起動

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/nova-kaitori.git
cd nova-kaitori

# 環境変数のコピー
cp .env.example .env

# コンテナ起動
docker-compose up -d

# データベース初期化
docker-compose exec backend python scripts/seed_data.py

# スクレイピング実行（初回データ）
docker-compose exec backend python -c "from app.services.scraper import scrape_all_prices; scrape_all_prices()"
```

アクセス:
- フロントエンド: http://localhost:3000
- API: http://localhost:8000
- APIドキュメント: http://localhost:8000/docs

### 2. バックエンドのみ開発

```bash
cd backend

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# データベース起動（Docker）
docker run -d --name nova-postgres \
  -e POSTGRES_USER=nova \
  -e POSTGRES_PASSWORD=nova_password \
  -e POSTGRES_DB=nova_kaitori \
  -p 5432:5432 postgres:15-alpine

# テーブル作成 & 初期データ
python scripts/seed_data.py

# サーバー起動
uvicorn app.main:app --reload
```

### 3. フロントエンドのみ開発

```bash
cd frontend

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

## 本番デプロイ

### VPS (Ubuntu)

```bash
# 1. サーバーにSSH接続
ssh user@your-server

# 2. リポジトリクローン
git clone https://github.com/yourusername/nova-kaitori.git
cd nova-kaitori

# 3. 本番用環境変数設定
nano .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/nova_kaitori
# REDIS_URL=redis://localhost:6379/0

# 4. Docker Composeで起動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. データベース初期化
docker-compose exec backend python scripts/seed_data.py
```

### クラウドサービス

#### Render
1. GitHubリポジトリと連携
2. Blueprintで `render.yaml` を使用
3. 環境変数を設定
4. 自動デプロイ

#### Railway
```bash
railway login
railway init
railway up
```

## スクレイピングのカスタマイズ

各買取店のスクレイピングロジックは `backend/app/services/scraper.py` に実装。

実際の店舗サイトに合わせて `scrape_store_price()` 関数を修正してください。

```python
def scrape_store_price(store: Store, product: Product) -> int:
    # 店舗のAPIやHTMLをスクレイピング
    # 価格を整数（円）で返す
    pass
```

## 広告配信の設定

`.env` で有効化:
```
AD_ENABLED=true
AD_PROVIDER=google_adsense  # または他のプロバイダー
AD_CLIENT_ID=ca-pub-xxxxxxxx
AD_SLOT_ID=xxxxxx
```

フロントエンドの `index.html` に広告スクリプトを追加。

## トラブルシューティング

### データベース接続エラー
```bash
# PostgreSQLコンテナの確認
docker-compose ps
docker-compose logs db

# データベースリセット（注意: データが消えます）
docker-compose down -v
docker-compose up -d db
docker-compose exec backend python scripts/seed_data.py
```

### スクレイピングエラー
```bash
# Celeryワーカーのログ確認
docker-compose logs celery

# 手動実行
docker-compose exec backend python -c "from app.services.scraper import scrape_all_prices; scrape_all_prices()"
```
