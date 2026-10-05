import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DeviceStatus
from app.schemas import (
    DeviceStatusOut,
    LiveTelemetryOut,
    StartMeasurementRequest,
    StopMeasurementResponse
)
from app.services.data_source import get_fuel_data_source
from app.services.measurement_service import MeasurementService

router = APIRouter(prefix="/api/device", tags=["Device"])

def get_or_create_device_status(db: Session) -> DeviceStatus:
    record = db.query(DeviceStatus).first()
    if not record:
        record = DeviceStatus(
            device_id="FT-ESP32-DEV-001",
            device_name="FuelTrust In-Line Flow Sentinel (ESP32-S3)",
            connection_status="CONNECTED (SIMULATED)",
            flow_sensor_status="OPERATIONAL (YF-S201 Emulated)",
            temperature_sensor_status="OPERATIONAL (DS18B20 24.5°C)",
            pressure_sensor_status="OPERATIONAL (2.1 bar)",
            gps_status="3D Fix (8 Satellites - Accuracy ±1.5m)",
            battery_level=94,
            signal_strength=-62,
            firmware_version="v1.4.2-proto",
            calibration_factor=1.0,
            pulses_per_litre=450.0,
            last_ping=datetime.datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record

@router.get("/status", response_model=DeviceStatusOut)
async def get_device_status(db: Session = Depends(get_db)):
    """
    Returns the real-time hardware status and telemetry of the FuelTrust flow measurement unit.
    Labeled as DEMO / SIMULATED DATA.
    """
    status_record = get_or_create_device_status(db)
    source = get_fuel_data_source("simulated")
    telemetry = await source.get_device_telemetry()

    # Update dynamic fields
    status_record.battery_level = telemetry.battery_level
    status_record.signal_strength = telemetry.signal_strength
    status_record.last_ping = telemetry.last_ping
    db.commit()
    db.refresh(status_record)

    return DeviceStatusOut(
        id=status_record.id,
        device_id=status_record.device_id,
        device_name=status_record.device_name,
        connection_status=status_record.connection_status,
        flow_sensor_status=status_record.flow_sensor_status,
        temperature_sensor_status=status_record.temperature_sensor_status,
        pressure_sensor_status=status_record.pressure_sensor_status or "OPERATIONAL (2.1 bar)",
        gps_status=status_record.gps_status,
        battery_level=status_record.battery_level,
        signal_strength=status_record.signal_strength,
        firmware_version=status_record.firmware_version,
        calibration_factor=status_record.calibration_factor,
        pulses_per_litre=status_record.pulses_per_litre or 450.0,
        last_ping=status_record.last_ping,
        is_simulated=True,
        active_stream_rate_lpm=35.0
    )

@router.post("/ping", response_model=DeviceStatusOut)
def ping_device(db: Session = Depends(get_db)):
    """Simulates an active keep-alive ping heartbeat from the ESP32 unit."""
    record = get_or_create_device_status(db)
    record.last_ping = datetime.datetime.utcnow()
    db.commit()
    db.refresh(record)
    return DeviceStatusOut(
        id=record.id,
        device_id=record.device_id,
        device_name=record.device_name,
        connection_status="CONNECTED (SIMULATED)",
        flow_sensor_status=record.flow_sensor_status,
        temperature_sensor_status=record.temperature_sensor_status,
        pressure_sensor_status=record.pressure_sensor_status or "OPERATIONAL (2.1 bar)",
        gps_status=record.gps_status,
        battery_level=record.battery_level,
        signal_strength=record.signal_strength,
        firmware_version=record.firmware_version,
        calibration_factor=record.calibration_factor,
        pulses_per_litre=record.pulses_per_litre or 450.0,
        last_ping=record.last_ping,
        is_simulated=True,
        active_stream_rate_lpm=35.0
    )

# --- LIVE MEASUREMENT ENDPOINTS ---

@router.get("/live", response_model=LiveTelemetryOut)
def get_live_stream_telemetry():
    """Returns instantaneous live telemetry snapshot (flow rate, volume, temp, pressure, pulses, timer)."""
    frame = MeasurementService.get_live_telemetry()
    return LiveTelemetryOut(
        state=frame.state,
        connection_status=frame.connection_status,
        flow_rate_lpm=frame.flow_rate_lpm,
        accumulated_volume_litres=frame.accumulated_volume_litres,
        raw_pulses=frame.raw_pulses,
        temperature_celsius=frame.temperature_celsius,
        pressure_bar=frame.pressure_bar,
        battery_level=frame.battery_level,
        gps_status=frame.gps_status,
        signal_strength=frame.signal_strength,
        elapsed_seconds=frame.elapsed_seconds,
        timestamp=frame.timestamp,
        is_simulated=True
    )

@router.post("/start")
def start_live_measurement(payload: StartMeasurementRequest = StartMeasurementRequest()):
    """Starts live measurement accumulation session."""
    return MeasurementService.start(target_flow_lpm=payload.target_flow_lpm or 35.0)

@router.post("/stop", response_model=StopMeasurementResponse)
def stop_live_measurement():
    """Stops live measurement session and returns final volume, pulses, duration, and estimated uncertainty."""
    summary = MeasurementService.stop()
    return StopMeasurementResponse(
        session_id=summary.session_id,
        measured_quantity=summary.measured_quantity,
        duration_seconds=summary.duration_seconds,
        raw_pulses=summary.raw_pulses,
        avg_flow_rate_lpm=summary.avg_flow_rate_lpm,
        avg_temperature_c=summary.avg_temperature_c,
        avg_pressure_bar=summary.avg_pressure_bar,
        estimated_uncertainty=summary.estimated_uncertainty,
        status=summary.status,
        timestamp=summary.timestamp
    )

@router.post("/reset")
def reset_live_measurement():
    """Resets live measurement session counters."""
    return MeasurementService.reset()

@router.get("/history", response_model=List[Dict[str, Any]])
def get_live_measurement_history():
    """Returns recent telemetry time series samples for real-time charting."""
    return MeasurementService.get_telemetry_history()
