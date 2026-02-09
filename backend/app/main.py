from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import api
from app.core.config import settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NOVA買取サイト API",
    description="iPhone買取価格比較プラットフォーム",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api.router)

@app.get("/")
def root():
    return {"message": "NOVA買取サイト API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
