from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Vehicle, Refuelling
from app.schemas import VehicleCreate, VehicleUpdate, VehicleOut

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleOut])
def list_vehicles(db: Session = Depends(get_db)):
    """Retrieve all vehicles registered in the fleet."""
    vehicles = db.query(Vehicle).order_by(Vehicle.is_default.desc(), Vehicle.id.asc()).all()
    results = []
    for v in vehicles:
        refuel_count = db.query(func.count(Refuelling.id)).filter(Refuelling.vehicle_id == v.id).scalar() or 0
        total_fuel = db.query(func.sum(Refuelling.dispenser_quantity)).filter(Refuelling.vehicle_id == v.id).scalar() or 0.0
        results.append(VehicleOut(
            id=v.id,
            name=v.name,
            plate_number=v.plate_number,
            fuel_type=v.fuel_type,
            tank_capacity=v.tank_capacity,
            odometer_km=v.odometer_km,
            department=v.department,
            is_default=v.is_default or False,
            created_at=v.created_at,
            refuelling_count=refuel_count,
            total_fuel_litres=round(total_fuel, 2)
        ))
    return results

@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    """Register a new vehicle to the FuelTrust fleet registry."""
    existing = db.query(Vehicle).filter(Vehicle.plate_number == payload.plate_number.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle with plate number '{payload.plate_number}' already exists.")

    if payload.is_default:
        db.query(Vehicle).update({"is_default": False})

    new_vehicle = Vehicle(
        name=payload.name.strip(),
        plate_number=payload.plate_number.strip().upper(),
        fuel_type=payload.fuel_type,
        tank_capacity=payload.tank_capacity,
        odometer_km=payload.odometer_km,
        department=payload.department or "Logistics",
        is_default=payload.is_default or False
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return VehicleOut(
        id=new_vehicle.id,
        name=new_vehicle.name,
        plate_number=new_vehicle.plate_number,
        fuel_type=new_vehicle.fuel_type,
        tank_capacity=new_vehicle.tank_capacity,
        odometer_km=new_vehicle.odometer_km,
        department=new_vehicle.department,
        is_default=new_vehicle.is_default,
        created_at=new_vehicle.created_at,
        refuelling_count=0,
        total_fuel_litres=0.0
    )

@router.post("/{id}/set-default", response_model=VehicleOut)
def set_default_vehicle(id: int, db: Session = Depends(get_db)):
    """Designates a vehicle as the fleet default for rapid verification pre-filling."""
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    db.query(Vehicle).update({"is_default": False})
    v.is_default = True
    db.commit()
    db.refresh(v)

    refuel_count = db.query(func.count(Refuelling.id)).filter(Refuelling.vehicle_id == v.id).scalar() or 0
    total_fuel = db.query(func.sum(Refuelling.dispenser_quantity)).filter(Refuelling.vehicle_id == v.id).scalar() or 0.0

    return VehicleOut(
        id=v.id,
        name=v.name,
        plate_number=v.plate_number,
        fuel_type=v.fuel_type,
        tank_capacity=v.tank_capacity,
        odometer_km=v.odometer_km,
        department=v.department,
        is_default=v.is_default,
        created_at=v.created_at,
        refuelling_count=refuel_count,
        total_fuel_litres=round(total_fuel, 2)
    )

@router.get("/{id}", response_model=VehicleOut)
def get_vehicle(id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific vehicle."""
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    
    refuel_count = db.query(func.count(Refuelling.id)).filter(Refuelling.vehicle_id == v.id).scalar() or 0
    total_fuel = db.query(func.sum(Refuelling.dispenser_quantity)).filter(Refuelling.vehicle_id == v.id).scalar() or 0.0

    return VehicleOut(
        id=v.id,
        name=v.name,
        plate_number=v.plate_number,
        fuel_type=v.fuel_type,
        tank_capacity=v.tank_capacity,
        odometer_km=v.odometer_km,
        department=v.department,
        is_default=v.is_default or False,
        created_at=v.created_at,
        refuelling_count=refuel_count,
        total_fuel_litres=round(total_fuel, 2)
    )

@router.put("/{id}", response_model=VehicleOut)
def update_vehicle(id: int, payload: VehicleUpdate, db: Session = Depends(get_db)):
    """Update vehicle specifications."""
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if payload.name is not None:
        v.name = payload.name.strip()
    if payload.plate_number is not None:
        plate = payload.plate_number.strip().upper()
        conflict = db.query(Vehicle).filter(Vehicle.plate_number == plate, Vehicle.id != id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Plate number already in use by another vehicle.")
        v.plate_number = plate
    if payload.fuel_type is not None:
        v.fuel_type = payload.fuel_type
    if payload.tank_capacity is not None:
        v.tank_capacity = payload.tank_capacity
    if payload.odometer_km is not None:
        v.odometer_km = payload.odometer_km
    if payload.department is not None:
        v.department = payload.department
    if payload.is_default is not None:
        if payload.is_default:
            db.query(Vehicle).update({"is_default": False})
        v.is_default = payload.is_default

    db.commit()
    db.refresh(v)

    refuel_count = db.query(func.count(Refuelling.id)).filter(Refuelling.vehicle_id == v.id).scalar() or 0
    total_fuel = db.query(func.sum(Refuelling.dispenser_quantity)).filter(Refuelling.vehicle_id == v.id).scalar() or 0.0

    return VehicleOut(
        id=v.id,
        name=v.name,
        plate_number=v.plate_number,
        fuel_type=v.fuel_type,
        tank_capacity=v.tank_capacity,
        odometer_km=v.odometer_km,
        department=v.department,
        is_default=v.is_default or False,
        created_at=v.created_at,
        refuelling_count=refuel_count,
        total_fuel_litres=round(total_fuel, 2)
    )

@router.delete("/{id}", status_code=204)
def delete_vehicle(id: int, db: Session = Depends(get_db)):
    """Remove a vehicle from the fleet."""
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    db.delete(v)
    db.commit()
    return None
