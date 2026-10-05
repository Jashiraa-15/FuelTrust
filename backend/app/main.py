from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    dashboard_router,
    refuellings_router,
    verify_router,
    vehicles_router,
    device_router,
    settings_router,
    analytics_router,
    calibration_router
)
from app.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data if needed
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title="FuelTrust API",
    description="Independent Fuel-Refuelling Verification System Prototype API",
    version="1.1.0",
    lifespan=lifespan
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(dashboard_router)
app.include_router(refuellings_router)
app.include_router(verify_router)
app.include_router(vehicles_router)
app.include_router(device_router)
app.include_router(settings_router)
app.include_router(analytics_router)
app.include_router(calibration_router)

@app.get("/")
def root():
    return {
        "system": "FuelTrust",
        "tagline": "Independent Fuel Verification",
        "status": "online",
        "version": "1.1.0-prototype",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FuelTrust Backend",
        "mode": "PROTOTYPE_SIMULATED_SENSOR"
    }
