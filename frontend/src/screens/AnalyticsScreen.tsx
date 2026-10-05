import React, { useState, useEffect, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingDown,
  ShieldCheck,
  Fuel,
  MapPin,
  Truck,
  Gauge,
  Layers,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import type { AnalyticsData, Vehicle } from '../types';
import { api } from '../services/api';

interface AnalyticsScreenProps {
  data: AnalyticsData | null;
  loading: boolean;
  vehicles?: Vehicle[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  data: initialData,
  loading: initialLoading,
  vehicles = []
}) => {
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('ALL');
  const [selectedFuelType, setSelectedFuelType] = useState<string>('ALL');
  
  const [currentData, setCurrentData] = useState<AnalyticsData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(initialLoading);

  const fetchFilteredAnalytics = useCallback(async (tf: string, vId: string, fType: string) => {
    try {
      setLoading(true);
      const res = await api.getAnalytics({
        time_filter: tf,
        vehicle_id: vId !== 'ALL' ? Number(vId) : undefined,
        fuel_type: fType !== 'ALL' ? fType : undefined
      });
      setCurrentData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update when initialData arrives or when filters change
  useEffect(() => {
    if (initialData && timeFilter === 'all' && selectedVehicleId === 'ALL' && selectedFuelType === 'ALL') {
      setCurrentData(initialData);
    }
  }, [initialData, timeFilter, selectedVehicleId, selectedFuelType]);

  const handleTimeFilter = (tf: string) => {
    setTimeFilter(tf);
    fetchFilteredAnalytics(tf, selectedVehicleId, selectedFuelType);
  };

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    fetchFilteredAnalytics(timeFilter, vId, selectedFuelType);
  };

  const handleFuelChange = (fType: string) => {
    setSelectedFuelType(fType);
    fetchFilteredAnalytics(timeFilter, selectedVehicleId, fType);
  };

  const data = currentData || initialData;

  const timeOptions = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/80 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200/80 rounded-2xl"></div>
          <div className="h-80 bg-slate-200/80 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const hasData = Boolean(data && data.total_events > 0);
  const totalEvents = data?.total_events ?? 0;
  const verifiedCount = data?.verified_count ?? 0;
  const reviewCount = data?.review_count ?? 0;
  const passRate = totalEvents > 0 ? ((verifiedCount / totalEvents) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header & Filter Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold mb-1">
            <Sparkles size={13} className="text-amber-500" />
            Metrology & Fleet Analytics
          </div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
            Data Analysis & Discrepancy Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Dynamic fuel consumption audits, sensor deviation distribution, and vehicle mileage trends
          </p>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            {timeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleTimeFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Vehicle Dropdown Filter */}
          <select
            value={selectedVehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium shadow-xs focus:outline-hidden focus:border-slate-400 cursor-pointer"
          >
            <option value="ALL">All Vehicles ({vehicles.length})</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.plate_number})
              </option>
            ))}
          </select>

          {/* Fuel Type Dropdown Filter */}
          <select
            value={selectedFuelType}
            onChange={(e) => handleFuelChange(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium shadow-xs focus:outline-hidden focus:border-slate-400 cursor-pointer"
          >
            <option value="ALL">All Fuel Types</option>
            <option value="Diesel">Diesel</option>
            <option value="Petrol 95">Petrol 95</option>
            <option value="Petrol 91">Petrol 91</option>
            <option value="CNG">CNG</option>
          </select>
        </div>
      </div>

      {/* 2. Top KPI Cards (7 Dynamic Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {/* Total Fuel Purchased */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fuel Purchased</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Fuel size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data ? data.total_fuel_purchased.toLocaleString() : '0'} <span className="text-[11px] font-normal text-slate-400">L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Dispenser billed volume</p>
        </div>

        {/* Total Refuelling Events */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Events</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Layers size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {totalEvents}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Audited refuels</p>
        </div>

        {/* Verified Events */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verified</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-emerald-800 font-mono">
            {verifiedCount}
          </div>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">Within ±2.0% threshold</p>
        </div>

        {/* Review Events */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Review Events</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-amber-800 font-mono">
            {reviewCount}
          </div>
          <p className="text-[10px] text-amber-700/80 mt-0.5">Discrepancy &gt; threshold</p>
        </div>

        {/* Verification Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verif. Rate</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-emerald-800 font-mono">
            {passRate}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{verifiedCount} of {totalEvents} events</p>
        </div>

        {/* Average Deviation */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Deviation</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data ? data.avg_deviation_pct.toFixed(2) : '0.00'}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Max: {data ? data.max_deviation_pct.toFixed(2) : '0.00'}%</p>
        </div>

        {/* Average Mileage */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Mileage</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Gauge size={14} />
            </div>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 font-mono">
            {data ? data.average_mileage_kpl.toFixed(1) : '0.0'} <span className="text-[11px] font-normal text-slate-400">km/L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Fleet efficiency</p>
        </div>
      </div>

      {/* 3. Dynamic Key Insights Card */}
      {data && data.key_insights && data.key_insights.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Lightbulb size={16} />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
              KEY INSIGHTS
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {data.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-medium"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If No Data Available */}
      {!hasData ? (
        <div className="glass-panel p-16 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <Fuel size={44} className="mx-auto text-slate-300 opacity-60" />
          <h3 className="font-heading font-bold text-base text-slate-700">
            No data available for this period.
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No refuelling records match the selected time frame ({timeFilter}), vehicle, or fuel type.
            Try selecting "All Time" or reset your filters.
          </p>
        </div>
      ) : (
        <>
          {/* 4. Charts Grid 1: Fuel Quantity Over Time & Verification Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CHART 1: Fuel Quantity Over Time */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    CHART 1: Fuel Quantity Over Time
                  </h3>
                  <p className="text-xs text-slate-500">Dispenser purchased vs sensor measured vs estimated consumed (L)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-900"></span> Purchased
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span> Measured
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data!.fuel_comparison_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="measGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" L" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} L`, 'Volume']}
                    />
                    <Area type="monotone" dataKey="purchased" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#purchGrad)" name="Dispenser Purchased" />
                    <Area type="monotone" dataKey="measured" stroke="#64748b" strokeWidth={1.8} strokeDasharray="3 3" fillOpacity={1} fill="url(#measGrad)" name="FuelTrust Measured" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 4: Verification Status Distribution */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  CHART 4: Verification Status Distribution
                </h3>
                <p className="text-xs text-slate-500">Compliance distribution: Verified (≤2.0%) vs Review (&gt;2.0%)</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data!.status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data!.status_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-emerald-50/80 p-2.5 rounded-xl text-emerald-800 border border-emerald-200/60 text-center">
                  <span className="font-bold block text-base">{verifiedCount}</span>
                  <span className="text-[10px]">VERIFIED ({passRate}%)</span>
                </div>
                <div className="bg-amber-50/80 p-2.5 rounded-xl text-amber-800 border border-amber-200/60 text-center">
                  <span className="font-bold block text-base">{reviewCount}</span>
                  <span className="text-[10px]">REVIEW ({totalEvents > 0 ? (100 - Number(passRate)).toFixed(1) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Charts Grid 2: Deviation Over Time & Mileage Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CHART 2: Deviation Over Time */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    CHART 2: Deviation Over Time (%)
                  </h3>
                  <p className="text-xs text-slate-500">Sequential verification divergence vs configured threshold</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ±2.0% Threshold
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data!.timeline_series} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorDev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Deviation']}
                    />
                    <ReferenceLine y={2.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: '2.0% Limit', fill: '#10b981', fontSize: 10 }} />
                    <Area type="monotone" dataKey="deviation" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorDev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: Mileage Trend */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    CHART 3: Mileage Trend (km/L)
                  </h3>
                  <p className="text-xs text-slate-500">Fleet fuel economy trend calculated per refuelling cycle</p>
                </div>
                <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Avg: {data!.average_mileage_kpl.toFixed(1)} km/L
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data!.mileage_trend_series} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" km/L" domain={[4, 14]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} km/L`, 'Mileage']}
                    />
                    <Line type="monotone" dataKey="mileage_kpl" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3, fill: '#0f172a' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 6. Discrepancy Tables: Stations & Vehicles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discrepancy by Station / Location */}
            <div className="glass-panel rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-700" />
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900">
                      Station Discrepancy Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-500">Dispenser stations ranked by average deviation</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Station / Location</th>
                      <th className="py-3 px-4 text-center">Events</th>
                      <th className="py-3 px-4 text-center">Review Rate</th>
                      <th className="py-3 px-4 text-right">Avg Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data!.location_discrepancy_ranking.map((loc, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {loc.location}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {loc.total_events}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-medium ${loc.review_events > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                            {loc.review_rate_pct}% ({loc.review_events})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={loc.avg_deviation > 2.0 ? 'text-amber-700' : 'text-emerald-700'}>
                            {loc.avg_deviation.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discrepancy by Vehicle */}
            <div className="glass-panel rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-slate-700" />
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900">
                      Vehicle Discrepancy Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-500">Fleet units ranked by recorded deviation</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4 text-center">Events</th>
                      <th className="py-3 px-4 text-center">Review Rate</th>
                      <th className="py-3 px-4 text-right">Avg Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data!.vehicle_discrepancy_ranking.map((veh, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{veh.vehicle_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{veh.plate_number}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {veh.total_events}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-medium ${veh.review_events > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                            {veh.review_rate_pct}% ({veh.review_events})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={veh.avg_deviation > 2.0 ? 'text-amber-700' : 'text-emerald-700'}>
                            {veh.avg_deviation.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
