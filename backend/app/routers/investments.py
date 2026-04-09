from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AssetType
from app.schemas import InvestmentCreate, InvestmentUpdate, InvestmentResponse
from app.services import investment_service

router = APIRouter()


@router.post("/", response_model=InvestmentResponse, status_code=201)
async def create_investment(
    data: InvestmentCreate, db: AsyncSession = Depends(get_db)
):
    investment = await investment_service.create_investment(db, data)
    return await investment_service.enrich_with_live_data(investment)


@router.get("/", response_model=list[InvestmentResponse])
async def list_investments(
    asset_type: AssetType | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    investments = await investment_service.get_investments(db, asset_type, skip, limit)
    return await investment_service.enrich_investments(investments)


@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(
    investment_id: int, db: AsyncSession = Depends(get_db)
):
    investment = await investment_service.get_investment(db, investment_id)
    return await investment_service.enrich_with_live_data(investment)


@router.put("/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    investment = await investment_service.update_investment(db, investment_id, data)
    return await investment_service.enrich_with_live_data(investment)


@router.delete("/{investment_id}", status_code=204)
async def delete_investment(
    investment_id: int, db: AsyncSession = Depends(get_db)
):
    await investment_service.delete_investment(db, investment_id)
