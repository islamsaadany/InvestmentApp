from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SqlEnum, Boolean
from sqlalchemy.sql import func
from app.database import Base
import enum


class AssetType(str, enum.Enum):
    GOLD = "gold"
    SILVER = "silver"
    CRYPTO = "crypto"
    US_STOCK = "us_stock"
    EGX_STOCK = "egx_stock"


class WeightUnit(str, enum.Enum):
    GRAMS = "grams"
    OUNCES = "ounces"


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    symbol = Column(String(50), nullable=False)
    asset_type = Column(SqlEnum(AssetType), nullable=False)
    quantity = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)
    purchase_currency = Column(String(10), default="USD")
    purchase_date = Column(DateTime, nullable=True)
    weight_unit = Column(SqlEnum(WeightUnit), nullable=True)  # For gold/silver
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), nullable=False)
    asset_type = Column(SqlEnum(AssetType), nullable=False)
    target_price = Column(Float, nullable=False)
    condition = Column(String(10), nullable=False)  # "above" or "below"
    currency = Column(String(10), default="USD")
    is_triggered = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    total_value_usd = Column(Float, nullable=False)
    total_value_egp = Column(Float, nullable=False)
    snapshot_date = Column(DateTime, server_default=func.now())
