import datetime
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Vehicle, Refuelling, VerificationResult, DeviceStatus, AppSetting, User, Calibration
from app.services.verification_engine import VerificationEngine
from app.services.calibration_service import CalibrationService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Users if not present
        if db.query(User).count() == 0:
            default_user = User(
                username="field_operator",
                email="operator@fueltrust.internal",
                role="Field Inspector"
            )
            db.add(default_user)

        # 2. Seed Settings if not present
        default_settings = [
            ("verification_threshold", "2.0", "Verification tolerance threshold in percentage (%)"),
            ("default_fuel_type", "Diesel", "Default pre-selected fuel type in verification form"),
            ("units", "Litres", "Volumetric unit of measurement"),
            ("demo_mode", "true", "Enable interactive sensor simulation for demo"),
            ("device_connection_mode", "SIMULATED_ESP32", "Active telemetry receiver mode"),
            ("high_alert_threshold", "4.0", "Threshold for elevated discrepancy warning"),
            ("allow_operator_overrides", "false", "Allow field manual override annotations")
        ]
        for key, val, desc in default_settings:
            if not db.query(AppSetting).filter(AppSetting.key == key).first():
                db.add(AppSetting(key=key, value=val, description=desc))

        # 3. Seed Device Status if not present
        if db.query(DeviceStatus).count() == 0:
            device = DeviceStatus(
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
                calibration_factor=1.0024,
                pulses_per_litre=450.0,
                last_ping=datetime.datetime.utcnow()
            )
            db.add(device)

        # 4. Seed Calibration History if not present
        if db.query(Calibration).count() == 0:
            now = datetime.datetime.utcnow()
            calibrations_seed = [
                (10.0, 10.02, now - datetime.timedelta(days=14), "Initial factory benchmark calibration at 35 L/min."),
                (20.0, 19.95, now - datetime.timedelta(days=7), "Bi-weekly metrology proving run against certified 20L prover."),
                (10.0, 9.98, now - datetime.timedelta(days=1), "Routine field proving before regional verification batch.")
            ]
            for ref_q, meas_q, cal_dt, notes in calibrations_seed:
                res = CalibrationService.calculate_calibration(ref_q, meas_q)
                cal_rec = Calibration(
                    calibration_date=cal_dt,
                    sensor_id="YF-S201-SIM-01",
                    reference_quantity=res.reference_quantity,
                    measured_quantity=res.measured_quantity,
                    error=res.error,
                    percentage_error=res.percentage_error,
                    correction_factor=res.correction_factor,
                    operator_name="Metrologist J. Davis",
                    notes=notes,
                    is_active=False
                )
                db.add(cal_rec)
            
            # Latest active calibration
            latest_cal = Calibration(
                calibration_date=now - datetime.timedelta(hours=6),
                sensor_id="YF-S201-SIM-01",
                reference_quantity=10.0,
                measured_quantity=9.98,
                error=-0.02,
                percentage_error=-0.2,
                correction_factor=1.0020,
                operator_name="Metrologist J. Davis",
                notes="Active field calibration profile (1.0020x)",
                is_active=True
            )
            db.add(latest_cal)

        # 5. Seed Vehicles if not present
        if db.query(Vehicle).count() == 0:
            vehicles_data = [
                {"name": "Heavy Hauler Truck #101", "plate_number": "TX-9842", "fuel_type": "Diesel", "tank_capacity": 300.0, "odometer_km": 84210.0, "department": "Heavy Logistics", "is_default": True},
                {"name": "Urban Delivery Van #14", "plate_number": "CA-4120", "fuel_type": "Diesel", "tank_capacity": 75.0, "odometer_km": 36150.0, "department": "Metro Delivery", "is_default": False},
                {"name": "Field Inspection SUV #03", "plate_number": "NY-7731", "fuel_type": "Petrol 95", "tank_capacity": 65.0, "odometer_km": 21890.0, "department": "Quality Assurance", "is_default": False},
                {"name": "Regional Cargo Van #08", "plate_number": "FL-5509", "fuel_type": "Diesel", "tank_capacity": 80.0, "odometer_km": 52400.0, "department": "Regional Freight", "is_default": False},
                {"name": "Executive Shuttle Bus #02", "plate_number": "IL-3382", "fuel_type": "Petrol 91", "tank_capacity": 110.0, "odometer_km": 19430.0, "department": "Corporate Transport", "is_default": False},
            ]
            
            created_vehicles = []
            for v_data in vehicles_data:
                v = Vehicle(**v_data)
                db.add(v)
                created_vehicles.append(v)
            db.commit()

        # 6. Seed Historical Refuellings if not present
        if db.query(Refuelling).count() == 0:
            vehicles_list = db.query(Vehicle).all()
            if vehicles_list:
                now = datetime.datetime.utcnow()
                refuellings_seed = [
                    # (veh_idx, fuel_type, dispenser_qty, measured_qty, hours_ago, location, pump, notes)
                    (0, "Diesel", 220.0, 219.1, 2, "North Harbor Terminal", "Pump-04", "Routine full-tank refuel. High-flow nozzle."),
                    (1, "Diesel", 62.5, 62.1, 8, "Metro Central Depot", "Pump-01", "Standard delivery route prep."),
                    (2, "Petrol 95", 48.0, 46.2, 18, "Highway 101 Expressway Service", "Pump-06", "Discrepancy noted during highway stop."),
                    (3, "Diesel", 71.0, 70.8, 30, "Eastside Logistics Hub", "Pump-02", "Evening refuel after return leg."),
                    (4, "Petrol 91", 85.0, 84.7, 48, "Airport Commercial Station", "Pump-03", "Standard shuttle maintenance top-up."),
                    (0, "Diesel", 245.0, 237.4, 72, "West Valley Industrial Park", "Pump-05", "Uncalibrated commercial dispenser suspected."),
                    (1, "Diesel", 55.0, 54.8, 96, "Metro Central Depot", "Pump-01", "Normal operation."),
                    (2, "Petrol 95", 52.0, 51.9, 120, "Downtown Station Hub", "Pump-02", "Precise measurement alignment."),
                    (3, "Diesel", 68.0, 65.4, 150, "South Harbor Gateway", "Pump-07", "Discrepancy reported on older mechanical pump."),
                    (4, "Petrol 91", 90.0, 89.2, 210, "Airport Commercial Station", "Pump-03", "Regular shuttle service."),
                    (0, "Diesel", 195.0, 194.2, 300, "North Harbor Terminal", "Pump-04", "Normal high-volume dispense."),
                    (1, "Diesel", 58.0, 57.6, 420, "Metro Central Depot", "Pump-02", "Clean verification pass."),
                    (3, "Diesel", 74.0, 73.5, 580, "Eastside Logistics Hub", "Pump-01", "Standard fill."),
                    (2, "Petrol 95", 44.0, 42.1, 750, "Highway 101 Expressway Service", "Pump-06", "Repeated minor discrepancy on pump #6."),
                    (0, "Diesel", 210.0, 209.4, 980, "North Harbor Terminal", "Pump-04", "Monthly bulk freight top-up."),
                    (4, "Petrol 91", 82.0, 81.6, 1200, "Airport Commercial Station", "Pump-03", "Standard shuttle routine."),
                    (1, "Diesel", 60.0, 59.8, 1500, "Metro Central Depot", "Pump-01", "Early period benchmark.")
                ]

                for (v_idx, fuel_t, disp_qty, meas_qty, hrs_ago, loc, pump, notes) in refuellings_seed:
                    veh = vehicles_list[min(v_idx, len(vehicles_list) - 1)]
                    eval_res = VerificationEngine.evaluate(disp_qty, meas_qty, threshold_percentage=2.0)
                    event_time = now - datetime.timedelta(hours=hrs_ago)

                    refuel = Refuelling(
                        vehicle_id=veh.id,
                        fuel_type=fuel_t,
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
                        timestamp=event_time,
                        location=loc,
                        dispenser_id=pump,
                        operator_name="Field Inspector J. Doe",
                        notes=notes,
                        created_at=event_time
                    )
                    db.add(refuel)
                    db.commit()
                    db.refresh(refuel)

                    verif_entry = VerificationResult(
                        refuelling_id=refuel.id,
                        dispenser_quantity=eval_res.dispenser_quantity,
                        measured_quantity=eval_res.measured_quantity,
                        difference=eval_res.signed_difference,
                        absolute_difference=eval_res.absolute_difference,
                        deviation_percentage=eval_res.deviation_percentage,
                        threshold_used=eval_res.threshold_applied,
                        measurement_uncertainty=eval_res.measurement_uncertainty,
                        confidence_level=eval_res.confidence_level,
                        verification_margin=eval_res.verification_margin,
                        status=eval_res.verification_status,
                        scientific_remark=eval_res.scientific_remark,
                        flow_sensor_pulses=int(eval_res.measured_quantity * 450),
                        fuel_temperature_c=24.2,
                        line_pressure_bar=2.1,
                        created_at=event_time
                    )
                    db.add(verif_entry)
                
                db.commit()

        print("Database seed completed successfully with calibration and uncertainty parameters.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
