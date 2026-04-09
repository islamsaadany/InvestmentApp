from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models import AssetType, WeightUnit


# Investment schemas
class InvestmentCreate(BaseModel):
    name: str
    symbol: str
    asset_type: AssetType
    quantity: float
    purchase_price: float
    purchase_currency: str = "USD"
    purchase_date: Optional[datetime] = None
    weight_unit: Optional[WeightUnit] = None
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_currency: Optional[str] = None
    purchase_date: Optional[datetime] = None
    weight_unit: Optional[WeightUnit] = None
    notes: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: int
    name: str
    symbol: str
    asset_type: AssetType
    quantity: float
    purchase_price: float
    purchase_currency: str
    purchase_date: Optional[datetime]
    weight_unit: Optional[WeightUnit]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    # Live data (populated by the API)
    current_price: Optional[float] = None
    current_value_usd: Optional[float] = None
    current_value_egp: Optional[float] = None
    total_cost: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None

    class Config:
        from_attributes = True


# Price Alert schemas
class PriceAlertCreate(BaseModel):
    symbol: str
    asset_type: AssetType
    target_price: float
    condition: str  # "above" or "below"
    currency: str = "USD"


class PriceAlertResponse(BaseModel):
    id: int
    symbol: str
    asset_type: AssetType
    target_price: float
    condition: str
    currency: str
    is_triggered: bool
    is_active: bool
    created_at: datetime
    current_price: Optional[float] = None

    class Config:
        from_attributes = True


# Portfolio summary
class PortfolioSummary(BaseModel):
    total_value_usd: float
    total_value_egp: float
    total_cost_usd: float
    total_profit_loss_usd: float
    total_profit_loss_pct: float
    usd_to_egp_rate: float
    investments: list[InvestmentResponse]
    allocation: list[dict]


class PortfolioSnapshotResponse(BaseModel):
    id: int
    total_value_usd: float
    total_value_egp: float
    snapshot_date: datetime

    class Config:
        from_attributes = True
