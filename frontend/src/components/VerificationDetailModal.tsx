import React from 'react';
import { X, ShieldCheck, AlertTriangle, Fuel, Calendar, MapPin, Gauge, Cpu, Trash2 } from 'lucide-react';
import type { Refuelling } from '../types';
import { StatusBadge } from './StatusBadge';
import { ToleranceMeter } from './ToleranceMeter';

interface VerificationDetailModalProps {
  refuelling: Refuelling | null;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

export const VerificationDetailModal: React.FC<VerificationDetailModalProps> = ({
  refuelling,
  onClose,
  onDelete
}) => {
  if (!refuelling) return null;

  const isVerified = refuelling.verification_status === 'VERIFIED';
  const pulseEstimate = Math.round(refuelling.measured_quantity * 450);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isVerified ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-lg text-slate-900">
                  Verification Report #{refuelling.id}
                </h3>
                <StatusBadge status={refuelling.verification_status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Event ID: FT-REC-{refuelling.id.toString().padStart(5, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Metrics Comparative Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Dispenser Display</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {refuelling.dispenser_quantity.toFixed(2)} <span className="text-xs font-normal text-slate-500">L</span>
              </div>
            </div>

            <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/70">
              <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">FuelTrust Measured</span>
              <div className="text-xl font-bold text-blue-900 mt-1 font-mono">
                {refuelling.measured_quantity.toFixed(2)} <span className="text-xs font-normal text-blue-600">L</span>
              </div>
              <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                ±{(refuelling.measurement_uncertainty || 0.05).toFixed(2)} L (95% CL)
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Difference (Δ)</span>
              <div className={`text-xl font-bold mt-1 font-mono ${refuelling.difference === 0 ? 'text-slate-700' : refuelling.difference > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                {refuelling.difference > 0 ? `+${refuelling.difference.toFixed(2)}` : refuelling.difference.toFixed(2)} <span className="text-xs font-normal text-slate-500">L</span>
              </div>
            </div>

            <div className={`rounded-xl p-3.5 border ${isVerified ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
              <span className="text-[11px] font-medium uppercase tracking-wider block">Deviation</span>
              <div className="text-xl font-bold mt-1 font-mono">
                {refuelling.deviation_percentage.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Tolerance Gauge */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Tolerance Band Compliance</span>
              <span className="font-mono text-slate-500">Threshold: ±{refuelling.threshold_applied.toFixed(1)}%</span>
            </div>
            <ToleranceMeter
              deviationPct={refuelling.deviation_percentage}
              thresholdPct={refuelling.threshold_applied}
            />
          </div>

          {/* Scientific Remark Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cpu size={14} className="text-blue-600" />
              Metrology Observation & Verification Explanation
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {refuelling.scientific_remark || (
                isVerified
                  ? `Independent flow measurement is within the configured ±${refuelling.threshold_applied}% verification threshold.`
                  : `Independent flow measurement differs from the dispenser value beyond the configured ±${refuelling.threshold_applied}% threshold. Review this event.`
              )}
            </p>
          </div>

          {/* Detailed Context Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refuelling Metadata</h4>
              
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Fuel size={14} /> Vehicle
                </span>
                <span className="font-medium text-slate-900">
                  {refuelling.vehicle_name || `Vehicle #${refuelling.vehicle_id}`} {refuelling.vehicle_plate && `(${refuelling.vehicle_plate})`}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs text-slate-500">Fuel Grade</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {refuelling.fuel_type}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={14} /> Timestamp
                </span>
                <span className="font-mono text-xs text-slate-800">
                  {new Date(refuelling.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={14} /> Location
                </span>
                <span className="text-slate-800 text-xs font-medium truncate max-w-[160px]" title={refuelling.location}>
                  {refuelling.location || 'Depot'}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metrology & Sensor Telemetry (Simulated)</h4>
              
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Gauge size={14} /> Estimated Uncertainty
                </span>
                <span className="font-mono font-medium text-slate-900">
                  ±{(refuelling.measurement_uncertainty || 0.05).toFixed(2)} L (k=2)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs text-slate-500">Sensor Emulation</span>
                <span className="text-xs font-mono text-slate-700">YF-S201 Hall Turbine</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs text-slate-500">Turbine Pulses</span>
                <span className="text-xs font-mono text-slate-700">{pulseEstimate.toLocaleString()} pulses</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs text-slate-500">Operator</span>
                <span className="text-xs text-slate-700">{refuelling.operator_name || 'Field Inspector'}</span>
              </div>
            </div>
          </div>

          {refuelling.notes && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Operator Notes</span>
              <p className="text-xs text-slate-700 italic">"{refuelling.notes}"</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={() => {
                if (window.confirm(`Delete refuelling record #${refuelling.id}?`)) {
                  onDelete(refuelling.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Delete Record
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
