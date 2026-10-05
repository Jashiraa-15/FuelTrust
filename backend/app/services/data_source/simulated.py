import random
import datetime
from app.services.data_source.base import BaseFuelDataSource, SensorMeasurementResult, DeviceTelemetryData

class SimulatedSensorDataSource(BaseFuelDataSource):
    """
    Simulates the YF-S201 Hall-effect turbine flow sensor + DS18B20 temperature sensor + ESP32.
    Physics/Calibration:
      YF-S201 has standard formula: F = 7.5 * Q (Hz = 7.5 * Litres/Minute).
      Total pulses per litre ~= 450 pulses/L.
    """

    def __init__(self, device_id: str = "FT-ESP32-DEMO-01"):
        self.device_id = device_id
        self.pulses_per_litre_nominal = 450.0

    def get_source_name(self) -> str:
        return "SIMULATED_FLOW_SENSOR (YF-S201 Emulated)"

    def is_connected(self) -> bool:
        return True

    async def measure_dispense_event(
        self,
        dispenser_volume: float,
        profile: str = "accurate",
        custom_flow_lpm: float = 35.0
    ) -> SensorMeasurementResult:
        """
        Simulates measuring a fuel dispense with selectable error profiles:
        - 'accurate': random deviation between -0.8% and +0.8% (typical calibrated sensor)
        - 'moderate_variance': deviation between ±1.2% and ±2.2% (close to borderline threshold)
        - 'high_deviation': deviation between -3.5% and -6.0% (significant review discrepancy)
        - 'under_dispense': measured volume is lower than dispenser reported (e.g. -4.2%)
        - 'over_dispense': measured volume is higher than dispenser reported (e.g. +3.8%)
        """
        if dispenser_volume <= 0:
            raise ValueError("Dispenser volume must be positive")

        if profile == "accurate":
            dev_pct = random.uniform(-0.8, 0.7)
        elif profile == "moderate_variance":
            dev_pct = random.choice([-1, 1]) * random.uniform(1.8, 2.3)
        elif profile == "high_deviation":
            dev_pct = random.choice([-1, 1]) * random.uniform(3.5, 5.5)
        elif profile == "under_dispense":
            dev_pct = -random.uniform(3.2, 5.8)
        elif profile == "over_dispense":
            dev_pct = random.uniform(2.8, 4.9)
        else:
            dev_pct = random.uniform(-0.5, 0.5)

        # Measured volume after applying the deviation factor
        # dispenser - measured = difference
        # dev_pct = (difference / dispenser) * 100 => difference = dispenser * (dev_pct / 100)
        # measured = dispenser - difference
        diff = dispenser_volume * (dev_pct / 100.0)
        measured_volume = max(0.01, round(dispenser_volume - diff, 2))

        # Calculate realistic pulse counts: Pulses = Volume * 450 + jitter
        raw_pulses = int(measured_volume * self.pulses_per_litre_nominal + random.randint(-15, 15))
        
        # Calculate simulated duration based on flow rate (default 35 L/min)
        duration_seconds = round((dispenser_volume / custom_flow_lpm) * 60.0, 1)
        simulated_temp = round(random.uniform(22.0, 26.5), 1)

        return SensorMeasurementResult(
            dispenser_volume=dispenser_volume,
            measured_volume=measured_volume,
            raw_pulses=raw_pulses,
            duration_seconds=duration_seconds,
            temperature_c=simulated_temp,
            instantaneous_flow_lpm=custom_flow_lpm,
            sensor_model="YF-S201 Hall Turbine (Simulated)",
            is_simulated=True,
            metadata={
                "simulation_profile": profile,
                "applied_deviation_pct": round(dev_pct, 2),
                "pulse_frequency_avg_hz": round(custom_flow_lpm * 7.5, 1)
            }
        )

    async def get_device_telemetry(self) -> DeviceTelemetryData:
        return DeviceTelemetryData(
            device_id=self.device_id,
            connection_status="Connected (Simulated Stream)",
            flow_sensor_status="Operational (YF-S201 Emulated)",
            temperature_sensor_status="Operational (DS18B20 24.2°C)",
            gps_status="3D Fix (8 Satellites - Accuracy ±1.5m)",
            battery_level=random.randint(90, 97),
            signal_strength=random.randint(-68, -58),
            firmware_version="v1.4.2-proto",
            ambient_temp_c=round(random.uniform(23.5, 25.8), 1),
            last_ping=datetime.datetime.utcnow()
        )
