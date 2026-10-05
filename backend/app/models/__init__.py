import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), default="Operator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    plate_number = Column(String(30), unique=True, nullable=False, index=True)
    fuel_type = Column(String(30), default="Diesel")
    tank_capacity = Column(Float, default=70.0)
    odometer_km = Column(Float, default=0.0)
    department = Column(String(50), default="Logistics")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    refuellings = relationship("Refuelling", back_populates="vehicle", cascade="all, delete-orphan")

class Refuelling(Base):
    __tablename__ = "refuellings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    fuel_type = Column(String(30), nullable=False)
    dispenser_quantity = Column(Float, nullable=False)
    measured_quantity = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)  # dispenser - measured (signed)
    absolute_difference = Column(Float, nullable=False)
    deviation_percentage = Column(Float, nullable=False)
    verification_status = Column(String(20), nullable=False)  # "VERIFIED" or "REVIEW"
    threshold_applied = Column(Float, default=2.0)
    measurement_uncertainty = Column(Float, default=0.05)  # Simulated uncertainty in litres (±L)
    confidence_level = Column(Float, default=95.0)  # e.g. 95%
    verification_margin = Column(Float, default=1.95)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    location = Column(String(120), default="Main Depot Station")
    dispenser_id = Column(String(50), default="Pump-01")
    operator_name = Column(String(80), default="Standard Operator")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="refuellings")
    verification_result = relationship("VerificationResult", back_populates="refuelling", uselist=False, cascade="all, delete-orphan")

class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(Integer, primary_key=True, index=True)
    refuelling_id = Column(Integer, ForeignKey("refuellings.id"), nullable=False, unique=True)
    dispenser_quantity = Column(Float, nullable=False)
    measured_quantity = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    absolute_difference = Column(Float, nullable=False)
    deviation_percentage = Column(Float, nullable=False)
    threshold_used = Column(Float, nullable=False)
    measurement_uncertainty = Column(Float, default=0.05)
    confidence_level = Column(Float, default=95.0)
    verification_margin = Column(Float, default=1.95)
    status = Column(String(20), nullable=False)  # "VERIFIED" | "REVIEW"
    scientific_remark = Column(Text, nullable=False)
    flow_sensor_pulses = Column(Integer, default=0)
    fuel_temperature_c = Column(Float, default=24.5)
    line_pressure_bar = Column(Float, default=2.1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    refuelling = relationship("Refuelling", back_populates="verification_result")

class Calibration(Base):
    __tablename__ = "calibrations"

    id = Column(Integer, primary_key=True, index=True)
    calibration_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    sensor_id = Column(String(50), default="YF-S201-SIM-01")
    reference_quantity = Column(Float, nullable=False)  # Standard volumetric reference (L)
    measured_quantity = Column(Float, nullable=False)   # Uncalibrated sensor reading (L)
    error = Column(Float, nullable=False)               # measured - reference
    percentage_error = Column(Float, nullable=False)    # ((measured - ref) / ref) * 100
    correction_factor = Column(Float, nullable=False)   # ref / measured
    operator_name = Column(String(80), default="Calibration Metrologist")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DeviceStatus(Base):
    __tablename__ = "device_status"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, nullable=False)
    device_name = Column(String(100), default="FuelTrust Field Unit ESP32-S3")
    connection_status = Column(String(30), default="CONNECTED (SIMULATED)")
    flow_sensor_status = Column(String(30), default="OPERATIONAL (YF-S201 Emulated)")
    temperature_sensor_status = Column(String(30), default="OPERATIONAL (DS18B20 24.5°C)")
    pressure_sensor_status = Column(String(30), default="OPERATIONAL (2.1 bar)")
    gps_status = Column(String(30), default="3D Fix (8 Satellites)")
    battery_level = Column(Integer, default=94)
    signal_strength = Column(Integer, default=-62)  # dBm
    firmware_version = Column(String(20), default="v1.4.2-proto")
    calibration_factor = Column(Float, default=1.0)  # Multiplier
    pulses_per_litre = Column(Float, default=450.0)  # Nominal pulses/L
    last_ping = Column(DateTime, default=datetime.datetime.utcnow)

class AppSetting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(String(255), nullable=False)
    value_type = Column(String(20), default="string")  # float, int, string, bool
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
