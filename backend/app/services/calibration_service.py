import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Calibration, DeviceStatus

class CalibrationCalculationResult:
    def __init__(
        self,
        reference_quantity: float,
        measured_quantity: float,
        error: float,
        percentage_error: float,
        correction_factor: float
    ):
        self.reference_quantity = reference_quantity
        self.measured_quantity = measured_quantity
        self.error = error
        self.percentage_error = percentage_error
        self.correction_factor = correction_factor

class CalibrationService:
    @staticmethod
    def calculate_calibration(
        reference_quantity: float,
        measured_quantity: float
    ) -> CalibrationCalculationResult:
        if reference_quantity <= 0:
            raise ValueError("Reference quantity must be greater than zero.")
        if measured_quantity <= 0:
            raise ValueError("Measured quantity must be greater than zero.")

        ref = round(float(reference_quantity), 3)
        meas = round(float(measured_quantity), 3)

        # Error = Measured - Reference
        error = round(meas - ref, 3)
        # Percentage Error = (Error / Reference) * 100
        percentage_error = round((error / ref) * 100.0, 2)
        # Correction Factor = Reference / Measured
        correction_factor = round(ref / meas, 4)

        return CalibrationCalculationResult(
            reference_quantity=ref,
            measured_quantity=meas,
            error=error,
            percentage_error=percentage_error,
            correction_factor=correction_factor
        )

    @classmethod
    def record_calibration(
        cls,
        db: Session,
        reference_quantity: float,
        measured_quantity: float,
        sensor_id: str = "YF-S201-SIM-01",
        operator_name: str = "Metrology Specialist",
        notes: Optional[str] = None
    ) -> Calibration:
        result = cls.calculate_calibration(reference_quantity, measured_quantity)

        # Deactivate previous calibrations for this sensor
        db.query(Calibration).filter(Calibration.sensor_id == sensor_id).update({"is_active": False})

        cal_record = Calibration(
            calibration_date=datetime.datetime.utcnow(),
            sensor_id=sensor_id,
            reference_quantity=result.reference_quantity,
            measured_quantity=result.measured_quantity,
            error=result.error,
            percentage_error=result.percentage_error,
            correction_factor=result.correction_factor,
            operator_name=operator_name,
            notes=notes,
            is_active=True
        )
        db.add(cal_record)

        # Update DeviceStatus calibration_factor
        dev = db.query(DeviceStatus).first()
        if dev:
            dev.calibration_factor = result.correction_factor

        db.commit()
        db.refresh(cal_record)
        return cal_record

    @staticmethod
    def get_history(db: Session, sensor_id: Optional[str] = None) -> List[Calibration]:
        query = db.query(Calibration).order_by(Calibration.calibration_date.desc())
        if sensor_id:
            query = query.filter(Calibration.sensor_id == sensor_id)
        return query.all()

    @staticmethod
    def get_active_calibration(db: Session, sensor_id: str = "YF-S201-SIM-01") -> Optional[Calibration]:
        return db.query(Calibration).filter(
            Calibration.sensor_id == sensor_id,
            Calibration.is_active == True
        ).first()
