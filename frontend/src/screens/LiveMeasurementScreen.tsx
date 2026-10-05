import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Gauge,
  Thermometer,
  Battery,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { LiveTelemetry, StopMeasurementSummary } from '../types';
import { api } from '../services/api';

interface LiveMeasurementScreenProps {
  onTransferToVerify: (measuredVolume: number, uncertainty: number) => void;
}

export const LiveMeasurementScreen: React.FC<LiveMeasurementScreenProps> = ({
  onTransferToVerify
}) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [chartData, setChartData] = useState<Array<{ time: string; flow_rate: number; volume: number; pressure: number }>>([]);
  const [targetFlowRate, setTargetFlowRate] = useState<number>(35.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stopSummary, setStopSummary] = useState<StopMeasurementSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pollingRef = useRef<any>(null);

  // Poll live telemetry every 500ms
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const frame = await api.getLiveTelemetry();
        setTelemetry(frame);

        // Fetch chart history buffer
        const hist = await api.getLiveMeasurementHistory();
        if (hist && hist.length > 0) {
          setChartData(hist);
        }
      } catch {
        // Backend silent retry
      }
    };

    fetchLive();
    pollingRef.current = setInterval(fetchLive, 500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStart = async () => {
    try {
      setIsProcessing(true);
      setStopSummary(null);
      setFeedback(null);
      await api.startLiveMeasurement(targetFlowRate);
      setFeedback('Measurement active: fluid pulses streaming from simulated turbine.');
    } catch (err: any) {
      setFeedback(`Start failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsProcessing(true);
      const summary = await api.stopLiveMeasurement();
      setStopSummary(summary);
      setFeedback(`Measurement stopped. Total volume: ${summary.measured_quantity.toFixed(2)} L (Uncertainty: ±${summary.estimated_uncertainty}L).`);
    } catch (err: any) {
      setFeedback(`Stop failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsProcessing(true);
      await api.resetLiveMeasurement();
      setStopSummary(null);
      setFeedback('Counters reset to zero.');
    } catch (err: any) {
      setFeedback(`Reset failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isMeasuring = telemetry?.state === 'MEASURING';
  const isStopped = telemetry?.state === 'STOPPED';

  // Format elapsed time string HH:MM:SS
  const formatTimer = (seconds: number) => {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/40 text-blue-300 border border-blue-400/30">
              <Zap size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-lg text-white">Live Sensor Measurement Console</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400 text-slate-950 uppercase tracking-wider">
                  STREAM ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Independent flow sensor pulse acquisition & real-time volumetric accumulation
              </p>
            </div>
          </div>
        </div>

        {/* Live Timer Clock Display */}
        <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <Clock size={18} className={isMeasuring ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Session Elapsed Time
            </span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {formatTimer(telemetry?.elapsed_seconds || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Stream Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-800 text-[10px] uppercase">
            SENSOR TELEMETRY STREAM
          </span>
          <span className="font-medium text-slate-700">
            Flow telemetry acquired via YF-S201 turbine sensor interface. Continuous volumetric pulse integration.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-600 shrink-0 font-semibold">ESP32 REST Interface Active</span>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
        </div>
      )}

      {/* 2. Top Primary Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flow Rate Gauge */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Instantaneous Flow</span>
            <Gauge size={18} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900 font-mono">
              {(telemetry?.flow_rate_lpm || 0).toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">L/min</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Turbine frequency: {((telemetry?.flow_rate_lpm || 0) * 7.5).toFixed(0)} Hz
          </p>
        </div>

        {/* Accumulated Volume */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-200/80 bg-blue-50/40 shadow-xs space-y-2 card-hover-lift">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Accumulated Volume</span>
            <Zap size={18} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-blue-900 font-mono">
              {(telemetry?.accumulated_volume_litres || 0).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-blue-700 font-mono">LITRES</span>
          </div>
          <p className="text-[11px] text-blue-600/80 font-mono">
            Total Pulses: {(telemetry?.raw_pulses || 0).toLocaleString()} p
          </p>
        </div>

        {/* Temperature & Pressure */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Fluid Pressure & Temp</span>
            <Thermometer size={18} className="text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <div>
              <span className="text-2xl font-bold font-heading text-slate-900 font-mono">
                {(telemetry?.pressure_bar || 2.1).toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-1">bar</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-heading text-slate-900 font-mono">
                {(telemetry?.temperature_celsius || 24.5).toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-1">°C</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Dispenser line pressure (Nominal 2.1 bar)
          </p>
        </div>

        {/* Device Battery & Hardware Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Hardware State</span>
            <Battery size={18} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isMeasuring ? 'bg-emerald-500 animate-ping' : isStopped ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            <span className="text-base font-bold text-slate-900 font-mono uppercase">
              {telemetry?.state || 'IDLE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>Battery: {telemetry?.battery_level || 94}%</span>
            <span>GPS: 3D Fix</span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Flow Rate Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={18} className="text-blue-600" />
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Real-Time Flow Rate Hydro-Dynamics (L/min)
              </h3>
              <p className="text-xs text-slate-500">Live dynamic stream with realistic fluid turbulence oscillations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Streaming (0.5s)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" L/m" domain={[0, 60]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${value} L/min`, 'Flow Rate']}
              />
              <Area type="monotone" dataKey="flow_rate" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#flowGrad)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Controls & Flow Rate Adjustment Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Control Buttons & Slider (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" />
              Measurement Session Controls
            </h3>
            <span className="text-xs font-mono text-slate-400">YF-S201 Emulation</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isMeasuring ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={isProcessing}
                className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={18} />
                <span>START MEASUREMENT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                disabled={isProcessing}
                className="flex-1 py-3 px-5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square size={18} />
                <span>STOP MEASUREMENT</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing || isMeasuring}
              className="py-3 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>RESET</span>
            </button>
          </div>

          {/* Target Flow Rate Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Target Fuel Dispense Rate:
              </label>
              <span className="font-mono font-bold text-sm text-blue-700">
                {targetFlowRate} L/min
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="65"
              step="1"
              value={targetFlowRate}
              onChange={(e) => setTargetFlowRate(Number(e.target.value))}
              disabled={isMeasuring}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>10 L/min (Slow trickle)</span>
              <span>35 L/min (Nominal auto dispenser)</span>
              <span>65 L/min (High-flow freight)</span>
            </div>
          </div>
        </div>

        {/* Right: Transfer to Verification Result Box (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            Verification Pipeline Handoff
          </h3>

          {stopSummary || (telemetry && telemetry.accumulated_volume_litres > 0) ? (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                  Measured Flow Result Ready
                </span>
                <div className="text-2xl font-extrabold text-blue-900 font-mono">
                  {(stopSummary?.measured_quantity || telemetry?.accumulated_volume_litres || 0).toFixed(2)}{' '}
                  <span className="text-xs font-normal text-blue-700">LITRES</span>
                </div>
                <div className="pt-2 border-t border-blue-200/70 flex justify-between text-xs text-blue-800 font-mono">
                  <span>Estimated Uncertainty: ±{(stopSummary?.estimated_uncertainty || 0.05).toFixed(2)} L</span>
                  <span>Confidence: 95%</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Transfer this independently measured quantity directly into the verification engine to compare against the dispenser LCD reading.
              </p>

              <button
                type="button"
                onClick={() => {
                  const vol = stopSummary?.measured_quantity || telemetry?.accumulated_volume_litres || 0;
                  const unc = stopSummary?.estimated_uncertainty || 0.05;
                  onTransferToVerify(vol, unc);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Transfer Volume to Verification</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Layers size={32} className="mx-auto opacity-40" />
              <p className="text-xs">
                Start and run a measurement session on the left to capture flow volume for verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
