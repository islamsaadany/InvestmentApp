from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import PortfolioSummary, PortfolioSnapshotResponse
from app.services import portfolio_service

router = APIRouter()


@router.get("/summary", response_model=PortfolioSummary)
async def get_summary(db: AsyncSession = Depends(get_db)):
    return await portfolio_service.get_portfolio_summary(db)


@router.get("/allocation")
async def get_allocation(db: AsyncSession = Depends(get_db)):
    return await portfolio_service.get_allocation(db)


@router.get("/performance", response_model=list[PortfolioSnapshotResponse])
async def get_performance(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: AsyncSession = Depends(get_db),
):
    return await portfolio_service.get_performance(db, period)


@router.post("/snapshot", response_model=PortfolioSnapshotResponse, status_code=201)
async def create_snapshot(db: AsyncSession = Depends(get_db)):
    snapshot = await portfolio_service.take_snapshot(db)
    return PortfolioSnapshotResponse.model_validate(snapshot)
