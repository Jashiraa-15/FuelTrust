import type {
  Vehicle,
  Refuelling,
  VerificationPreview,
  SimulatedFlowResult,
  Calibration,
  LiveTelemetry,
  StopMeasurementSummary,
  DeviceStatus,
  AppSettings,
  DashboardData,
  AnalyticsData
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'Network response was not ok';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const res = await fetch(`${API_BASE}/dashboard`);
    return handleResponse<DashboardData>(res);
  },

  // Refuellings
  getRefuellings: async (params?: {
    vehicle_id?: number;
    status?: string;
    fuel_type?: string;
    time_filter?: string;
    search?: string;
  }): Promise<Refuelling[]> => {
    const query = new URLSearchParams();
    if (params?.vehicle_id) query.append('vehicle_id', params.vehicle_id.toString());
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.fuel_type && params.fuel_type !== 'ALL') query.append('fuel_type', params.fuel_type);
    if (params?.time_filter && params.time_filter !== 'ALL') query.append('time_filter', params.time_filter);
    if (params?.search) query.append('search', params.search);
    
    const res = await fetch(`${API_BASE}/refuellings?${query.toString()}`);
    return handleResponse<Refuelling[]>(res);
  },

  getRefuelling: async (id: number): Promise<Refuelling> => {
    const res = await fetch(`${API_BASE}/refuellings/${id}`);
    return handleResponse<Refuelling>(res);
  },

  createRefuelling: async (payload: {
    vehicle_id: number;
    fuel_type: string;
    dispenser_quantity: number;
    measured_quantity: number;
    timestamp?: string;
    location?: string;
    dispenser_id?: string;
    operator_name?: string;
    notes?: string;
    measurement_uncertainty?: number;
  }): Promise<Refuelling> => {
    const res = await fetch(`${API_BASE}/refuellings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Refuelling>(res);
  },

  deleteRefuelling: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/refuellings/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`Failed to delete refuelling record #${id}`);
    }
  },

  // Verification & Flow Simulation
  calculateVerification: async (payload: {
    dispenser_quantity: number;
    measured_quantity: number;
    threshold_override?: number;
    uncertainty_override?: number;
  }): Promise<VerificationPreview> => {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<VerificationPreview>(res);
  },

  simulateSensorFlow: async (payload: {
    target_volume: number;
    error_mode: string;
    flow_rate_lpm?: number;
  }): Promise<SimulatedFlowResult> => {
    const res = await fetch(`${API_BASE}/verify/simulate-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<SimulatedFlowResult>(res);
  },

  // Live Measurement Stream
  getLiveTelemetry: async (): Promise<LiveTelemetry> => {
    const res = await fetch(`${API_BASE}/device/live`);
    return handleResponse<LiveTelemetry>(res);
  },

  startLiveMeasurement: async (target_flow_lpm: number = 35.0): Promise<{ status: string; state: string }> => {
    const res = await fetch(`${API_BASE}/device/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_flow_lpm })
    });
    return handleResponse<{ status: string; state: string }>(res);
  },

  stopLiveMeasurement: async (): Promise<StopMeasurementSummary> => {
    const res = await fetch(`${API_BASE}/device/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<StopMeasurementSummary>(res);
  },

  resetLiveMeasurement: async (): Promise<{ status: string; state: string }> => {
    const res = await fetch(`${API_BASE}/device/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<{ status: string; state: string }>(res);
  },

  getLiveMeasurementHistory: async (): Promise<Array<{ time: string; flow_rate: number; volume: number; pressure: number; temperature: number }>> => {
    const res = await fetch(`${API_BASE}/device/history`);
    return handleResponse<Array<{ time: string; flow_rate: number; volume: number; pressure: number; temperature: number }>>(res);
  },

  // Calibration
  recordCalibration: async (payload: {
    reference_quantity: number;
    measured_quantity: number;
    sensor_id?: string;
    operator_name?: string;
    notes?: string;
  }): Promise<Calibration> => {
    const res = await fetch(`${API_BASE}/calibration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Calibration>(res);
  },

  getCalibrationHistory: async (sensor_id?: string): Promise<Calibration[]> => {
    const query = sensor_id ? `?sensor_id=${encodeURIComponent(sensor_id)}` : '';
    const res = await fetch(`${API_BASE}/calibration/history${query}`);
    return handleResponse<Calibration[]>(res);
  },

  getCalibrationActive: async (sensor_id?: string): Promise<Calibration | null> => {
    const query = sensor_id ? `?sensor_id=${encodeURIComponent(sensor_id)}` : '';
    const res = await fetch(`${API_BASE}/calibration/active${query}`);
    return handleResponse<Calibration | null>(res);
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await fetch(`${API_BASE}/vehicles`);
    return handleResponse<Vehicle[]>(res);
  },

  createVehicle: async (payload: {
    name: string;
    plate_number: string;
    fuel_type: string;
    tank_capacity: number;
    odometer_km: number;
    department?: string;
    is_default?: boolean;
  }): Promise<Vehicle> => {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Vehicle>(res);
  },

  updateVehicle: async (id: number, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Vehicle>(res);
  },

  setDefaultVehicle: async (id: number): Promise<Vehicle> => {
    const res = await fetch(`${API_BASE}/vehicles/${id}/set-default`, {
      method: 'POST'
    });
    return handleResponse<Vehicle>(res);
  },

  deleteVehicle: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(`Failed to delete vehicle #${id}`);
    }
  },

  // Device
  getDeviceStatus: async (): Promise<DeviceStatus> => {
    const res = await fetch(`${API_BASE}/device/status`);
    return handleResponse<DeviceStatus>(res);
  },

  pingDevice: async (): Promise<DeviceStatus> => {
    const res = await fetch(`${API_BASE}/device/ping`, { method: 'POST' });
    return handleResponse<DeviceStatus>(res);
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<AppSettings>(res);
  },

  updateSettings: async (payload: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<AppSettings>(res);
  },

  // Analytics
  getAnalytics: async (params?: { time_filter?: string; vehicle_id?: number; fuel_type?: string } | string): Promise<AnalyticsData> => {
    const query = new URLSearchParams();
    if (typeof params === 'string') {
      query.append('time_filter', params);
    } else if (params) {
      if (params.time_filter && params.time_filter !== 'ALL') query.append('time_filter', params.time_filter.toLowerCase());
      if (params.vehicle_id) query.append('vehicle_id', params.vehicle_id.toString());
      if (params.fuel_type && params.fuel_type !== 'ALL') query.append('fuel_type', params.fuel_type);
    }
    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/analytics?${queryString}` : `${API_BASE}/analytics`;
    const res = await fetch(url);
    return handleResponse<AnalyticsData>(res);
  }
};
