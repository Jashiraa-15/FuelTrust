from app.routers.dashboard import router as dashboard_router
from app.routers.refuellings import router as refuellings_router
from app.routers.verify import router as verify_router
from app.routers.vehicles import router as vehicles_router
from app.routers.device import router as device_router
from app.routers.settings import router as settings_router
from app.routers.analytics import router as analytics_router
from app.routers.calibration import router as calibration_router

__all__ = [
    "dashboard_router",
    "refuellings_router",
    "verify_router",
    "vehicles_router",
    "device_router",
    "settings_router",
    "analytics_router",
    "calibration_router"
]
