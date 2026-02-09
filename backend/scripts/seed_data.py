import sys
sys.path.append("/app")

from app.database import SessionLocal, engine
from app.models.models import Base
from app.services.scraper import init_stores, init_products, scrape_all_prices

def main():
    # テーブル作成
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Initializing database...")
        init_stores(db)
        init_products(db)
        print("Database initialized successfully!")
        
        # スクレイピング実行
        print("Scraping prices...")
        scrape_all_prices()
        print("Done!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
