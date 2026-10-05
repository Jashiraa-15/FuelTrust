from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Returns executive summary statistics for the FuelTrust dashboard:
    total fuel recorded, refuelling counts, verified vs review counts,
    average percentage deviation, latest verification breakdown, and recent history.
    """
    return AnalyticsService.get_dashboard_summary(db)
