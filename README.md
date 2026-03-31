# NOVA買取サイト

日本のiPhone買取価格をリアルタイムで比較・AI予測で最適な売却タイミングを提供するウェブサービス

## 🌐 サイトURL

**https://novakai.net**

## 📋 プロジェクト概要

### ✅ 実装済み機能

- [x] **バックエンド**: FastAPI + PostgreSQL + SQLAlchemy + Celery による価格データ集約とAPI提供
- [x] **フロントエンド**: React + TypeScript + Vite によるSPA構成
- [x] **価格比較**: iPhone買取価格の店舗別比較、差額表示、機種詳細表示
- [x] **履歴表示**: 日次高価買取履歴とKラインチャート表示
- [x] **AI機能**: NOVA GPTチャット、売却タイミング案内、注目機種の自動表示
- [x] **多言語対応**: 日本語 / English / 中文 のUI切り替え
- [x] **為替レート**: 外国為替相場の表示とバックエンドJSONキャッシュ連携（USD/HKD/CNY/EUR）
- [x] **店舗情報**: 店舗メタデータ管理、公式サイトリンク表示、買取店詳細強化
- [x] **法務ページ**: 利用規約・プライバシーポリシー・特商法ページを実装
- [x] **デプロイ**: Docker Compose + Nginx リバースプロキシ + HTTPS運用

### 📊 データ概要

| 項目 | 数量 |
|------|------|
| iPhone製品 | 24機種 (iPhone 16/17シリーズ) |
| 買取店舗 | 23店 |
| 価格データ | 約900件 |

### 🏗️ 技術スタック

**バックエンド**
- Python 3 + FastAPI
- PostgreSQL
- SQLAlchemy + Pydantic
- Celery + Redis
- HTTPX / BeautifulSoup / lxml（外部データ取得）

**フロントエンド**
- React 18 + TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Recharts
- Tailwind CSS

**インフラ / 運用**
- Docker / Docker Compose
- Nginx（リバースプロキシ）
- Let's Encrypt（HTTPS）
- novakai.net 本番運用

**ページ構成**
- Home: トップページ、AIハイライト、為替表示
- Prices: 一覧価格比較ページ
- Product Detail: 機種別詳細、店舗別価格、履歴チャート
- AI: NOVA GPTチャットページ
- Legal: 利用規約、プライバシーポリシー、特商法表記

### 📁 プロジェクト構成

```
nova-kaitori/
├── backend/           # FastAPIバックエンド
│   ├── app/
│   │   ├── api/      # APIルーティング
│   │   ├── models/   # データベースモデル
│   │   └── services/ # ビジネスロジック
│   └── Dockerfile
├── frontend/          # Reactフロントエンド
│   ├── src/
│   │   ├── components/  # UIコンポーネント
│   │   ├── pages/       # ページ
│   │   └── lib/         # ユーティリティ
│   └── Dockerfile
├── docker-compose.yml      # ローカル開発設定
├── docker-compose.prod.yml # 本番環境設定
└── README.md
```

### 🔧 主要設定

**サーバー:**
- ドメイン: novakai.net

**APIエンドポイント:**
- https://novakai.net/api/v1/prices
- https://novakai.net/api/v1/stats

### 📝 更新履歴

- 2026-03-31: README更新。最新の技術構成、ページ構成、主要機能を反映
- 2026-03-31: 日本語 / English / 中文 の多言語UI切り替えを追加
- 2026-03-31: 利用規約、プライバシーポリシー、特商法ページを追加
- 2026-03-31: 店舗メタデータ整備、店舗情報表示、公式リンク周りを強化
- 2026-03-31: 外為レート取得処理を整理し、バックエンドキャッシュ連携を追加
- 2026-03-31: NOVA GPT AIチャット機能を追加
- 2026-03-28: 日次高価買取履歴とKラインチャート表示を追加
- 2026-02-26: UI全面リニューアル。モダンなグラデーションデザインを採用
- 2026-02-25: 為替レート表示機能を追加（USD/HKD/CNY/EUR対応）
- 2026-02-25: 価格表示を「万円」単位に変更し視認性を向上
- 2026-02-05: モバイルUI最適化、APIパス修正、データ表示正常化

## 🚀 起動方法

```bash
# 本番環境
docker compose -f docker-compose.prod.yml up -d

# ローカル開発環境
docker compose up -d
```

## 📄 ライセンス

MIT License

---

**運営**: ノーヴァテック株式会社  
**技術**: lzq / toda  
**問い合わせ**: AI予測でiPhone売却を最適化
