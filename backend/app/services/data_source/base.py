from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
import datetime

class SensorMeasurementResult(BaseModel):
    dispenser_volume: float
    measured_volume: float
    raw_pulses: int
    duration_seconds: float
    temperature_c: float
    instantaneous_flow_lpm: float
    sensor_model: str
    is_simulated: bool
    metadata: Dict[str, Any] = {}

class DeviceTelemetryData(BaseModel):
    device_id: str
    connection_status: str
    flow_sensor_status: str
    temperature_sensor_status: str
    gps_status: str
    battery_level: int
    signal_strength: int
    firmware_version: str
    ambient_temp_c: float
    last_ping: datetime.datetime

class BaseFuelDataSource(ABC):
    """
    Abstract Data Source Interface for FuelTrust.
    Decouples the Verification Engine and higher-level application logic
    from specific hardware implementations (ESP32, YF-S201, Serial, or Simulated).
    """

    @abstractmethod
    def get_source_name(self) -> str:
        """Returns identifier of data source (e.g., 'SIMULATED_YF_S201', 'ESP32_WIFI_UART')"""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Returns True if the underlying sensor bus or simulation stream is active."""
        pass

    @abstractmethod
    async def measure_dispense_event(
        self,
        dispenser_volume: float,
        profile: str = "accurate",
        custom_flow_lpm: float = 35.0
    ) -> SensorMeasurementResult:
        """
        Executes a fuel dispense measurement stream and aggregates pulses into net measured litres.
        """
        pass

    @abstractmethod
    async def get_device_telemetry(self) -> DeviceTelemetryData:
        """
        Polls health, battery, sensor buses, and GPS telemetry.
        """
        pass
