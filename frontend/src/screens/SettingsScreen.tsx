import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Fuel,
  Cpu
} from 'lucide-react';
import type { AppSettings } from '../types';
import { api } from '../services/api';

interface SettingsScreenProps {
  settings: AppSettings | null;
  onSettingsUpdated: () => void;
  onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSettingsUpdated,
  onLogout
}) => {
  const [threshold, setThreshold] = useState<string>('2.0');
  const [highAlertThreshold, setHighAlertThreshold] = useState<string>('4.0');
  const [fuelType, setFuelType] = useState<string>('Diesel');
  const [units, setUnits] = useState<string>('Litres');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [connectionMode, setConnectionMode] = useState<string>('SIMULATED_ESP32');
  const [allowOverrides, setAllowOverrides] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setThreshold(settings.verification_threshold.toString());
      setHighAlertThreshold(settings.high_alert_threshold.toString());
      setFuelType(settings.default_fuel_type);
      setUnits(settings.units);
      setDemoMode(settings.demo_mode);
      setConnectionMode(settings.device_connection_mode);
      setAllowOverrides(settings.allow_operator_overrides);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const th = parseFloat(threshold);
    const hTh = parseFloat(highAlertThreshold);

    if (isNaN(th) || th <= 0 || th > 20) {
      setFeedback({ type: 'error', message: 'Verification threshold must be between 0.1% and 20.0%.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      await api.updateSettings({
        verification_threshold: th,
        high_alert_threshold: isNaN(hTh) ? 4.0 : hTh,
        default_fuel_type: fuelType,
        units: units,
        demo_mode: demoMode,
        device_connection_mode: connectionMode,
        allow_operator_overrides: allowOverrides
      });

      setFeedback({ type: 'success', message: 'System settings saved and applied to verification engine.' });
      onSettingsUpdated();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Failed to update settings: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setThreshold('2.0');
    setHighAlertThreshold('4.0');
    setFuelType('Diesel');
    setUnits('Litres');
    setDemoMode(true);
    setConnectionMode('SIMULATED_ESP32');
    setAllowOverrides(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-600" />
            Verification Engine & System Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Configure volumetric tolerance bands, physical units, sensor operating mode, and default audit parameters.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Verification Thresholds */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Volumetric Tolerance Thresholds
              </h3>
              <p className="text-xs text-slate-500">
                Controls the decision boundary between VERIFIED and REVIEW status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Standard Verification Threshold (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20.0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                  % (Default 2.0%)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Discrepancies ≤ {threshold}% yield VERIFIED status.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                High Discrepancy Alert Threshold (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="30.0"
                  value={highAlertThreshold}
                  onChange={(e) => setHighAlertThreshold(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                  % (Default 4.0%)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Flags severe volumetric divergence in analytics summary.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Fuel & Measurement Units */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Fuel size={18} className="text-blue-600" />
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Fuel Specifications & Units
              </h3>
              <p className="text-xs text-slate-500">
                Default parameters populated during verification forms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Fuel Grade
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
              >
                <option value="Diesel">Diesel (Auto Grade)</option>
                <option value="Petrol 95">Petrol 95 (Premium)</option>
                <option value="Petrol 91">Petrol 91 (Regular)</option>
                <option value="CNG">CNG Compressed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Volumetric Unit of Measure
              </label>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
              >
                <option value="Litres">Litres (L) — Standard Metric</option>
                <option value="US Gallons">US Gallons (gal)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Hardware Ingest & Receiver Mode */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu size={18} className="text-blue-600" />
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Hardware Receiver & Ingest Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure primary flow sensor receiver interface and telemetry pipeline
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-sm text-slate-900 block">Telemetry Emulation Driver</span>
                <span className="text-xs text-slate-500">
                  Enables background sensor emulation for verification workflows
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Active Receiver Bridge Mode
              </label>
              <select
                value={connectionMode}
                onChange={(e) => setConnectionMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
              >
                <option value="SIMULATED_ESP32">SIMULATED_ESP32 — (Virtual YF-S201 Turbine Stream)</option>
                <option value="PHYSICAL_ESP32_UART">PHYSICAL_ESP32_UART — (COM Serial Port / 115200 bps)</option>
                <option value="ESP32_REST_WEBHOOK">ESP32_REST_WEBHOOK — (WiFi JSON Telemetry Ingest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: User Session & Authentication */}
        {onLogout && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                User Session & Access
              </h3>
              <p className="text-xs text-slate-500">
                Active session authenticated to FuelTrust Verification Suite.
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
