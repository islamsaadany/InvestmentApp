from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import investments, portfolio, alerts, market

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()

    # Start background scheduler for alerts and snapshots
    from app.services.scheduler import start_scheduler, stop_scheduler
    scheduler = start_scheduler()

    yield

    # Shutdown
    stop_scheduler(scheduler)


app = FastAPI(
    title="Investment Portfolio Tracker",
    description="Track investments across Gold, Silver, Crypto, US Stocks, and EGX Stocks with live market data",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(investments.router, prefix="/api/investments", tags=["Investments"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(market.router, prefix="/api/market", tags=["Market Data"])


@app.get("/")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
