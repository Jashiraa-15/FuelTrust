import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

# --- VEHICLE SCHEMAS ---
class VehicleBase(BaseModel):
    name: str = Field(..., example="Heavy Delivery Van #14")
    plate_number: str = Field(..., example="ABC-4821")
    fuel_type: str = Field(default="Diesel", example="Diesel")
    tank_capacity: float = Field(default=70.0, ge=1.0, example=75.0)
    odometer_km: float = Field(default=0.0, ge=0.0, example=34200.0)
    department: Optional[str] = Field(default="Logistics", example="Logistics")
    is_default: Optional[bool] = Field(default=False, example=False)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    plate_number: Optional[str] = None
    fuel_type: Optional[str] = None
    tank_capacity: Optional[float] = None
    odometer_km: Optional[float] = None
    department: Optional[str] = None
    is_default: Optional[bool] = None

class VehicleOut(VehicleBase):
    id: int
    created_at: datetime.datetime
    refuelling_count: Optional[int] = 0
    total_fuel_litres: Optional[float] = 0.0

    class Config:
        from_attributes = True

# --- VERIFICATION SCHEMAS ---
class VerifyCalculationRequest(BaseModel):
    dispenser_quantity: float = Field(..., gt=0, description="Dispenser-reported quantity in litres")
    measured_quantity: float = Field(..., ge=0, description="FuelTrust independently measured quantity in litres")
    threshold_override: Optional[float] = Field(None, ge=0.1, le=20.0, description="Custom tolerance threshold percentage")
    uncertainty_override: Optional[float] = Field(None, ge=0.001, le=5.0, description="Estimated measurement uncertainty (±L)")

class VerifyCalculationResponse(BaseModel):
    dispenser_quantity: float
    measured_quantity: float
    signed_difference: float  # dispenser - measured
    difference: float         # alias
    absolute_difference: float
    deviation_percentage: float
    threshold: float
    measurement_uncertainty: float = 0.05
    confidence_level: float = 95.0
    verification_margin: float = 1.95
    verification_status: str  # "VERIFIED" | "REVIEW"
    scientific_remark: str
    human_explanation: str
    is_within_tolerance: bool
    fuel_temperature_c: float = 24.5
    line_pressure_bar: float = 2.1

class RefuellingCreate(BaseModel):
    vehicle_id: int
    fuel_type: str = "Diesel"
    dispenser_quantity: float = Field(..., gt=0, description="Dispenser volume in litres")
    measured_quantity: float = Field(..., ge=0, description="Independently measured volume in litres")
    timestamp: Optional[datetime.datetime] = None
    location: Optional[str] = "Central Depot Pump #3"
    dispenser_id: Optional[str] = "Pump-01"
    operator_name: Optional[str] = "Field Operator"
    notes: Optional[str] = None
    measurement_uncertainty: Optional[float] = None

    @field_validator("dispenser_quantity")
    @classmethod
    def validate_dispenser_qty(cls, v):
        if v <= 0:
            raise ValueError("Dispenser quantity must be greater than 0")
        return round(v, 3)

    @field_validator("measured_quantity")
    @classmethod
    def validate_measured_qty(cls, v):
        if v < 0:
            raise ValueError("Measured quantity cannot be negative")
        return round(v, 3)

class RefuellingOut(BaseModel):
    id: int
    vehicle_id: int
    vehicle_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    fuel_type: str
    dispenser_quantity: float
    measured_quantity: float
    difference: float
    signed_difference: Optional[float] = None
    absolute_difference: float
    deviation_percentage: float
    measurement_uncertainty: float = 0.05
    confidence_level: float = 95.0
    verification_margin: Optional[float] = None
    verification_status: str
    threshold_applied: float
    timestamp: datetime.datetime
    location: str
    dispenser_id: Optional[str] = None
    operator_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    scientific_remark: Optional[str] = None
    human_explanation: Optional[str] = None

    class Config:
        from_attributes = True

# --- CALIBRATION SCHEMAS ---
class CalibrationCreate(BaseModel):
    reference_quantity: float = Field(..., gt=0, description="Volumetric standard reference in litres")
    measured_quantity: float = Field(..., gt=0, description="Uncalibrated flow sensor reading in litres")
    sensor_id: Optional[str] = "YF-S201-SIM-01"
    operator_name: Optional[str] = "Calibration Metrologist"
    notes: Optional[str] = None

class CalibrationOut(BaseModel):
    id: int
    calibration_date: datetime.datetime
    sensor_id: str
    reference_quantity: float
    measured_quantity: float
    error: float
    percentage_error: float
    correction_factor: float
    operator_name: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- LIVE MEASUREMENT & DEVICE SCHEMAS ---
class LiveTelemetryOut(BaseModel):
    state: str  # "IDLE" | "MEASURING" | "STOPPED"
    connection_status: str
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

class StartMeasurementRequest(BaseModel):
    target_flow_lpm: Optional[float] = Field(default=35.0, ge=5.0, le=75.0)

class StopMeasurementResponse(BaseModel):
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

class DeviceStatusOut(BaseModel):
    id: int
    device_id: str
    device_name: str
    connection_status: str
    flow_sensor_status: str
    temperature_sensor_status: str
    pressure_sensor_status: str = "OPERATIONAL (2.1 bar)"
    gps_status: str
    battery_level: int
    signal_strength: int
    firmware_version: str
    calibration_factor: float
    pulses_per_litre: float = 450.0
    last_ping: datetime.datetime
    is_simulated: bool = True
    active_stream_rate_lpm: Optional[float] = 0.0

    class Config:
        from_attributes = True

class DeviceSimulateFlowRequest(BaseModel):
    target_volume: float = Field(..., gt=0, le=1000.0, description="Target volume to simulate dispensing (litres)")
    error_mode: str = Field(default="accurate", description="'accurate', 'moderate_variance', 'high_deviation', 'boundary', 'under_dispense', 'over_dispense'")
    flow_rate_lpm: float = Field(default=35.0, gt=5.0, le=80.0, description="Flow rate in LPM")

class DeviceSimulateFlowResponse(BaseModel):
    dispenser_quantity: float
    measured_quantity: float
    difference: float
    signed_difference: float
    deviation_percentage: float
    pulses_counted: int
    duration_seconds: float
    temperature_c: float
    pressure_bar: float = 2.1
    measurement_uncertainty: float = 0.05
    simulation_profile: str

# --- SETTINGS SCHEMAS ---
class AppSettingsOut(BaseModel):
    verification_threshold: float = 2.0
    default_fuel_type: str = "Diesel"
    units: str = "Litres"
    demo_mode: bool = True
    device_connection_mode: str = "SIMULATED_ESP32"
    high_alert_threshold: float = 4.0
    allow_operator_overrides: bool = False

class AppSettingsUpdate(BaseModel):
    verification_threshold: Optional[float] = Field(None, ge=0.1, le=20.0)
    default_fuel_type: Optional[str] = None
    units: Optional[str] = None
    demo_mode: Optional[bool] = None
    device_connection_mode: Optional[str] = None
    high_alert_threshold: Optional[float] = None
    allow_operator_overrides: Optional[bool] = None

# --- DASHBOARD & ANALYTICS SCHEMAS ---
class DashboardStatsOut(BaseModel):
    total_fuel_recorded: float
    total_events: int
    verified_events: int
    review_events: int
    verification_rate_pct: float
    average_deviation: float
    latest_verification: Optional[Dict[str, Any]] = None
    recent_refuellings: List[RefuellingOut] = []
    fuel_type_breakdown: Dict[str, float] = {}
    monthly_trend: List[Dict[str, Any]] = []

class AnalyticsSummaryOut(BaseModel):
    total_fuel_purchased: float
    total_fuel_consumed: float
    total_fuel_litres: float
    total_events: int = 0
    avg_refuelling_qty: float
    total_distance_km: float
    average_mileage_kpl: float
    verified_count: int
    review_count: int
    verification_rate_pct: float = 0.0
    avg_deviation_pct: float
    max_deviation_pct: float
    deviation_distribution: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
    vehicle_discrepancy_ranking: List[Dict[str, Any]]
    location_discrepancy_ranking: List[Dict[str, Any]]
    timeline_series: List[Dict[str, Any]]
    fuel_comparison_series: List[Dict[str, Any]]
    mileage_trend_series: List[Dict[str, Any]] = []
    key_insights: List[str] = []
