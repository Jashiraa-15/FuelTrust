import unittest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Vehicle, Refuelling, VerificationResult, Calibration, DeviceStatus
from app.services.verification_engine import VerificationEngine
from app.services.calibration_service import CalibrationService
from app.services.measurement_service import MeasurementService

class TestFuelTrustCore(unittest.TestCase):

    def setUp(self):
        # In-memory SQLite for testing
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    # --- 1. VERIFICATION ENGINE TESTS ---

    def test_normal_verification_within_threshold(self):
        """Test standard verification when deviation is within 2.0%."""
        res = VerificationEngine.evaluate(dispenser_quantity=50.0, measured_quantity=49.6, threshold_percentage=2.0)
        self.assertEqual(res.verification_status, "VERIFIED")
        self.assertTrue(res.is_within_tolerance)
        self.assertEqual(res.signed_difference, 0.4)
        self.assertEqual(res.absolute_difference, 0.4)
        self.assertEqual(res.deviation_percentage, 0.8)
        self.assertEqual(res.human_explanation, "Measured quantity is within the configured verification threshold.")
        self.assertIn("acceptable tolerance band", res.scientific_remark)
        self.assertGreater(res.measurement_uncertainty, 0.0)

    def test_threshold_boundary_verification(self):
        """Test verification precisely on the 2.0% boundary."""
        # 50.0L dispenser, 49.0L measured -> diff 1.0L = exactly 2.00%
        res = VerificationEngine.evaluate(dispenser_quantity=50.0, measured_quantity=49.0, threshold_percentage=2.0)
        self.assertEqual(res.verification_status, "VERIFIED")
        self.assertEqual(res.deviation_percentage, 2.0)
        self.assertTrue(res.is_within_tolerance)

    def test_above_threshold_discrepancy_review(self):
        """Test discrepancy above threshold producing REVIEW."""
        # 50.0L dispenser, 47.5L measured -> diff 2.5L = 5.00% dev
        res = VerificationEngine.evaluate(dispenser_quantity=50.0, measured_quantity=47.5, threshold_percentage=2.0)
        self.assertEqual(res.verification_status, "REVIEW")
        self.assertFalse(res.is_within_tolerance)
        self.assertEqual(res.signed_difference, 2.5)
        self.assertEqual(res.deviation_percentage, 5.0)
        self.assertEqual(res.human_explanation, "Measured quantity differs from the dispenser value beyond the configured threshold. Review this event.")
        self.assertIn("Verification discrepancy detected", res.scientific_remark)
        self.assertNotIn("fraud", res.scientific_remark.lower())
        self.assertNotIn("cheating", res.scientific_remark.lower())

    def test_zero_dispenser_quantity_error(self):
        """Test that zero dispenser quantity raises ValueError and prevents division by zero."""
        with self.assertRaises(ValueError):
            VerificationEngine.evaluate(dispenser_quantity=0.0, measured_quantity=10.0)

    def test_negative_quantities_error(self):
        """Test that negative quantities raise ValueError."""
        with self.assertRaises(ValueError):
            VerificationEngine.evaluate(dispenser_quantity=-10.0, measured_quantity=10.0)
        with self.assertRaises(ValueError):
            VerificationEngine.evaluate(dispenser_quantity=10.0, measured_quantity=-2.0)

    def test_missing_values_error(self):
        """Test that None values raise ValueError."""
        with self.assertRaises(ValueError):
            VerificationEngine.evaluate(dispenser_quantity=None, measured_quantity=10.0)
        with self.assertRaises(ValueError):
            VerificationEngine.evaluate(dispenser_quantity=10.0, measured_quantity=None)

    def test_predefined_demo_scenarios(self):
        """Test all 4 predefined demo scenarios specified in requirements."""
        # Scenario 1: Dispenser = 5.00 L, Measured = 4.98 L -> Expected VERIFIED
        s1 = VerificationEngine.evaluate(5.00, 4.98, 2.0)
        self.assertEqual(s1.verification_status, "VERIFIED")
        self.assertAlmostEqual(s1.deviation_percentage, 0.4, places=1)

        # Scenario 2: Dispenser = 5.00 L, Measured = 4.70 L -> Expected REVIEW (6.0%)
        s2 = VerificationEngine.evaluate(5.00, 4.70, 2.0)
        self.assertEqual(s2.verification_status, "REVIEW")
        self.assertEqual(s2.deviation_percentage, 6.0)

        # Scenario 3: Dispenser = 10.00 L, Measured = 10.03 L -> Expected VERIFIED (0.3%)
        s3 = VerificationEngine.evaluate(10.00, 10.03, 2.0)
        self.assertEqual(s3.verification_status, "VERIFIED")
        self.assertEqual(s3.deviation_percentage, 0.3)

        # Scenario 4: Small difference near threshold (20.00 L vs 19.58 L -> 2.10% -> REVIEW)
        s4 = VerificationEngine.evaluate(20.00, 19.58, 2.0)
        self.assertEqual(s4.verification_status, "REVIEW")
        self.assertEqual(s4.deviation_percentage, 2.1)

    # --- 2. CALIBRATION MODULE TESTS ---

    def test_calibration_calculation(self):
        """Test calibration error, percentage error, and correction factor."""
        # Standard: 10.0L reference, 9.80L measured -> error = -0.2L (-2.0%), factor = 10 / 9.8 = 1.0204
        res = CalibrationService.calculate_calibration(reference_quantity=10.0, measured_quantity=9.80)
        self.assertEqual(res.error, -0.2)
        self.assertEqual(res.percentage_error, -2.0)
        self.assertEqual(res.correction_factor, 1.0204)

        # Over-measuring: 20.0L reference, 20.5L measured -> error = +0.5L (+2.5%), factor = 20 / 20.5 = 0.9756
        res2 = CalibrationService.calculate_calibration(reference_quantity=20.0, measured_quantity=20.50)
        self.assertEqual(res2.error, 0.5)
        self.assertEqual(res2.percentage_error, 2.5)
        self.assertEqual(res2.correction_factor, 0.9756)

    def test_calibration_database_persistence(self):
        """Test recording calibration run into SQLite and updating active factor."""
        dev = DeviceStatus(device_id="DEV-TEST", connection_status="CONNECTED")
        self.db.add(dev)
        self.db.commit()

        cal = CalibrationService.record_calibration(
            db=self.db,
            reference_quantity=10.0,
            measured_quantity=9.90,
            sensor_id="YF-S201-SIM-01",
            notes="Factory test"
        )
        self.assertIsNotNone(cal.id)
        self.assertEqual(cal.correction_factor, 1.0101)
        self.assertTrue(cal.is_active)

        active_cal = CalibrationService.get_active_calibration(self.db, sensor_id="YF-S201-SIM-01")
        self.assertEqual(active_cal.id, cal.id)

    # --- 3. DATABASE INSERTION & RETRIEVAL ---

    def test_vehicle_and_refuelling_insertion(self):
        """Test vehicle creation with default flag and refuelling record logging."""
        veh = Vehicle(
            name="Test Transporter #01",
            plate_number="TST-9901",
            fuel_type="Diesel",
            tank_capacity=80.0,
            odometer_km=12000.0,
            is_default=True
        )
        self.db.add(veh)
        self.db.commit()
        self.db.refresh(veh)
        self.assertTrue(veh.is_default)

        eval_res = VerificationEngine.evaluate(40.0, 39.8, 2.0)
        ref = Refuelling(
            vehicle_id=veh.id,
            fuel_type="Diesel",
            dispenser_quantity=eval_res.dispenser_quantity,
            measured_quantity=eval_res.measured_quantity,
            difference=eval_res.signed_difference,
            absolute_difference=eval_res.absolute_difference,
            deviation_percentage=eval_res.deviation_percentage,
            verification_status=eval_res.verification_status,
            threshold_applied=eval_res.threshold_applied,
            measurement_uncertainty=eval_res.measurement_uncertainty,
            confidence_level=eval_res.confidence_level,
            verification_margin=eval_res.verification_margin,
            timestamp=datetime.datetime.utcnow(),
            location="Test Station"
        )
        self.db.add(ref)
        self.db.commit()
        self.db.refresh(ref)

        self.assertEqual(ref.verification_status, "VERIFIED")
        self.assertEqual(ref.difference, 0.2)
        self.assertEqual(ref.vehicle.name, "Test Transporter #01")

    # --- 4. LIVE MEASUREMENT SERVICE TESTS ---

    def test_live_measurement_session_lifecycle(self):
        """Test starting, ticking, stopping, and resetting live measurement session."""
        start_res = MeasurementService.start(target_flow_lpm=30.0)
        self.assertEqual(start_res["state"], "MEASURING")

        telemetry = MeasurementService.get_live_telemetry()
        self.assertEqual(telemetry.state, "MEASURING")
        self.assertGreater(telemetry.flow_rate_lpm, 0.0)
        self.assertEqual(telemetry.connection_status, "CONNECTED (SIMULATED)")

        stop_summary = MeasurementService.stop()
        self.assertEqual(stop_summary.status, "completed")
        self.assertGreaterEqual(stop_summary.measured_quantity, 0.0)

        reset_res = MeasurementService.reset()
        self.assertEqual(reset_res["state"], "IDLE")

if __name__ == "__main__":
    unittest.main()
