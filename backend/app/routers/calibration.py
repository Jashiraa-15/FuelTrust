import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CalibrationCreate, CalibrationOut
from app.services.calibration_service import CalibrationService

router = APIRouter(prefix="/api/calibration", tags=["Calibration"])

@router.post("", response_model=CalibrationOut, status_code=201)
def record_sensor_calibration(payload: CalibrationCreate, db: Session = Depends(get_db)):
    """
    Executes a volumetric calibration calculation and persists the calibration factor.
    Calculates error = Q_meas - Q_ref, percentage error, and correction factor K = Q_ref / Q_meas.
    """
    try:
        record = CalibrationService.record_calibration(
            db=db,
            reference_quantity=payload.reference_quantity,
            measured_quantity=payload.measured_quantity,
            sensor_id=payload.sensor_id or "YF-S201-SIM-01",
            operator_name=payload.operator_name or "Calibration Metrologist",
            notes=payload.notes
        )
        return record
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration failure: {str(e)}")

@router.get("/history", response_model=List[CalibrationOut])
def get_calibration_history(sensor_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve historical calibration logs and factors."""
    return CalibrationService.get_history(db, sensor_id=sensor_id)

@router.get("/active", response_model=Optional[CalibrationOut])
def get_active_calibration_factor(sensor_id: str = "YF-S201-SIM-01", db: Session = Depends(get_db)):
    """Retrieve the currently active calibration factor applied to the flow meter."""
    active = CalibrationService.get_active_calibration(db, sensor_id=sensor_id)
    if not active:
        # If no explicit calibration recorded yet, return standard 1.0 nominal reference
        return CalibrationOut(
            id=0,
            calibration_date=datetime.datetime.utcnow(),
            sensor_id=sensor_id,
            reference_quantity=10.0,
            measured_quantity=10.0,
            error=0.0,
            percentage_error=0.0,
            correction_factor=1.0,
            operator_name="Factory Default",
            notes="Default nominal factory calibration (1.0000x)",
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
    return active
