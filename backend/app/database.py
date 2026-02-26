from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# データベース接続URL（環境変数から取得、デフォルト値あり）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nova:nova_password@localhost:5432/nova_kaitori")

# データベースエンジン作成
engine = create_engine(DATABASE_URL)

# セッション作成用ファクトリ
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデルのベースクラス
Base = declarative_base()

def get_db():
    """データベースセッションを取得するジェネレーター"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
