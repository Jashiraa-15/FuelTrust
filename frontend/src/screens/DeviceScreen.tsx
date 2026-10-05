import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Wifi,
  Radio,
  Battery,
  Thermometer,
  Gauge,
  MapPin,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Zap,
  Terminal,
  Layers
} from 'lucide-react';
import type { DeviceStatus } from '../types';
import { api } from '../services/api';

interface DeviceScreenProps {
  deviceStatus: DeviceStatus | null;
  onRefreshStatus: () => void;
}

export const DeviceScreen: React.FC<DeviceScreenProps> = ({ deviceStatus, onRefreshStatus }) => {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  // Live Pulse Simulator Counter
  const [simFlowRate, setSimFlowRate] = useState<number>(35);
  const [livePulses, setLivePulses] = useState<number>(0);

  useEffect(() => {
    // Pulse calculation based on YF-S201 formula: F = 7.5 * Q (Hz)
    const freqHz = simFlowRate * 7.5;
    const intervalMs = 100;
    const pulsesPerTick = (freqHz * intervalMs) / 1000;

    const interval = setInterval(() => {
      setLivePulses((prev) => Math.round(prev + pulsesPerTick));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [simFlowRate]);

  const handlePing = async () => {
    try {
      setIsPinging(true);
      setPingMessage(null);
      await api.pingDevice();
      setPingMessage('Heartbeat acknowledged from simulated ESP32 node.');
      onRefreshStatus();
      setTimeout(() => setPingMessage(null), 3000);
    } catch (err: any) {
      setPingMessage(`Ping failed: ${err.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Hardware Telemetry Status Banner */}
      <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white font-bold">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-slate-900 text-base">
                Hardware Telemetry Node
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                STREAM ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Flow pulse interrupts and environmental telemetry processed through the Data Source Abstraction Layer.
            </p>
          </div>
        </div>

        <button
          onClick={handlePing}
          disabled={isPinging}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={isPinging ? 'animate-spin text-blue-400' : ''} />
          <span>{isPinging ? 'Pinging Node...' : 'Send Keep-Alive Ping'}</span>
        </button>
      </div>

      {pingMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{pingMessage}</span>
        </div>
      )}

      {/* 2. System Architecture Abstraction Diagram Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            <h3 className="font-heading font-bold text-base text-slate-900">
              FuelTrust Data Source Architecture
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Decoupled Interface</span>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Node 1: Sensor Ingest */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-800 space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Active Source
              </span>
              <Cpu size={16} className="text-blue-600" />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900">FLOW SENSOR INGEST</h4>
            <p className="text-xs text-slate-600">
              YF-S201 turbine pulse interrupt stream and fluid dynamics telemetry acquisition.
            </p>
            <div className="pt-2 text-[10px] font-mono text-blue-700">
              ➜ ESP32 hardware integration ready.
            </div>
          </div>

          {/* Node 2: Data Source Abstraction Interface */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Middleware
              </span>
              <Terminal size={16} className="text-indigo-600" />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900">DATA SOURCE INTERFACE</h4>
            <p className="text-xs text-slate-600">
              BaseFuelDataSource abstract contract standardizing volume pulses, calibration, and health pings.
            </p>
            <div className="pt-2 text-[10px] font-mono text-indigo-700">
              app.services.data_source.base
            </div>
          </div>

          {/* Node 3: Verification Engine */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Evaluator
              </span>
              <Activity size={16} className="text-emerald-600" />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900">VERIFICATION ENGINE</h4>
            <p className="text-xs text-slate-600">
              Computes delta, deviation percentage, tolerance thresholds, and scientifically neutral verdicts.
            </p>
            <div className="pt-2 text-[10px] font-mono text-emerald-700">
              VERIFIED / REVIEW Status Output
            </div>
          </div>
        </div>

        {/* Future Hardware Integration Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800">ESP32 hardware integration ready.</span>
            <span>REST API endpoints <code className="font-mono text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">/api/device/live</code> and <code className="font-mono text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">/api/device/history</code> support direct ESP32 Wi-Fi hardware packets without altering application logic.</span>
          </div>
        </div>
      </div>

      {/* 3. Hardware Diagnostics & Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Connection State */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Device Connection</span>
            <Wifi size={18} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-base font-bold text-slate-900">
              {deviceStatus?.connection_status || 'Connected (ESP32 Link)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Node ID: {deviceStatus?.device_id || 'FT-ESP32-DEV-001'}
          </p>
        </div>

        {/* Flow Sensor Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Flow Sensor Bus</span>
            <Gauge size={18} className="text-blue-600" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {deviceStatus?.flow_sensor_status || 'Operational (YF-S201)'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Calibration: {deviceStatus?.calibration_factor || 7.5} Hz/LPM (~450 pulses/L)
          </p>
        </div>

        {/* Temperature Sensor Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Thermal Probe</span>
            <Thermometer size={18} className="text-rose-600" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {deviceStatus?.temperature_sensor_status || 'Operational (DS18B20 24.5°C)'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            OneWire Digital Bus (GPIO 5)
          </p>
        </div>

        {/* GPS Sensor Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">GPS Position Lock</span>
            <MapPin size={18} className="text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {deviceStatus?.gps_status || '3D Fix (8 Satellites)'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            NEO-6M NMEA Stream (UART2)
          </p>
        </div>

        {/* Battery Telemetry */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Battery Power</span>
            <Battery size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900 font-mono">
            {deviceStatus?.battery_level || 94}%
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            LiPo 3.7V / 2500mAh
          </p>
        </div>

        {/* RF Signal Strength */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">RF Link Quality</span>
            <Radio size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900 font-mono">
            {deviceStatus?.signal_strength || -62} <span className="text-xs font-normal text-slate-500">dBm</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Firmware: {deviceStatus?.firmware_version || 'v1.4.2-proto'}
          </p>
        </div>
      </div>

      {/* 4. Live Pulse Generator Diagnostic Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-blue-600" />
            <h3 className="font-heading font-bold text-base text-slate-900">
              Interactive Flow Rate & Pulse Generator
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Live Pulse Stream Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Flow Rate Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Simulated Fuel Dispense Rate:
              </label>
              <span className="font-mono font-bold text-base text-blue-700">
                {simFlowRate} L/min
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="70"
              step="1"
              value={simFlowRate}
              onChange={(e) => setSimFlowRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>10 L/min (Slow vehicle nozzle)</span>
              <span>40 L/min (Standard pump)</span>
              <span>70 L/min (High-flow truck)</span>
            </div>
          </div>

          {/* Right: Live Pulse Counter Box */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl space-y-3 font-mono border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>YF-S201 INTERRUPT COUNTER</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="text-3xl font-extrabold text-emerald-400 tracking-wider">
              {livePulses.toLocaleString()} <span className="text-xs font-normal text-slate-400">pulses</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
              <span>Frequency: {(simFlowRate * 7.5).toFixed(1)} Hz</span>
              <span>Calculated Vol: {(livePulses / 450).toFixed(2)} L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
