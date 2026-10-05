import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  Trash2,
  Fuel
} from 'lucide-react';
import type { Refuelling, Vehicle } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface HistoryScreenProps {
  refuellings: Refuelling[];
  vehicles: Vehicle[];
  onSelectRefuelling: (refuelling: Refuelling) => void;
  onDeleteRefuelling: (id: number) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  refuellings,
  vehicles,
  onSelectRefuelling,
  onDeleteRefuelling
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Filtered dataset
  const filteredList = useMemo(() => {
    const now = new Date().getTime();
    return refuellings.filter((item) => {
      // Date filter
      if (dateFilter !== 'ALL') {
        const itemTime = new Date(item.timestamp).getTime();
        const daysAgo = (now - itemTime) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7D' && daysAgo > 7) return false;
        if (dateFilter === '30D' && daysAgo > 30) return false;
        if (dateFilter === '90D' && daysAgo > 90) return false;
      }
      // Vehicle filter
      if (selectedVehicleId !== 'ALL' && item.vehicle_id !== Number(selectedVehicleId)) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.verification_status !== selectedStatus) {
        return false;
      }
      // Fuel type filter
      if (fuelTypeFilter !== 'ALL' && item.fuel_type !== fuelTypeFilter) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesLoc = item.location?.toLowerCase().includes(q);
        const matchesPump = item.dispenser_id?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesVeh = item.vehicle_name?.toLowerCase().includes(q) || item.vehicle_plate?.toLowerCase().includes(q);
        if (!matchesLoc && !matchesPump && !matchesNotes && !matchesVeh) {
          return false;
        }
      }
      return true;
    });
  }, [refuellings, selectedVehicleId, selectedStatus, fuelTypeFilter, dateFilter, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Event ID',
      'Timestamp',
      'Vehicle Name',
      'Plate Number',
      'Fuel Type',
      'Dispenser Quantity (L)',
      'FuelTrust Quantity (L)',
      'Difference (L)',
      'Deviation (%)',
      'Status',
      'Threshold (%)',
      'Location',
      'Dispenser ID',
      'Notes'
    ];

    const rows = filteredList.map((r) => [
      r.id,
      new Date(r.timestamp).toISOString(),
      `"${r.vehicle_name || ''}"`,
      `"${r.vehicle_plate || ''}"`,
      r.fuel_type,
      r.dispenser_quantity,
      r.measured_quantity,
      r.difference,
      r.deviation_percentage,
      r.verification_status,
      r.threshold_applied,
      `"${r.location || ''}"`,
      `"${r.dispenser_id || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fueltrust_verification_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const verifiedCount = filteredList.filter((r) => r.verification_status === 'VERIFIED').length;
  const reviewCount = filteredList.filter((r) => r.verification_status === 'REVIEW').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by location, vehicle, pump ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredList.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Stats Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Time</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
              <option value="90D">Past 90 Days</option>
            </select>

            {/* Vehicle Filter */}
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate_number})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="REVIEW">Review Only</option>
            </select>

            {/* Fuel Type Filter */}
            <select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Fuel Types</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol 95">Petrol 95</option>
              <option value="Petrol 91">Petrol 91</option>
            </select>
          </div>

          {/* Result Count Badges */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Showing {filteredList.length} of {refuellings.length} events</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">{verifiedCount} Verified</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-700 font-medium">{reviewCount} Review</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Event / Date</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Location / Pump</th>
                <th className="py-3.5 px-4">Fuel Grade</th>
                <th className="py-3.5 px-4 text-right">Dispenser (L)</th>
                <th className="py-3.5 px-4 text-right">Measured (L)</th>
                <th className="py-3.5 px-4 text-right">Δ Diff</th>
                <th className="py-3.5 px-4 text-right">Deviation %</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="font-bold text-slate-900 block">
                        #{item.id.toString().padStart(4, '0')}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {item.vehicle_name || `Vehicle #${item.vehicle_id}`}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {item.vehicle_plate || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-800 block truncate max-w-[180px]" title={item.location}>
                        {item.location || 'Depot'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {item.dispenser_id || 'Pump-01'}
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
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-blue-900">
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectRefuelling(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Full Report"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteRefuelling(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Fuel size={36} className="mx-auto mb-2 opacity-40" />
                    <p>No refuelling verification records match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
