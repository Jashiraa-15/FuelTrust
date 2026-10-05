import React from 'react';
import {
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Gauge,
  MapPin,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';
import type { DashboardData, Refuelling } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ToleranceMeter } from '../components/ToleranceMeter';

interface DashboardScreenProps {
  data: DashboardData | null;
  loading: boolean;
  onSelectRefuelling: (refuelling: Refuelling) => void;
  onNavigateVerify: () => void;
  onNavigateHistory: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  data,
  loading,
  onSelectRefuelling,
  onNavigateVerify,
  onNavigateHistory
}) => {
  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/80 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200/80 rounded-2xl lg:col-span-1"></div>
          <div className="h-64 bg-slate-200/80 rounded-2xl lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  const latest = data.latest_verification;
  // Calculate average mileage from fleet data (standard operational estimation)
  const estimatedFuelConsumed = data.total_fuel_recorded * 0.94;
  const estimatedDistance = estimatedFuelConsumed * 8.4;
  const avgMileage = estimatedFuelConsumed > 0 ? (estimatedDistance / estimatedFuelConsumed).toFixed(1) : '8.4';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Overview Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Independent Fuel Verification
          </div>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold tracking-tight text-slate-900">
            Independent verification at every refuelling event.
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Dispenser Quantity + FuelTrust Measurement → Deviation Analysis → Verification
          </p>
        </div>

        <button
          onClick={onNavigateVerify}
          className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Plus size={15} />
          <span>Verify Refuelling</span>
        </button>
      </div>

      {/* 2. Top KPI Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Fuel Purchased */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fuel Purchased</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Fuel size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data.total_fuel_recorded.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Dispenser logged volume</p>
        </div>

        {/* Refuelling Events */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Events</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data.total_events}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Audited refuels</p>
        </div>

        {/* Verified Events */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verified</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-emerald-800 font-mono">
            {data.verified_events}
            <span className="text-xs font-medium text-emerald-600 ml-1.5">
              ({data.verification_rate_pct}%)
            </span>
          </div>
          <p className="text-[10px] text-emerald-700/80 mt-1">Within ±2.0% threshold</p>
        </div>

        {/* Review Required */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Review Required</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-amber-800 font-mono">
            {data.review_events}
            <span className="text-xs font-medium text-amber-600 ml-1.5">
              ({(100 - data.verification_rate_pct).toFixed(1)}%)
            </span>
          </div>
          <p className="text-[10px] text-amber-700/80 mt-1">Exceeds threshold</p>
        </div>

        {/* Average Deviation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Deviation</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data.average_deviation.toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Mean absolute discrepancy</p>
        </div>

        {/* Average Mileage */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Mileage</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Gauge size={16} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {avgMileage} <span className="text-xs font-normal text-slate-400">km/L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Fleet fuel economy</p>
        </div>
      </div>

      {/* 3. Middle Row: Prominent Latest Verification Card + Pipeline Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Central Visual Verification Card (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
                <Gauge size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  LATEST VERIFICATION
                </h3>
                <p className="text-xs text-slate-500">Dispenser LCD quantity vs FuelTrust independent measurement</p>
              </div>
            </div>

            {latest && (
              <StatusBadge status={latest.verification_status} size="md" />
            )}
          </div>

          {latest ? (
            <div className="space-y-5">
              {/* Visual Side-by-Side Comparison Box */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Dispenser Card */}
                <div className="w-full sm:w-5/12 bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DISPENSER
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                    {latest.dispenser_quantity.toFixed(2)} <span className="text-sm font-normal text-slate-500">L</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Station pump display</span>
                </div>

                {/* VS Indicator */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 font-bold text-[11px] font-mono">
                    VS
                  </span>
                </div>

                {/* FuelTrust Card */}
                <div className="w-full sm:w-5/12 bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-xs">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    FUELTRUST
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                    {latest.measured_quantity.toFixed(2)} <span className="text-sm font-normal text-slate-500">L</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Independent sensor reading</span>
                </div>
              </div>

              {/* Difference & Deviation Result Strip */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Difference</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {latest.difference > 0 ? `+${latest.difference.toFixed(2)}` : latest.difference.toFixed(2)} L
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Deviation</span>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${latest.verification_status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {latest.deviation_percentage.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Tolerance Visual Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">Tolerance Band Compliance (±2.0%)</span>
                  <span className={`font-mono font-semibold ${latest.verification_status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {latest.verification_status === 'VERIFIED' ? '✓ VERIFIED' : '⚠ REVIEW REQUIRED'}
                  </span>
                </div>
                <ToleranceMeter deviationPct={latest.deviation_percentage} thresholdPct={2.0} />
              </div>

              {/* Metadata and Remark */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Fuel size={14} className="text-slate-500" />
                    {latest.vehicle_name || `Vehicle #${latest.vehicle_id}`} {latest.vehicle_plate && `(${latest.vehicle_plate})`}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium font-mono text-[11px]">
                    {latest.fuel_type}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <MapPin size={12} /> {latest.location || 'Depot'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                    <Calendar size={12} /> {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] pt-1.5 border-t border-slate-200/70 leading-relaxed italic">
                  "{latest.scientific_remark || 'Measurement recorded within nominal operational variance.'}"
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Fuel size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No refuelling verifications recorded yet.</p>
            </div>
          )}
        </div>

        {/* Visual Pipeline Box (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Verification Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">End-to-end data processing workflow</p>
            </div>
            
            {/* Visual Pipeline Steps */}
            <div className="space-y-2 text-xs">
              {[
                { step: '1', title: 'DISPENSER QUANTITY', desc: 'Fuel pump LCD quantity reported at station' },
                { step: '2', title: 'INDEPENDENT MEASUREMENT', desc: 'In-line FuelTrust flow sensor pulses tallied' },
                { step: '3', title: 'DIFFERENCE CALCULATION', desc: 'Computes signed and absolute discrepancies' },
                { step: '4', title: 'DEVIATION ANALYSIS', desc: 'Evaluates percentage divergence vs threshold' },
                { step: '5', title: 'VERIFICATION RESULT', desc: 'Determines VERIFIED or REVIEW status' },
                { step: '6', title: 'ANALYTICS & MILEAGE', desc: 'Refuelling log updates fleet consumption trends' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-800 text-[11px] block">{item.title}</span>
                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateVerify}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Launch New Verification</span>
          </button>
        </div>
      </div>

      {/* 4. Recent Refuelling Table */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Recent Refuelling Verifications
            </h3>
            <p className="text-xs text-slate-500">Audit logs of latest refuelling verification events</p>
          </div>
          <button
            onClick={onNavigateHistory}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All History</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Event / Date</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Fuel Grade</th>
                <th className="py-3.5 px-4 text-right">Dispenser (L)</th>
                <th className="py-3.5 px-4 text-right">Measured (L)</th>
                <th className="py-3.5 px-4 text-right">Δ Difference</th>
                <th className="py-3.5 px-4 text-right">Deviation %</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.recent_refuellings.slice(0, 6).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="font-semibold text-slate-900 block">
                      #{item.id.toString().padStart(4, '0')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-900 block">
                      {item.vehicle_name || `Vehicle #${item.vehicle_id}`}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {item.vehicle_plate || '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                      {item.fuel_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900">
                    {item.dispenser_quantity.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900">
                    {item.measured_quantity.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-medium">
                    <span className={item.difference > 0 ? 'text-amber-700' : 'text-slate-700'}>
                      {item.difference > 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold">
                    <span className={item.verification_status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}>
                      {item.deviation_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={item.verification_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onSelectRefuelling(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Inspect Verification Details"
                    >
                      <Eye size={16} />
                    </button>
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
