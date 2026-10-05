from typing import Optional
from pydantic import BaseModel

class VerificationEvaluation(BaseModel):
    dispenser_quantity: float
    measured_quantity: float
    signed_difference: float          # dispenser - measured
    difference: float                 # alias for backwards compatibility
    absolute_difference: float        # abs(dispenser - measured)
    deviation_percentage: float       # (abs(diff) / dispenser) * 100
    threshold_applied: float
    measurement_uncertainty: float    # Simulated expanded uncertainty (±L)
    confidence_level: float           # e.g., 95.0%
    verification_margin: float        # Effective tolerance boundary
    verification_status: str          # "VERIFIED" or "REVIEW"
    scientific_remark: str
    human_explanation: str
    is_within_tolerance: bool
    fuel_temperature_c: float = 24.5
    line_pressure_bar: float = 2.1

class VerificationEngine:
    """
    Dedicated Independent Verification Service for FuelTrust.
    Calculates volumetric difference, absolute error, percentage deviation,
    simulated measurement uncertainty, and determines tolerance compliance.
    """

    @staticmethod
    def calculate_uncertainty(measured_quantity: float) -> float:
        """
        Calculates simulated expanded measurement uncertainty (k=2, 95% confidence).
        Sensor model combines a proportional tolerance (0.8%) with instrument resolution (±0.01L).
        """
        base_u = (0.008 * measured_quantity) + 0.01
        return round(max(0.02, min(base_u, 0.5)), 2)

    @classmethod
    def evaluate(
        cls,
        dispenser_quantity: float,
        measured_quantity: float,
        threshold_percentage: float = 2.0,
        uncertainty_override: Optional[float] = None
    ) -> VerificationEvaluation:
        # 1. Validation Checks
        if dispenser_quantity is None or measured_quantity is None:
            raise ValueError("Dispenser quantity and measured quantity are required.")
        if dispenser_quantity <= 0:
            raise ValueError("Dispenser quantity must be greater than zero.")
        if measured_quantity < 0:
            raise ValueError("Measured quantity cannot be a negative value.")
        if threshold_percentage <= 0:
            raise ValueError("Verification threshold must be a positive percentage.")

        # 2. Precision Formatting
        dispenser_qty = round(float(dispenser_quantity), 3)
        measured_qty = round(float(measured_quantity), 3)
        threshold = round(float(threshold_percentage), 2)

        # 3. Delta Calculations
        signed_diff = round(dispenser_qty - measured_qty, 3)
        absolute_diff = round(abs(signed_diff), 3)

        # 4. Deviation Percentage
        deviation_pct = round((absolute_diff / dispenser_qty) * 100.0, 2)

        # 5. Measurement Uncertainty (Simulated / Calibrated model)
        uncertainty = uncertainty_override if uncertainty_override is not None else cls.calculate_uncertainty(measured_qty)
        confidence = 95.0
        # Verification margin indicates the buffer between threshold and recorded deviation
        verif_margin = round(threshold - deviation_pct, 2)

        # 6. Status Determination
        is_within_tolerance = deviation_pct <= threshold
        status = "VERIFIED" if is_within_tolerance else "REVIEW"

        # 7. Scientifically Neutral Explanations
        if is_within_tolerance:
            human_explanation = "Measured quantity is within the configured verification threshold."
            scientific_remark = (
                f"Volumetric measurement aligns within the acceptable tolerance band (±{threshold:.1f}%). "
                f"Independent measured volume is {measured_qty:.2f}L with an estimated uncertainty of ±{uncertainty:.2f}L (95% confidence). "
                f"Recorded deviation is {deviation_pct:.2f}%."
            )
        else:
            human_explanation = "Measured quantity differs from the dispenser value beyond the configured threshold. Review this event."
            direction = "lower than dispenser display" if signed_diff > 0 else "higher than dispenser display"
            scientific_remark = (
                f"Verification discrepancy detected ({deviation_pct:.2f}% deviation exceeds the ±{threshold:.1f}% threshold). "
                f"Independent flow measurement was {absolute_diff:.2f}L {direction} (Estimated uncertainty: ±{uncertainty:.2f}L). "
                f"Mechanical inspection and dispenser review recommended."
            )

        return VerificationEvaluation(
            dispenser_quantity=dispenser_qty,
            measured_quantity=measured_qty,
            signed_difference=signed_diff,
            difference=signed_diff,
            absolute_difference=absolute_diff,
            deviation_percentage=deviation_pct,
            threshold_applied=threshold,
            measurement_uncertainty=uncertainty,
            confidence_level=confidence,
            verification_margin=verif_margin,
            verification_status=status,
            scientific_remark=scientific_remark,
            human_explanation=human_explanation,
            is_within_tolerance=is_within_tolerance,
            fuel_temperature_c=24.5,
            line_pressure_bar=2.1
        )
