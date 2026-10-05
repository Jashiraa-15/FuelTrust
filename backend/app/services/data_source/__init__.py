from app.services.data_source.base import BaseFuelDataSource, SensorMeasurementResult, DeviceTelemetryData
from app.services.data_source.simulated import SimulatedSensorDataSource
from app.services.data_source.esp32_stub import ESP32HardwareDataSource

_simulated_instance = SimulatedSensorDataSource()
_esp32_instance = ESP32HardwareDataSource()

def get_fuel_data_source(mode: str = "simulated") -> BaseFuelDataSource:
    """
    Factory method to retrieve the active data source abstraction.
    Allows dynamic switching between simulated sensor runs and physical ESP32 hardware.
    """
    if mode.lower() == "esp32":
        return _esp32_instance
    return _simulated_instance
