from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AppSetting
from app.schemas import AppSettingsOut, AppSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "verification_threshold": "2.0",
    "default_fuel_type": "Diesel",
    "units": "Litres",
    "demo_mode": "true",
    "device_connection_mode": "SIMULATED_ESP32",
    "high_alert_threshold": "4.0",
    "allow_operator_overrides": "false"
}

def get_or_create_settings(db: Session) -> AppSettingsOut:
    settings_dict = {}
    for key, default_val in DEFAULT_SETTINGS.items():
        record = db.query(AppSetting).filter(AppSetting.key == key).first()
        if not record:
            record = AppSetting(key=key, value=default_val, description=f"Configuration for {key}")
            db.add(record)
            db.commit()
            db.refresh(record)
        settings_dict[key] = record.value

    return AppSettingsOut(
        verification_threshold=float(settings_dict.get("verification_threshold", 2.0)),
        default_fuel_type=settings_dict.get("default_fuel_type", "Diesel"),
        units=settings_dict.get("units", "Litres"),
        demo_mode=settings_dict.get("demo_mode", "true").lower() == "true",
        device_connection_mode=settings_dict.get("device_connection_mode", "SIMULATED_ESP32"),
        high_alert_threshold=float(settings_dict.get("high_alert_threshold", 4.0)),
        allow_operator_overrides=settings_dict.get("allow_operator_overrides", "false").lower() == "true"
    )

@router.get("", response_model=AppSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    """Retrieve system configuration and verification thresholds."""
    return get_or_create_settings(db)

@router.put("", response_model=AppSettingsOut)
def update_settings(updates: AppSettingsUpdate, db: Session = Depends(get_db)):
    """Update system verification threshold, default fuel type, and operational parameters."""
    if updates.verification_threshold is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "verification_threshold").first()
        if rec:
            rec.value = str(updates.verification_threshold)

    if updates.default_fuel_type is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "default_fuel_type").first()
        if rec:
            rec.value = str(updates.default_fuel_type)

    if updates.units is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "units").first()
        if rec:
            rec.value = str(updates.units)

    if updates.demo_mode is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "demo_mode").first()
        if rec:
            rec.value = "true" if updates.demo_mode else "false"

    if updates.device_connection_mode is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "device_connection_mode").first()
        if rec:
            rec.value = str(updates.device_connection_mode)

    if updates.high_alert_threshold is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "high_alert_threshold").first()
        if rec:
            rec.value = str(updates.high_alert_threshold)

    if updates.allow_operator_overrides is not None:
        rec = db.query(AppSetting).filter(AppSetting.key == "allow_operator_overrides").first()
        if rec:
            rec.value = "true" if updates.allow_operator_overrides else "false"

    db.commit()
    return get_or_create_settings(db)
