# GitHub へのプッシュ手順

## 1. GitHub リポジトリ作成

1. https://github.com/new にアクセス
2. リポジトリ名: `nova-kaitori` (任意)
3. Public または Private を選択
4. "Create repository" をクリック

## 2. ローカルリポジトリ初期化

```bash
cd /home/ubuntu/.openclaw/workspace/nova-kaitori

# Git 初期化
git init

# 全ファイル追加
git add .

# コミット
git commit -m "Initial commit: NOVA買取サイト v1.0"
```

## 3. GitHub にプッシュ

```bash
# リモートリポジトリ追加 (YOUR_USERNAME を実際のユーザー名に置き換え)
git remote add origin https://github.com/YOUR_USERNAME/nova-kaitori.git

# プッシュ
git branch -M main
git push -u origin main
```

## 4. トークン認証 (必要な場合)

パスワードの代わりに GitHub Personal Access Token を使用:

1. https://github.com/settings/tokens でトークン作成
2. `repo` スコープを選択
3. 生成されたトークンをコピー
4. プッシュ時にパスワードの代わりにトークンを入力

## 5. リポジトリ情報の更新

README.md のリポジトリURLを更新:

```bash
# README.md を編集
sed -i 's|yourusername/YOUR_REPO|YOUR_USERNAME/nova-kaitori|g' README.md

git add README.md
git commit -m "Update repository URL"
git push
```

## 完了！

リポジトリが GitHub に公開されました: `https://github.com/YOUR_USERNAME/nova-kaitori`
