# NOVA買取サイト

日本のiPhone買取価格をリアルタイムで比較・AI予測で最適な売却タイミングを提供するウェブサービス

## 🌐 サイトURL

**https://novakai.net**

## 📋 プロジェクト概要

### ✅ 実装済み機能

- [x] **バックエンド**: FastAPI + PostgreSQL + Celery によるスクレイピング自動化
- [x] **フロントエンド**: React + TypeScript + Tailwind CSS + Vite
- [x] **データ収集**: Google Sheets CSV連携 (24製品 × 23店舗 × 約900件の価格データ)
- [x] **デプロイ**: Docker Compose + Nginx リバースプロキシ
- [x] **SSL**: Let's Encrypt HTTPS証明書
- [x] **ドメイン**: novakai.net
- [x] **モバイル対応**: レスポンシブデザイン、スマートフォン2列レイアウト
- [x] **AI予測機能**: 本日最適売却機種・最高額買取店舗の自動表示
- [x] **店舗リンク**: 全店舗の公式サイトリンクを検証済みで設定
- [x] **為替レート**: 外国為替相場のリアルタイム表示（USD/HKD/CNY/EUR）

### 📊 データ概要

| 項目 | 数量 |
|------|------|
| iPhone製品 | 24機種 (iPhone 16/17シリーズ) |
| 買取店舗 | 23店 |
| 価格データ | 約900件 |

### 🏗️ 技術スタック

**バックエンド:**
- FastAPI (Python)
- PostgreSQL
- Celery + Redis (タスクキュー)
- SQLAlchemy (ORM)

**フロントエンド:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- TanStack Query
- Axios

**インフラ:**
- Docker & Docker Compose
- Nginx (リバースプロキシ + SSL)
- Let's Encrypt

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
- IPアドレス: 43.167.223.87
- ドメイン: novakai.net

**APIエンドポイント:**
- https://novakai.net/api/v1/prices
- https://novakai.net/api/v1/stats

### 📝 更新履歴

- 2026-02-26: UI全面リニューアル - モダンなグラデーションデザインを採用
- 2026-02-25: 為替レート表示機能を追加（USD/HKD/CNY/EUR対応）
- 2026-02-25: 価格表示を「万円」単位に変更し視認性を向上
- 2026-02-05: モバイルUI最適化
- 2026-02-05: APIパス修正、データ表示正常化
- 2026-02-05: 著作権表示年を2026年に更新、会社名を追加

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