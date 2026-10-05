import time
import random
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class LiveTelemetryFrame(BaseModel):
    state: str  # "IDLE" | "MEASURING" | "STOPPED"
    connection_status: str  # "CONNECTED (SIMULATED)" | "DISCONNECTED"
    flow_rate_lpm: float
    accumulated_volume_litres: float
    raw_pulses: int
    temperature_celsius: float
    pressure_bar: float
    battery_level: int
    gps_status: str
    signal_strength: int
    elapsed_seconds: float
    timestamp: str
    is_simulated: bool = True

class MeasurementSessionSummary(BaseModel):
    session_id: str
    measured_quantity: float
    duration_seconds: float
    raw_pulses: int
    avg_flow_rate_lpm: float
    avg_temperature_c: float
    avg_pressure_bar: float
    estimated_uncertainty: float
    status: str
    timestamp: str

class MeasurementService:
    """
    Manages live measurement sessions and interfaces with the simulated hardware flow sensor.
    Decoupled from verification logic to allow direct drop-in replacement for physical ESP32 streams.
    """
    _state: str = "IDLE"  # "IDLE", "MEASURING", "STOPPED"
    _start_timestamp: Optional[float] = None
    _stop_timestamp: Optional[float] = None
    _accumulated_volume: float = 0.0
    _raw_pulses: int = 0
    _target_flow_lpm: float = 35.0
    _last_tick_time: Optional[float] = None
    _telemetry_history: List[Dict[str, Any]] = []
    _max_history_len: int = 60

    @classmethod
    def start(cls, target_flow_lpm: float = 35.0) -> Dict[str, Any]:
        now = time.time()
        cls._state = "MEASURING"
        cls._target_flow_lpm = max(5.0, min(target_flow_lpm, 75.0))
        cls._start_timestamp = now
        cls._stop_timestamp = None
        cls._accumulated_volume = 0.0
        cls._raw_pulses = 0
        cls._last_tick_time = now
        cls._telemetry_history.clear()

        return {
            "status": "started",
            "state": cls._state,
            "target_flow_lpm": cls._target_flow_lpm,
            "start_time": datetime.datetime.utcnow().isoformat()
        }

    @classmethod
    def stop(cls) -> MeasurementSessionSummary:
        cls._update_accumulation()
        now = time.time()
        cls._state = "STOPPED"
        cls._stop_timestamp = now

        duration = round((cls._stop_timestamp - (cls._start_timestamp or now)), 1)
        measured_vol = round(cls._accumulated_volume, 2)
        uncertainty = round((0.008 * measured_vol) + 0.02, 2)

        return MeasurementSessionSummary(
            session_id=f"SESS-{int(now)}",
            measured_quantity=measured_vol,
            duration_seconds=max(0.1, duration),
            raw_pulses=cls._raw_pulses,
            avg_flow_rate_lpm=round(cls._target_flow_lpm, 1),
            avg_temperature_c=24.5,
            avg_pressure_bar=2.1,
            estimated_uncertainty=uncertainty,
            status="completed",
            timestamp=datetime.datetime.utcnow().isoformat()
        )

    @classmethod
    def reset(cls) -> Dict[str, Any]:
        cls._state = "IDLE"
        cls._start_timestamp = None
        cls._stop_timestamp = None
        cls._accumulated_volume = 0.0
        cls._raw_pulses = 0
        cls._last_tick_time = None
        cls._telemetry_history.clear()
        return {"status": "reset", "state": "IDLE"}

    @classmethod
    def _update_accumulation(cls):
        if cls._state != "MEASURING" or cls._last_tick_time is None:
            return

        now = time.time()
        dt = now - cls._last_tick_time
        cls._last_tick_time = now

        if dt > 0:
            # Flow with minor realistic fluid turbulence noise (±1.5%)
            instant_flow = cls._target_flow_lpm * (1.0 + random.uniform(-0.025, 0.025))
            # Litres added in dt seconds = (Flow LPM / 60) * dt
            added_volume = (instant_flow / 60.0) * dt
            cls._accumulated_volume += added_volume
            # YF-S201 nominal 450 pulses/L
            cls._raw_pulses = int(cls._accumulated_volume * 450.0 + random.randint(-2, 2))

    @classmethod
    def get_live_telemetry(cls) -> LiveTelemetryFrame:
        cls._update_accumulation()
        now = time.time()

        elapsed = 0.0
        if cls._start_timestamp:
            end_t = cls._stop_timestamp if cls._state == "STOPPED" else now
            elapsed = round(end_t - cls._start_timestamp, 1)

        if cls._state == "MEASURING":
            current_flow = round(cls._target_flow_lpm + random.uniform(-0.8, 0.8), 2)
            pressure = round(2.10 + random.uniform(-0.06, 0.06), 2)
            temp = round(24.5 + random.uniform(-0.3, 0.4), 1)
        elif cls._state == "STOPPED":
            current_flow = 0.0
            pressure = round(1.0 + random.uniform(-0.02, 0.02), 2)
            temp = 24.5
        else:
            current_flow = 0.0
            pressure = 1.01
            temp = 24.2

        frame = LiveTelemetryFrame(
            state=cls._state,
            connection_status="CONNECTED (SIMULATED)",
            flow_rate_lpm=max(0.0, current_flow),
            accumulated_volume_litres=round(cls._accumulated_volume, 2),
            raw_pulses=max(0, cls._raw_pulses),
            temperature_celsius=temp,
            pressure_bar=pressure,
            battery_level=random.randint(93, 95),
            gps_status="3D Fix (8 Satellites - Accuracy ±1.5m)",
            signal_strength=-62,
            elapsed_seconds=elapsed,
            timestamp=datetime.datetime.utcnow().strftime("%H:%M:%S"),
            is_simulated=True
        )

        # Record into history buffer for charts
        sample = {
            "time": frame.timestamp,
            "flow_rate": frame.flow_rate_lpm,
            "volume": frame.accumulated_volume_litres,
            "pressure": frame.pressure_bar,
            "temperature": frame.temperature_celsius
        }
        cls._telemetry_history.append(sample)
        if len(cls._telemetry_history) > cls._max_history_len:
            cls._telemetry_history.pop(0)

        return frame

    @classmethod
    def get_telemetry_history(cls) -> List[Dict[str, Any]]:
        return list(cls._telemetry_history)
