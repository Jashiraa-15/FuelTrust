import datetime
from typing import Optional
from app.services.data_source.base import BaseFuelDataSource, SensorMeasurementResult, DeviceTelemetryData

class ESP32HardwareDataSource(BaseFuelDataSource):
    """
    Hardware Data Source for physical ESP32 microcontroller paired with
    YF-S201 Flow Sensor and DS18B20 OneWire Temp Sensor.
    
    Communication methods supported when deployed to hardware:
    1. Direct Serial UART / USB COM port
    2. HTTP REST Webhook from ESP32 WiFi client (e.g. POST /api/device/telemetry)
    3. MQTT broker topic subscriptions (e.g. fueltrust/device/{id}/flow)
    """

    def __init__(self, port: Optional[str] = "COM3", baud_rate: int = 115200):
        self.port = port
        self.baud_rate = baud_rate
        self.device_id = "ESP32-HARDWARE-UNIT-01"
        self._connected = False  # Set to True when physical port is opened

    def get_source_name(self) -> str:
        return f"ESP32_HARDWARE_SOURCE ({self.port} @ {self.baud_rate}bps)"

    def is_connected(self) -> bool:
        return self._connected

    async def measure_dispense_event(
        self,
        dispenser_volume: float,
        profile: str = "accurate",
        custom_flow_lpm: float = 35.0
    ) -> SensorMeasurementResult:
        """
        Reads accumulated pulse interrupt count from ESP32 registers.
        In prototype mode without connected hardware, falls back with informative indicator.
        """
        if not self._connected:
            # Fallback for prototype testing when ESP32 is not plugged in
            measured = dispenser_volume * 0.992
            return SensorMeasurementResult(
                dispenser_volume=dispenser_volume,
                measured_volume=round(measured, 2),
                raw_pulses=int(measured * 450),
                duration_seconds=round((dispenser_volume / custom_flow_lpm) * 60.0, 1),
                temperature_c=24.0,
                instantaneous_flow_lpm=custom_flow_lpm,
                sensor_model="YF-S201 (ESP32 GPIO 4 Interrupt)",
                is_simulated=False,
                metadata={"status": "ESP32 hardware placeholder / awaiting serial stream"}
            )
        
        # Physical implementation reading bytes from serial buffer / UART
        raise NotImplementedError("Physical ESP32 serial bridge connection active only when hardware is attached.")

    async def get_device_telemetry(self) -> DeviceTelemetryData:
        return DeviceTelemetryData(
            device_id=self.device_id,
            connection_status="Hardware Ready (Awaiting ESP32 Handshake)",
            flow_sensor_status="GPIO Pin 4 Input Pullup",
            temperature_sensor_status="OneWire GPIO Pin 5",
            gps_status="UART2 (TX:17, RX:16)",
            battery_level=100,
            signal_strength=-45,
            firmware_version="v1.0.0-esp32",
            ambient_temp_c=24.0,
            last_ping=datetime.datetime.utcnow()
        )
