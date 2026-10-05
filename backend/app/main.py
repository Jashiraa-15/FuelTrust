import os
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
    description="Smart Fuel Verification & Vehicle Efficiency Monitoring API",
    version="1.1.0",
    lifespan=lifespan
)

# Configure CORS origins for local dev and Vercel production frontend
cors_env = os.getenv("CORS_ORIGINS", "")
parsed_env_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://fueltrust.vercel.app",
    "https://fuel-trust.vercel.app",
]

allowed_origins = list(set(default_origins + parsed_env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
        "tagline": "Smart Fuel Verification & Vehicle Efficiency Monitoring",
        "status": "online",
        "version": "1.1.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FuelTrust Backend",
        "mode": "SIMULATED_SENSOR_INTERFACE"
    }
