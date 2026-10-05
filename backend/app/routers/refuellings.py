import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Refuelling, VerificationResult, Vehicle
from app.schemas import RefuellingCreate, RefuellingOut
from app.services.verification_engine import VerificationEngine
from app.routers.settings import get_or_create_settings

router = APIRouter(prefix="/api/refuellings", tags=["Refuellings"])

@router.get("", response_model=List[RefuellingOut])
def get_refuellings(
    vehicle_id: Optional[int] = None,
    status: Optional[str] = None,
    fuel_type: Optional[str] = None,
    time_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated refuelling records with optional filtering by vehicle,
    verification status, fuel type, date range, or search terms.
    """
    query = db.query(Refuelling).order_by(desc(Refuelling.timestamp))

    if vehicle_id is not None:
        query = query.filter(Refuelling.vehicle_id == vehicle_id)

    if status and status.upper() in ["VERIFIED", "REVIEW"]:
        query = query.filter(Refuelling.verification_status == status.upper())

    if fuel_type and fuel_type != "ALL":
        query = query.filter(Refuelling.fuel_type == fuel_type)

    if time_filter and time_filter != "ALL":
        now = datetime.datetime.utcnow()
        if time_filter == "7d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=7))
        elif time_filter == "30d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=30))
        elif time_filter == "90d":
            query = query.filter(Refuelling.timestamp >= now - datetime.timedelta(days=90))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Refuelling.location.ilike(search_pattern)) |
            (Refuelling.dispenser_id.ilike(search_pattern)) |
            (Refuelling.notes.ilike(search_pattern))
        )

    records = query.offset(offset).limit(limit).all()

    results = []
    for r in records:
        v = db.query(Vehicle).filter(Vehicle.id == r.vehicle_id).first()
        results.append(RefuellingOut(
            id=r.id,
            vehicle_id=r.vehicle_id,
            vehicle_name=v.name if v else f"Vehicle #{r.vehicle_id}",
            vehicle_plate=v.plate_number if v else "N/A",
            fuel_type=r.fuel_type,
            dispenser_quantity=r.dispenser_quantity,
            measured_quantity=r.measured_quantity,
            difference=r.difference,
            signed_difference=r.difference,
            absolute_difference=r.absolute_difference,
            deviation_percentage=r.deviation_percentage,
            measurement_uncertainty=r.measurement_uncertainty or 0.05,
            confidence_level=r.confidence_level or 95.0,
            verification_margin=r.verification_margin,
            verification_status=r.verification_status,
            threshold_applied=r.threshold_applied,
            timestamp=r.timestamp,
            location=r.location or "Depot Pump #1",
            dispenser_id=r.dispenser_id,
            operator_name=r.operator_name,
            notes=r.notes,
            created_at=r.created_at,
            scientific_remark=r.verification_result.scientific_remark if r.verification_result else None,
            human_explanation=(
                "Measured quantity is within the configured verification threshold." 
                if r.verification_status == "VERIFIED" 
                else "Measured quantity differs from the dispenser value beyond the configured threshold. Review this event."
            )
        ))

    return results

@router.post("", response_model=RefuellingOut, status_code=201)
def create_refuelling(payload: RefuellingCreate, db: Session = Depends(get_db)):
    """
    Records a fuel refuelling event, executes the verification engine,
    determines the VERIFIED / REVIEW status, and persists the telemetry results.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle with ID {payload.vehicle_id} not found.")

    settings = get_or_create_settings(db)
    threshold = settings.verification_threshold

    try:
        evaluation = VerificationEngine.evaluate(
            dispenser_quantity=payload.dispenser_quantity,
            measured_quantity=payload.measured_quantity,
            threshold_percentage=threshold,
            uncertainty_override=payload.measurement_uncertainty
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))

    event_time = payload.timestamp or datetime.datetime.utcnow()

    refuelling = Refuelling(
        vehicle_id=payload.vehicle_id,
        fuel_type=payload.fuel_type or vehicle.fuel_type,
        dispenser_quantity=evaluation.dispenser_quantity,
        measured_quantity=evaluation.measured_quantity,
        difference=evaluation.signed_difference,
        absolute_difference=evaluation.absolute_difference,
        deviation_percentage=evaluation.deviation_percentage,
        verification_status=evaluation.verification_status,
        threshold_applied=evaluation.threshold_applied,
        measurement_uncertainty=evaluation.measurement_uncertainty,
        confidence_level=evaluation.confidence_level,
        verification_margin=evaluation.verification_margin,
        timestamp=event_time,
        location=payload.location or "Central Depot Station",
        dispenser_id=payload.dispenser_id or "Pump-01",
        operator_name=payload.operator_name or "Operator",
        notes=payload.notes
    )
    db.add(refuelling)
    db.commit()
    db.refresh(refuelling)

    raw_pulses = int(evaluation.measured_quantity * 450)
    verif_record = VerificationResult(
        refuelling_id=refuelling.id,
        dispenser_quantity=evaluation.dispenser_quantity,
        measured_quantity=evaluation.measured_quantity,
        difference=evaluation.signed_difference,
        absolute_difference=evaluation.absolute_difference,
        deviation_percentage=evaluation.deviation_percentage,
        threshold_used=evaluation.threshold_applied,
        measurement_uncertainty=evaluation.measurement_uncertainty,
        confidence_level=evaluation.confidence_level,
        verification_margin=evaluation.verification_margin,
        status=evaluation.verification_status,
        scientific_remark=evaluation.scientific_remark,
        flow_sensor_pulses=raw_pulses,
        fuel_temperature_c=24.5,
        line_pressure_bar=2.1
    )
    db.add(verif_record)
    db.commit()
    db.refresh(verif_record)

    return RefuellingOut(
        id=refuelling.id,
        vehicle_id=refuelling.vehicle_id,
        vehicle_name=vehicle.name,
        vehicle_plate=vehicle.plate_number,
        fuel_type=refuelling.fuel_type,
        dispenser_quantity=refuelling.dispenser_quantity,
        measured_quantity=refuelling.measured_quantity,
        difference=refuelling.difference,
        signed_difference=refuelling.difference,
        absolute_difference=refuelling.absolute_difference,
        deviation_percentage=refuelling.deviation_percentage,
        measurement_uncertainty=refuelling.measurement_uncertainty,
        confidence_level=refuelling.confidence_level,
        verification_margin=refuelling.verification_margin,
        verification_status=refuelling.verification_status,
        threshold_applied=refuelling.threshold_applied,
        timestamp=refuelling.timestamp,
        location=refuelling.location,
        dispenser_id=refuelling.dispenser_id,
        operator_name=refuelling.operator_name,
        notes=refuelling.notes,
        created_at=refuelling.created_at,
        scientific_remark=verif_record.scientific_remark,
        human_explanation=evaluation.human_explanation
    )

@router.get("/{id}", response_model=RefuellingOut)
def get_refuelling_by_id(id: int, db: Session = Depends(get_db)):
    """Retrieve a single refuelling record by its primary ID."""
    r = db.query(Refuelling).filter(Refuelling.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Refuelling record not found.")

    v = db.query(Vehicle).filter(Vehicle.id == r.vehicle_id).first()
    return RefuellingOut(
        id=r.id,
        vehicle_id=r.vehicle_id,
        vehicle_name=v.name if v else f"Vehicle #{r.vehicle_id}",
        vehicle_plate=v.plate_number if v else "N/A",
        fuel_type=r.fuel_type,
        dispenser_quantity=r.dispenser_quantity,
        measured_quantity=r.measured_quantity,
        difference=r.difference,
        signed_difference=r.difference,
        absolute_difference=r.absolute_difference,
        deviation_percentage=r.deviation_percentage,
        measurement_uncertainty=r.measurement_uncertainty or 0.05,
        confidence_level=r.confidence_level or 95.0,
        verification_margin=r.verification_margin,
        verification_status=r.verification_status,
        threshold_applied=r.threshold_applied,
        timestamp=r.timestamp,
        location=r.location,
        dispenser_id=r.dispenser_id,
        operator_name=r.operator_name,
        notes=r.notes,
        created_at=r.created_at,
        scientific_remark=r.verification_result.scientific_remark if r.verification_result else None,
        human_explanation=(
            "Measured quantity is within the configured verification threshold." 
            if r.verification_status == "VERIFIED" 
            else "Measured quantity differs from the dispenser value beyond the configured threshold. Review this event."
        )
    )

@router.delete("/{id}", status_code=204)
def delete_refuelling(id: int, db: Session = Depends(get_db)):
    """Delete a refuelling record."""
    r = db.query(Refuelling).filter(Refuelling.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Refuelling record not found.")
    db.delete(r)
    db.commit()
    return None
