# NOVA買取サイト - プロジェクトアーカイブ

## 📅 アーカイブ日
2026-02-06 09:22 GMT+8

## 🌐 サイト情報
- **URL**: https://novakai.net
- **サーバーIP**: 43.167.223.87
- **ステータス**: ✅ 正常稼働中

## 📊 現在のデータ状況

### データベース統計
```
総製品数: 27
店舗数: 23
本日更新: 293
24時間変動: 113
最終更新: 2026-02-06T01:02:39 (北京時間 09:02)
```

### データソース
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1-Eq4q3QTTQIXrxZl0bvAnGiOtelj2JOWeEQeKaTA4iE
- **更新頻度**: 毎時自動取得
- **取得方式**: gviz API (公開スプレッドシート)

## 🏗️ 技術アーキテクチャ

### バックエンド (Backend)
- **フレームワーク**: FastAPI (Python 3.11)
- **データベース**: PostgreSQL 15
- **タスクキュー**: Celery + Redis
- **自動更新**: Celery Beat (毎時)

### フロントエンド (Frontend)
- **フレームワーク**: React 18 + TypeScript
- **スタイル**: Tailwind CSS
- **ビルド**: Vite
- **データ取得**: TanStack Query + Axios

### デプロイ
- **コンテナ**: Docker + Docker Compose
- **リバースプロキシ**: Nginx
- **SSL**: Let's Encrypt
- **ドメイン**: novakai.net

## 📁 プロジェクト構成

```
nova-kaitori/
├── backend/
│   ├── app/
│   │   ├── api/          # APIルーティング
│   │   ├── models/       # データベースモデル
│   │   ├── services/     # ビジネスロジック
│   │   │   └── sheet_scraper.py  # Google Sheets取得処理
│   │   └── celery_app.py # Celery設定
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceTable.tsx    # 価格テーブル
│   │   │   ├── Stats.tsx         # 統計カード
│   │   │   └── Header.tsx        # ヘッダーナビゲーション
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## ✅ 実装済み機能

### コア機能
- [x] iPhone 16/17シリーズの価格表示
- [x] 23店舗の買取価格比較
- [x] AI予測分析エリア
- [x] 毎時自動更新
- [x] モバイル対応 (2列レイアウト)
- [x] 更新時刻表示

### データ機能
- [x] Google Sheets自動取得
- [x] 価格履歴管理
- [x] 最高価格マーキング
- [x] 利益計算 (買取価格 - 公式価格)
- [x] 店舗リンク遷移

### UI機能
- [x] レスポンシブデザイン
- [x] 全店舗の展開/折りたたみ
- [x] 価格の完全表示 (¥208,000)
- [x] AI予測文言ローテーション (6テンプレート)

## 🔧 よく使うコマンド

### サービス状態の確認
```bash
cd /home/ubuntu/.openclaw/workspace/nova-kaitori
sudo docker compose ps
```

### データ手動更新
```bash
sudo docker compose exec backend python -c "from app.services.sheet_scraper import scrape_from_sheet; scrape_from_sheet()"
```

### ログ確認
```bash
# Celeryスケジューラーログ
sudo docker compose logs celery-beat --tail 20

# Celeryタスクログ
sudo docker compose logs celery --tail 20

# バックエンドAPIログ
sudo docker compose logs backend --tail 20
```

### サービス再起動
```bash
sudo docker compose restart backend celery celery-beat
```

### データベース照会
```bash
sudo docker compose exec db psql -U nova -d nova_kaitori -c "SELECT MAX(scraped_at) FROM prices;"
```

## 📦 GitHub リポジトリ

- **URL**: https://github.com/88410/nova-kaitori
- **種別**: 非公開リポジトリ
- **ブランチ**: main
- **最新コミット**: fix: Google Sheets column matching and timestamp

### GitHubへの更新反映
```bash
cd /home/ubuntu/.openclaw/workspace/nova-kaitori
git add -A
git commit -m "更新内容を記載"
git push origin main
# ユーザー名を入力: 88410
# パスワードを入力: [Personal Access Token]
```

## 🚀 クイック復旧ガイド

アーカイブから復元する場合は、以下を実行してください。

### 1. リポジトリをクローン
```bash
git clone https://github.com/88410/nova-kaitori.git
cd nova-kaitori
```

### 2. サービスを起動
```bash
sudo docker compose -f docker-compose.prod.yml up -d
```

### 3. 稼働確認
```bash
curl https://novakai.net/api/v1/stats
```

## 📋 TODO / 今後の改善

### 既知課題
- [ ] 価格データ列が Google Sheets の構成変更に追従できない可能性
- [ ] 自動更新の正常性を継続監視する必要あり

### 改善提案
- [ ] 価格変動通知の追加
- [ ] iPhone対応モデルの拡張
- [ ] 価格トレンドのグラフ表示追加
- [ ] ユーザーお気に入り機能の追加
- [ ] 価格アラートのメール購読機能追加

## 🔐 重要認証情報

### GitHub Token
- **用途**: GitHubへのコード反映
- **Token**: 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
- **注意**: 本Tokenは定期的な更新が必要な場合があります

### サーバーアクセス
- **ユーザー**: ubuntu
- **プロジェクトパス**: /home/ubuntu/.openclaw/workspace/nova-kaitori
- **sudo権限要否**: 要

## 📞 連絡先情報

- **管理者**: しょうし (@eth410)
- **Telegram ID**: 5092242435

---

**最終更新**: 2026-02-06 09:22 GMT+8
**バージョン**: v1.0.1
**ステータス**: ✅ 本番環境で稼働中
