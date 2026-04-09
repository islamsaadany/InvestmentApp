import asyncio
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import PriceAlertCreate, PriceAlertResponse
from app.services import alert_service

router = APIRouter()


@router.post("/", response_model=PriceAlertResponse, status_code=201)
async def create_alert(
    data: PriceAlertCreate, db: AsyncSession = Depends(get_db)
):
    alert = await alert_service.create_alert(db, data)
    return await alert_service.enrich_alert(alert)


@router.get("/", response_model=list[PriceAlertResponse])
async def list_alerts(
    is_active: bool | None = None,
    is_triggered: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    alerts = await alert_service.get_alerts(db, is_active, is_triggered)
    tasks = [alert_service.enrich_alert(a) for a in alerts]
    return await asyncio.gather(*tasks)


@router.get("/{alert_id}", response_model=PriceAlertResponse)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await alert_service.get_alert(db, alert_id)
    return await alert_service.enrich_alert(alert)


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    await alert_service.delete_alert(db, alert_id)


@router.put("/{alert_id}/deactivate", response_model=PriceAlertResponse)
async def deactivate_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await alert_service.deactivate_alert(db, alert_id)
    return await alert_service.enrich_alert(alert)
