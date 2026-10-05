import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Layers,
  Cpu,
  History,
  Info
} from 'lucide-react';
import type { Calibration } from '../types';
import { api } from '../services/api';

export const CalibrationScreen: React.FC = () => {
  const [refQuantity, setRefQuantity] = useState<string>('10.00');
  const [measQuantity, setMeasQuantity] = useState<string>('9.94');
  const [sensorId, setSensorId] = useState<string>('YF-S201-SIM-01');
  const [operatorName, setOperatorName] = useState<string>('Calibration Metrologist');
  const [notes, setNotes] = useState<string>('Periodic volumetric proving test');

  // Calibration calculation preview
  const [calcPreview, setCalcPreview] = useState<{
    error: number;
    percentage_error: number;
    correction_factor: number;
  } | null>(null);

  const [history, setHistory] = useState<Calibration[]>([]);
  const [activeFactor, setActiveFactor] = useState<Calibration | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live calculation effect
  useEffect(() => {
    const ref = parseFloat(refQuantity);
    const meas = parseFloat(measQuantity);

    if (!isNaN(ref) && ref > 0 && !isNaN(meas) && meas > 0) {
      const err = roundVal(meas - ref, 3);
      const pctErr = roundVal((err / ref) * 100.0, 2);
      const kFactor = roundVal(ref / meas, 4);
      setCalcPreview({
        error: err,
        percentage_error: pctErr,
        correction_factor: kFactor
      });
    } else {
      setCalcPreview(null);
    }
  }, [refQuantity, measQuantity]);

  const roundVal = (v: number, dec: number) => {
    return Number(Math.round(Number(v + 'e' + dec)) + 'e-' + dec);
  };

  const loadData = async () => {
    try {
      const [hist, act] = await Promise.all([
        api.getCalibrationHistory(),
        api.getCalibrationActive()
      ]);
      setHistory(hist);
      setActiveFactor(act);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = parseFloat(refQuantity);
    const meas = parseFloat(measQuantity);

    if (isNaN(ref) || ref <= 0 || isNaN(meas) || meas <= 0) {
      setFeedback({ type: 'error', message: 'Reference and measured volumes must be positive numbers.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const created = await api.recordCalibration({
        reference_quantity: ref,
        measured_quantity: meas,
        sensor_id: sensorId,
        operator_name: operatorName,
        notes: notes.trim() || undefined
      });

      setFeedback({
        type: 'success',
        message: `Calibration recorded successfully! Applied correction factor K = ${created.correction_factor.toFixed(4)}x`
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Calibration failed: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/40 text-indigo-300 border border-indigo-400/30">
              <Compass size={22} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Flow Sensor Calibration & Proving</h2>
              <p className="text-xs text-slate-300">
                Calibrate sensor pulse coefficient against certified gravimetric or volumetric provers
              </p>
            </div>
          </div>
        </div>

        {/* Active Calibration Factor Badge */}
        <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <Cpu size={18} className="text-indigo-400" />
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Active Correction Factor (K)
            </span>
            <span className="text-lg font-mono font-bold text-indigo-400">
              {activeFactor ? `${activeFactor.correction_factor.toFixed(4)}x` : '1.0000x'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrology Proving Note */}
      <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-800 text-[10px] uppercase">
            METROLOGY STANDARD
          </span>
          <span className="font-medium text-slate-700">
            Flow meter calibration calculates correction factor K based on certified volumetric or gravimetric reference prover measurements.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-600 shrink-0 font-semibold">Prover Model: Gravimetric Standard</span>
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

      {/* 2. Calibration Proving Form & Calculated Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" />
              Prover Measurement Run
            </h3>
            <span className="text-xs text-slate-400 font-mono">Volumetric Prover Input</span>
          </div>

          <form onSubmit={handleSaveCalibration} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reference Quantity (Q_ref) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={refQuantity}
                    onChange={(e) => setRefQuantity(e.target.value)}
                    required
                    placeholder="10.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                    LITRES
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Certified prover standard volume
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5">
                  Measured Quantity (Q_meas) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={measQuantity}
                    onChange={(e) => setMeasQuantity(e.target.value)}
                    required
                    placeholder="9.94"
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-blue-900 focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-blue-500 font-mono">
                    LITRES
                  </span>
                </div>
                <span className="text-[11px] text-blue-600/80 mt-1 block">
                  Uncorrected sensor volumetric reading
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sensor Serial / Model ID
                </label>
                <input
                  type="text"
                  value={sensorId}
                  onChange={(e) => setSensorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operator / Metrologist
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Proving Run Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Atmospheric conditions, flow rate during proving, prover cert ID..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving || !calcPreview}
                className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={18} />
                <span>{isSaving ? 'Saving Calibration...' : 'APPLY & SAVE CALIBRATION'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRefQuantity('10.00');
                  setMeasQuantity('9.94');
                  setNotes('Routine proving test');
                }}
                className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset form"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Right: Calculated Calibration Metrics (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sticky top-28">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Calibration Metrics Output
            </h3>
            <span className="text-xs font-mono text-slate-400">Mathematical Model</span>
          </div>

          {calcPreview ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Volumetric Error (E = Q_meas - Q_ref):</span>
                  <span className={`font-bold ${calcPreview.error === 0 ? 'text-slate-900' : calcPreview.error > 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                    {calcPreview.error > 0 ? `+${calcPreview.error.toFixed(3)}` : calcPreview.error.toFixed(3)} L
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Percentage Error (%E = E / Q_ref × 100):</span>
                  <span className={`font-bold ${Math.abs(calcPreview.percentage_error) <= 1.0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {calcPreview.percentage_error > 0 ? `+${calcPreview.percentage_error.toFixed(2)}` : calcPreview.percentage_error.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-sm">
                  <span className="font-sans font-bold text-indigo-900">Meter Correction Factor (K = Q_ref / Q_meas):</span>
                  <span className="font-bold text-indigo-900 text-base">
                    {calcPreview.correction_factor.toFixed(4)}x
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Correction Formula Application:
                </span>
                <p className="font-mono text-[11px] text-slate-700">
                  Q_corrected = Q_raw × {calcPreview.correction_factor.toFixed(4)}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Once saved, subsequent independent flow sensor readings will apply this multiplier factor.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Info size={30} className="mx-auto opacity-40" />
              <p className="text-xs">
                Enter reference and measured volumes to calculate error and correction factor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Calibration History Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-indigo-600" />
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Sensor Proving & Calibration History
              </h3>
              <p className="text-xs text-slate-500">Historical calibration verification runs</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">{history.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date / Run</th>
                <th className="py-3 px-4">Sensor Model</th>
                <th className="py-3 px-4 text-right">Reference (L)</th>
                <th className="py-3 px-4 text-right">Measured (L)</th>
                <th className="py-3 px-4 text-right">Error (L)</th>
                <th className="py-3 px-4 text-right">Error %</th>
                <th className="py-3 px-4 text-right">Factor (K)</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">
                    <span className="font-bold text-slate-900 block">
                      #{h.id.toString().padStart(3, '0')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(h.calibration_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800">
                    {h.sensor_id}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    {h.reference_quantity.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-blue-900">
                    {h.measured_quantity.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-medium">
                    <span className={h.error === 0 ? 'text-slate-700' : h.error > 0 ? 'text-blue-700' : 'text-amber-700'}>
                      {h.error > 0 ? `+${h.error.toFixed(3)}` : h.error.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-xs">
                    <span className={Math.abs(h.percentage_error) <= 1.0 ? 'text-emerald-700' : 'text-amber-700'}>
                      {h.percentage_error > 0 ? `+${h.percentage_error.toFixed(2)}` : h.percentage_error.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-xs text-indigo-700">
                    {h.correction_factor.toFixed(4)}x
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {h.operator_name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {h.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        ARCHIVED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
