from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalyticsSummaryOut
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsSummaryOut)
def get_analytics(
    time_filter: Optional[str] = Query("all", description="'7d', '30d', '90d', or 'all'"),
    vehicle_id: Optional[int] = Query(None, description="Optional vehicle ID filter"),
    fuel_type: Optional[str] = Query(None, description="Optional fuel type filter"),
    db: Session = Depends(get_db)
):
    """
    Returns deep aggregate telemetry for fuel analytics, deviation distribution curves,
    station ranking, vehicle variance rankings, mileage estimations, and chronological trends.
    """
    return AnalyticsService.get_full_analytics(
        db,
        time_filter=time_filter or "all",
        vehicle_id=vehicle_id,
        fuel_type=fuel_type
    )
