import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Fuel,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Gauge,
  Cpu,
  Bookmark
} from 'lucide-react';
import type { Vehicle, VerificationPreview, SimulatedFlowResult } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ToleranceMeter } from '../components/ToleranceMeter';

interface VerificationScreenProps {
  vehicles: Vehicle[];
  onVerificationSaved: () => void;
  defaultThreshold?: number;
  initialMeasuredVolume?: number | null;
  initialUncertainty?: number | null;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  vehicles,
  onVerificationSaved,
  defaultThreshold = 2.0,
  initialMeasuredVolume = null,
  initialUncertainty = null
}) => {
  // Find default vehicle if present
  const defaultVeh = vehicles.find((v) => v.is_default) || vehicles[0];

  // Form State
  const [vehicleId, setVehicleId] = useState<number>(defaultVeh?.id || 1);
  const [fuelType, setFuelType] = useState<string>('Diesel');
  const [dispenserQty, setDispenserQty] = useState<string>('50.00');
  const [measuredQty, setMeasuredQty] = useState<string>(
    initialMeasuredVolume ? initialMeasuredVolume.toFixed(2) : '49.40'
  );
  const [location, setLocation] = useState<string>('Main Depot Station');
  const [dispenserId, setDispenserId] = useState<string>('Pump-01');
  const [notes, setNotes] = useState<string>('');
  const [operatorName] = useState<string>('Field Operator');

  // Simulation Profile State
  const [simProfile, setSimProfile] = useState<string>('accurate');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResultMeta, setSimResultMeta] = useState<SimulatedFlowResult | null>(null);

  // Verification Results State
  const [preview, setPreview] = useState<VerificationPreview | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Predefined Demo Scenarios
  const demoScenarios = [
    {
      id: 'scen1',
      title: 'Scenario 1: Within Threshold',
      dispenser: '5.00',
      measured: '4.98',
      desc: 'Δ = +0.02 L (0.4% dev) → Expected VERIFIED'
    },
    {
      id: 'scen2',
      title: 'Scenario 2: Discrepancy',
      dispenser: '5.00',
      measured: '4.70',
      desc: 'Δ = +0.30 L (6.0% dev) → Expected REVIEW'
    },
    {
      id: 'scen3',
      title: 'Scenario 3: Over-dispense Alignment',
      dispenser: '10.00',
      measured: '10.03',
      desc: 'Δ = -0.03 L (0.3% dev) → Expected VERIFIED'
    },
    {
      id: 'scen4',
      title: 'Scenario 4: Boundary Discrepancy',
      dispenser: '20.00',
      measured: '19.58',
      desc: 'Δ = +0.42 L (2.1% dev) → Expected REVIEW'
    }
  ];

  // Sync selected vehicle's default fuel type
  useEffect(() => {
    const selected = vehicles.find((v) => v.id === vehicleId);
    if (selected && selected.fuel_type) {
      setFuelType(selected.fuel_type);
    }
  }, [vehicleId, vehicles]);

  // Set initial measured volume if passed from live measurement
  useEffect(() => {
    if (initialMeasuredVolume !== null && initialMeasuredVolume !== undefined) {
      setMeasuredQty(initialMeasuredVolume.toFixed(2));
    }
  }, [initialMeasuredVolume]);

  // Real-time calculation effect
  useEffect(() => {
    const dQty = parseFloat(dispenserQty);
    const mQty = parseFloat(measuredQty);

    if (isNaN(dQty) || dQty <= 0 || isNaN(mQty) || mQty < 0) {
      setPreview(null);
      return;
    }

    let isMounted = true;
    const calculate = async () => {
      try {
        setErrorMessage(null);
        const res = await api.calculateVerification({
          dispenser_quantity: dQty,
          measured_quantity: mQty,
          threshold_override: defaultThreshold,
          uncertainty_override: initialUncertainty || undefined
        });
        if (isMounted) {
          setPreview(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Calculation error');
        }
      }
    };

    const timer = setTimeout(calculate, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dispenserQty, measuredQty, defaultThreshold, initialUncertainty]);

  // Handler: Run Flow Simulation
  const handleRunSimulation = async (profileToUse?: string) => {
    const dQty = parseFloat(dispenserQty);
    if (isNaN(dQty) || dQty <= 0) {
      setErrorMessage('Please specify a valid dispenser quantity first.');
      return;
    }

    try {
      setIsSimulating(true);
      setErrorMessage(null);
      const chosenProfile = profileToUse || simProfile;
      const sim = await api.simulateSensorFlow({
        target_volume: dQty,
        error_mode: chosenProfile,
        flow_rate_lpm: 35.0
      });
      setMeasuredQty(sim.measured_quantity.toFixed(2));
      setSimResultMeta(sim);
    } catch (err: any) {
      setErrorMessage(`Sensor emulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Load Predefined Scenario
  const handleApplyScenario = (disp: string, meas: string) => {
    setDispenserQty(disp);
    setMeasuredQty(meas);
    setSimResultMeta(null);
  };

  // Handler: Save Verification Record to Database
  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const dQty = parseFloat(dispenserQty);
    const mQty = parseFloat(measuredQty);

    if (isNaN(dQty) || dQty <= 0) {
      setErrorMessage('Dispenser quantity must be greater than 0.');
      return;
    }
    if (isNaN(mQty) || mQty < 0) {
      setErrorMessage('Measured quantity cannot be negative.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await api.createRefuelling({
        vehicle_id: vehicleId,
        fuel_type: fuelType,
        dispenser_quantity: dQty,
        measured_quantity: mQty,
        location: location.trim() || 'Depot Pump',
        dispenser_id: dispenserId.trim() || 'Pump-01',
        operator_name: operatorName.trim() || 'Operator',
        notes: notes.trim() || undefined,
        measurement_uncertainty: preview?.measurement_uncertainty || 0.05
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onVerificationSaved();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(`Failed to save record: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Informative Sub-header */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/30 text-blue-300">
              <ShieldCheck size={20} />
            </span>
            <h2 className="font-heading font-bold text-lg">Independent Volumetric Verification Engine</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Compares dispenser-reported volume against independent flow sensor measurement.
            Evaluates signed delta, percentage deviation, and estimated uncertainty ($k=2, 95\%$ confidence).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-mono">
          <span className="text-slate-400">Tolerance Threshold:</span>
          <span className="text-emerald-400 font-bold">±{defaultThreshold.toFixed(1)}%</span>
        </div>
      </div>

      {/* Step Progress Indicator Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 font-medium text-blue-900">
            <span className="font-bold text-blue-600 block text-[10px] uppercase">Step 1</span>
            Select Vehicle
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 font-medium text-blue-900">
            <span className="font-bold text-blue-600 block text-[10px] uppercase">Step 2</span>
            Dispenser Volume
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 font-medium text-blue-900">
            <span className="font-bold text-blue-600 block text-[10px] uppercase">Step 3</span>
            Sensor Volume
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 font-medium text-blue-900">
            <span className="font-bold text-blue-600 block text-[10px] uppercase">Step 4</span>
            Run Verification
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 font-medium text-emerald-900 col-span-2 sm:col-span-1">
            <span className="font-bold text-emerald-600 block text-[10px] uppercase">Step 5</span>
            Record & Audit
          </div>
        </div>
      </div>

      {/* 2. Predefined Verification Presets Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark size={14} className="text-blue-600" />
            Standard Verification Presets
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Select preset for instant verification analysis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {demoScenarios.map((scen) => (
            <button
              key={scen.id}
              type="button"
              onClick={() => handleApplyScenario(scen.dispenser, scen.measured)}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">
                  {scen.title}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500">
                Disp: {scen.dispenser}L | Meas: {scen.measured}L
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {scen.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Form + Simulation Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <Fuel size={18} className="text-blue-600" />
                Refuelling Event Inputs
              </h3>
              <span className="text-xs text-slate-400 font-medium">* Required fields</span>
            </div>

            <form onSubmit={handleSaveVerification} className="space-y-5">
              {/* Vehicle & Fuel Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Vehicle *
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.plate_number}) {v.is_default ? '★ Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fuel Grade / Type *
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Diesel">Diesel (Auto Grade)</option>
                    <option value="Petrol 95">Petrol 95 (Premium)</option>
                    <option value="Petrol 91">Petrol 91 (Regular)</option>
                    <option value="CNG">CNG Compressed</option>
                  </select>
                </div>
              </div>

              {/* Quantities Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dispenser Reported Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dispenser Quantity (L) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={dispenserQty}
                      onChange={(e) => setDispenserQty(e.target.value)}
                      placeholder="e.g. 50.00"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                      LITRES
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Volume displayed on dispenser meter LCD
                  </span>
                </div>

                {/* FuelTrust Measured Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5">
                    FuelTrust Measured Quantity (L) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      value={measuredQty}
                      onChange={(e) => setMeasuredQty(e.target.value)}
                      placeholder="e.g. 49.40"
                      required
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-blue-500 font-mono">
                      LITRES
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600/80 mt-1 block">
                    Flow sensor reading (live, simulated, or manual)
                  </span>
                </div>
              </div>

              {/* Simulation Quick Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Flow Sensor Emulation Profiles
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">YF-S201 Emulation</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimProfile('accurate');
                      handleRunSimulation('accurate');
                    }}
                    disabled={isSimulating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-medium transition-all shadow-xs cursor-pointer"
                  >
                    🎯 Calibrated Dispense (~0.5% dev)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimProfile('moderate_variance');
                      handleRunSimulation('moderate_variance');
                    }}
                    disabled={isSimulating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-medium transition-all shadow-xs cursor-pointer"
                  >
                    ⚠️ Borderline (~2.0% dev)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimProfile('high_deviation');
                      handleRunSimulation('high_deviation');
                    }}
                    disabled={isSimulating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 font-medium transition-all shadow-xs cursor-pointer"
                  >
                    🚨 Review Discrepancy (~4.5% dev)
                  </button>
                </div>

                {simResultMeta && (
                  <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-200/60">
                    <span>Turbine Pulses: {simResultMeta.pulses_counted.toLocaleString()}</span>
                    <span>Temp: {simResultMeta.temperature_c.toFixed(1)} °C</span>
                    <span>Duration: {simResultMeta.duration_seconds.toFixed(1)}s</span>
                  </div>
                )}
              </div>

              {/* Station Location & Dispenser ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location / Station
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. North Harbor Terminal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dispenser / Pump ID
                  </label>
                  <input
                    type="text"
                    value={dispenserId}
                    onChange={(e) => setDispenserId(e.target.value)}
                    placeholder="e.g. Pump-04"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Operator Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inspection Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record pump mechanical condition, ambient temperature, or field remarks..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 resize-none"
                />
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Refuelling record verified and logged successfully to database!</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving || !preview}
                  className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={18} />
                  <span>{isSaving ? 'Verifying & Saving...' : 'VERIFY & RECORD REFUELLING'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDispenserQty('50.00');
                    setMeasuredQty('49.40');
                    setNotes('');
                    setSimResultMeta(null);
                  }}
                  className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Reset form"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Verification Engine Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sticky top-28">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-blue-600" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Verification Engine Output
                </h3>
              </div>
              {preview && <StatusBadge status={preview.verification_status} size="md" />}
            </div>

            {preview ? (
              <div className="space-y-5">
                {/* Result Status Banner with Human Explanation */}
                <div
                  className={`p-4 rounded-xl border ${
                    preview.is_within_tolerance
                      ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
                      : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {preview.is_within_tolerance ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    )}
                    <span className="font-heading font-bold text-sm tracking-wide">
                      {preview.is_within_tolerance
                        ? 'VERIFIED: Within Tolerable Limits'
                        : 'REVIEW: Verification Discrepancy'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    {preview.human_explanation}
                  </p>
                </div>

                {/* Mathematical Calculation Breakdown Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 font-mono text-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase font-sans tracking-wider">
                    Volumetric Discrepancy Metrics
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Dispenser Quantity (Q_disp):</span>
                    <span className="font-bold text-slate-900">{preview.dispenser_quantity.toFixed(2)} L</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Measured Quantity (Q_meas):</span>
                    <span className="font-bold text-blue-900">{preview.measured_quantity.toFixed(2)} L</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Estimated Uncertainty (±U):</span>
                    <span className="font-bold text-slate-800">±{preview.measurement_uncertainty.toFixed(2)} L (95% conf.)</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Signed Difference (Δ = Q_disp - Q_meas):</span>
                    <span className={`font-bold ${preview.signed_difference > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                      {preview.signed_difference > 0 ? `+${preview.signed_difference.toFixed(2)}` : preview.signed_difference.toFixed(2)} L
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 text-sm bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-sans font-semibold text-slate-800">Percentage Deviation:</span>
                    <span className={`font-bold ${preview.is_within_tolerance ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {preview.deviation_percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Visual Tolerance Envelope Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Tolerance Envelope</span>
                    <span className="text-slate-500 font-mono">Limit: ±{preview.threshold.toFixed(1)}%</span>
                  </div>
                  <ToleranceMeter
                    deviationPct={preview.deviation_percentage}
                    thresholdPct={preview.threshold}
                  />
                </div>

                {/* Scientific Remark Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider block flex items-center gap-1">
                    <Cpu size={12} className="text-blue-600" />
                    Metrology Observation
                  </span>
                  <p className="text-[11px] leading-relaxed italic">
                    "{preview.scientific_remark}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Info size={32} className="mx-auto opacity-40" />
                <p className="text-xs">
                  Enter dispenser and measured quantities on the left to activate verification engine.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
