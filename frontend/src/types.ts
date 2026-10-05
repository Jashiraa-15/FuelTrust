export type VerificationStatus = 'VERIFIED' | 'REVIEW';

export type NavTab = 
  | 'dashboard'
  | 'live-measurement'
  | 'verify'
  | 'history'
  | 'calibration'
  | 'analytics'
  | 'vehicles'
  | 'device'
  | 'settings';

export interface Vehicle {
  id: number;
  name: string;
  plate_number: string;
  fuel_type: string;
  tank_capacity: number;
  odometer_km: number;
  department: string;
  is_default?: boolean;
  created_at: string;
  refuelling_count?: number;
  total_fuel_litres?: number;
}

export interface Refuelling {
  id: number;
  vehicle_id: number;
  vehicle_name?: string;
  vehicle_plate?: string;
  fuel_type: string;
  dispenser_quantity: number;
  measured_quantity: number;
  difference: number;
  signed_difference?: number;
  absolute_difference: number;
  deviation_percentage: number;
  measurement_uncertainty: number;
  confidence_level: number;
  verification_margin?: number;
  verification_status: VerificationStatus;
  threshold_applied: number;
  timestamp: string;
  location: string;
  dispenser_id?: string;
  operator_name?: string;
  notes?: string;
  created_at: string;
  scientific_remark?: string;
  human_explanation?: string;
}

export interface VerificationPreview {
  dispenser_quantity: number;
  measured_quantity: number;
  signed_difference: number;
  difference: number;
  absolute_difference: number;
  deviation_percentage: number;
  threshold: number;
  measurement_uncertainty: number;
  confidence_level: number;
  verification_margin: number;
  verification_status: VerificationStatus;
  scientific_remark: string;
  human_explanation: string;
  is_within_tolerance: boolean;
  fuel_temperature_c: number;
  line_pressure_bar: number;
}

export interface SimulatedFlowResult {
  dispenser_quantity: number;
  measured_quantity: number;
  difference: number;
  signed_difference: number;
  deviation_percentage: number;
  pulses_counted: number;
  duration_seconds: number;
  temperature_c: number;
  pressure_bar: number;
  measurement_uncertainty: number;
  simulation_profile: string;
}

export interface Calibration {
  id: number;
  calibration_date: string;
  sensor_id: string;
  reference_quantity: number;
  measured_quantity: number;
  error: number;
  percentage_error: number;
  correction_factor: number;
  operator_name: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface LiveTelemetry {
  state: 'IDLE' | 'MEASURING' | 'STOPPED';
  connection_status: string;
  flow_rate_lpm: number;
  accumulated_volume_litres: number;
  raw_pulses: number;
  temperature_celsius: number;
  pressure_bar: number;
  battery_level: number;
  gps_status: string;
  signal_strength: number;
  elapsed_seconds: number;
  timestamp: string;
  is_simulated: boolean;
}

export interface StopMeasurementSummary {
  session_id: string;
  measured_quantity: number;
  duration_seconds: number;
  raw_pulses: number;
  avg_flow_rate_lpm: number;
  avg_temperature_c: number;
  avg_pressure_bar: number;
  estimated_uncertainty: number;
  status: string;
  timestamp: string;
}

export interface DeviceStatus {
  id: number;
  device_id: string;
  device_name: string;
  connection_status: string;
  flow_sensor_status: string;
  temperature_sensor_status: string;
  pressure_sensor_status: string;
  gps_status: string;
  battery_level: number;
  signal_strength: number;
  firmware_version: string;
  calibration_factor: number;
  pulses_per_litre: number;
  last_ping: string;
  is_simulated: boolean;
  active_stream_rate_lpm: number;
}

export interface AppSettings {
  verification_threshold: number;
  default_fuel_type: string;
  units: string;
  demo_mode: boolean;
  device_connection_mode: string;
  high_alert_threshold: number;
  allow_operator_overrides: boolean;
}

export interface DashboardData {
  total_fuel_recorded: number;
  total_events: number;
  verified_events: number;
  review_events: number;
  verification_rate_pct: number;
  average_deviation: number;
  latest_verification: Refuelling | null;
  recent_refuellings: Refuelling[];
  fuel_type_breakdown: Record<string, number>;
  monthly_trend: Array<{
    timestamp: string;
    dispenser_quantity: number;
    measured_quantity: number;
    deviation_percentage: number;
    status: string;
  }>;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export interface AnalyticsData {
  total_fuel_purchased: number;
  total_fuel_consumed: number;
  total_fuel_litres: number;
  total_events: number;
  avg_refuelling_qty: number;
  total_distance_km: number;
  average_mileage_kpl: number;
  verified_count: number;
  review_count: number;
  verification_rate_pct: number;
  avg_deviation_pct: number;
  max_deviation_pct: number;
  deviation_distribution: Array<{ range: string; count: number }>;
  status_distribution: Array<{ name: string; value: number; color: string }>;
  vehicle_discrepancy_ranking: Array<{
    vehicle_id: number;
    vehicle_name: string;
    plate_number: string;
    fuel_type?: string;
    total_events: number;
    review_events: number;
    avg_deviation: number;
    total_fuel_litres: number;
    review_rate_pct: number;
  }>;
  location_discrepancy_ranking: Array<{
    location: string;
    total_events: number;
    review_events: number;
    avg_deviation: number;
    total_fuel_litres: number;
    review_rate_pct: number;
  }>;
  timeline_series: Array<{
    id: number;
    date: string;
    dispenser: number;
    measured: number;
    deviation: number;
    uncertainty: number;
    threshold: number;
    status: string;
    location: string;
  }>;
  fuel_comparison_series: Array<{
    date: string;
    purchased: number;
    measured: number;
    estimated_consumed: number;
  }>;
  mileage_trend_series: Array<{
    date: string;
    mileage_kpl: number;
    distance_km: number;
    fuel_consumed: number;
  }>;
  key_insights: string[];
}
