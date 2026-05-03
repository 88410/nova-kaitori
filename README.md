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
- 本番フロント配信先: `/var/www/novakai`（nginx の静的配信ディレクトリ）

**APIエンドポイント:**
- https://novakai.net/api/v1/prices
- https://novakai.net/api/v1/stats

### 本番フロント更新手順

`novakai.net` は現在、Docker の `3000` 番ではなく nginx から `/var/www/novakai` の静的ファイルを直接配信しています。
そのため、本番の見た目を更新するときは、`frontend/dist` をライブディレクトリへ同期する必要があります。

```bash
./scripts/deploy_frontend_live.sh
```

このスクリプトは以下をまとめて実行します。

- ビルド時の `Current version updated` タイムスタンプを自動埋め込み
- `frontend` の本番ビルド
- `dist/` を `/var/www/novakai` に同期

同期後は、ページ最下部のバージョン時刻で新旧を確認できます。

### 📝 更新履歴

- 2026-05-03: Home に「本日の利益上位3モデル」セクションを追加し、最高利益モデルを 3 件表示する構成へ更新
- 2026-05-03: Home に各上位モデル向けの短期価格予測カードを追加（方向、目標価格、信頼度、7日想定変動を表示）
- 2026-05-03: Home に高利益モデル群全体の短期見通しを示す「全体予測」カードを追加
- 2026-05-03: Home に Market Intelligence / Live Feed / Roadmap などのダッシュボード型コンテンツを追加し、プロダクトの事業説明力を強化
- 2026-05-03: AI ページ上部に価格見通しパネルを追加し、チャットに加えて短期方向感を表示
- 2026-05-03: 会社概要ページを追加し、フッターから `会社概要 / Company / 公司简介` へ遷移できるよう更新
- 2026-05-03: フッター最下部に「Current version updated / 現在のバージョン更新日時 / 当前版本更新时间」を追加し、本番反映時刻を可視化
- 2026-05-03: `novakai.net` の本番配信経路を整理し、`scripts/deploy_frontend_live.sh` による静的配信更新フローを追加
- 2026-05-03: `README.md` と `docs/DEPLOYMENT.md` に、本番フロントが `/var/www/novakai` から配信されている実運用手順を追記
- 2026-05-03: `scripts/pre_push_sensitive_check.sh` の自検知誤爆を防ぐため、スクリプト自身を検査対象から除外
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
