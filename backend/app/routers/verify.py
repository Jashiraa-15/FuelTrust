from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    VerifyCalculationRequest,
    VerifyCalculationResponse,
    DeviceSimulateFlowRequest,
    DeviceSimulateFlowResponse
)
from app.services.verification_engine import VerificationEngine
from app.services.data_source import get_fuel_data_source
from app.routers.settings import get_or_create_settings

router = APIRouter(prefix="/api/verify", tags=["Verification"])

@router.post("", response_model=VerifyCalculationResponse)
def perform_verification(request: VerifyCalculationRequest, db: Session = Depends(get_db)):
    """
    Advanced Verification Engine Endpoint.
    Calculates signed differences, absolute error, percentage deviation,
    simulated expanded measurement uncertainty (95% confidence),
    and evaluates compliance against the configured threshold.
    """
    try:
        current_settings = get_or_create_settings(db)
        threshold = request.threshold_override or current_settings.verification_threshold

        evaluation = VerificationEngine.evaluate(
            dispenser_quantity=request.dispenser_quantity,
            measured_quantity=request.measured_quantity,
            threshold_percentage=threshold,
            uncertainty_override=request.uncertainty_override
        )

        return VerifyCalculationResponse(
            dispenser_quantity=evaluation.dispenser_quantity,
            measured_quantity=evaluation.measured_quantity,
            signed_difference=evaluation.signed_difference,
            difference=evaluation.difference,
            absolute_difference=evaluation.absolute_difference,
            deviation_percentage=evaluation.deviation_percentage,
            threshold=evaluation.threshold_applied,
            measurement_uncertainty=evaluation.measurement_uncertainty,
            confidence_level=evaluation.confidence_level,
            verification_margin=evaluation.verification_margin,
            verification_status=evaluation.verification_status,
            scientific_remark=evaluation.scientific_remark,
            human_explanation=evaluation.human_explanation,
            is_within_tolerance=evaluation.is_within_tolerance,
            fuel_temperature_c=evaluation.fuel_temperature_c,
            line_pressure_bar=evaluation.line_pressure_bar
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification calculation error: {str(e)}")

@router.post("/simulate-flow", response_model=DeviceSimulateFlowResponse)
async def simulate_sensor_flow(payload: DeviceSimulateFlowRequest):
    """
    Emulates an independent flow sensor measurement (YF-S201 via ESP32)
    with realistic hydro-dynamic noise, calibration factor, and uncertainty calculation.
    """
    try:
        source = get_fuel_data_source("simulated")
        result = await source.measure_dispense_event(
            dispenser_volume=payload.target_volume,
            profile=payload.error_mode,
            custom_flow_lpm=payload.flow_rate_lpm
        )

        signed_diff = round(result.dispenser_volume - result.measured_volume, 3)
        dev_pct = round((abs(signed_diff) / result.dispenser_volume) * 100.0, 2)
        uncertainty = VerificationEngine.calculate_uncertainty(result.measured_volume)

        return DeviceSimulateFlowResponse(
            dispenser_quantity=result.dispenser_volume,
            measured_quantity=result.measured_volume,
            difference=signed_diff,
            signed_difference=signed_diff,
            deviation_percentage=dev_pct,
            pulses_counted=result.raw_pulses,
            duration_seconds=result.duration_seconds,
            temperature_c=result.temperature_c,
            pressure_bar=2.1,
            measurement_uncertainty=uncertainty,
            simulation_profile=payload.error_mode
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flow simulation error: {str(e)}")
