import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Building2,
  Star
} from 'lucide-react';
import type { Vehicle } from '../types';
import { api } from '../services/api';

interface VehiclesScreenProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const VehiclesScreen: React.FC<VehiclesScreenProps> = ({ vehicles, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Diesel');
  const [tankCapacity, setTankCapacity] = useState<string>('75.0');
  const [odometerKm, setOdometerKm] = useState<string>('35000');
  const [department, setDepartment] = useState<string>('Logistics');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingVehicle(null);
    setName('');
    setPlateNumber('');
    setFuelType('Diesel');
    setTankCapacity('75.0');
    setOdometerKm('35000');
    setDepartment('Logistics');
    setIsDefault(vehicles.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setPlateNumber(v.plate_number);
    setFuelType(v.fuel_type);
    setTankCapacity(v.tank_capacity.toString());
    setOdometerKm(v.odometer_km.toString());
    setDepartment(v.department);
    setIsDefault(Boolean(v.is_default));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.setDefaultVehicle(id);
      onRefresh();
    } catch (err: any) {
      alert(`Error setting default vehicle: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !plateNumber.trim()) {
      setFormError('Vehicle Name and Plate Number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, {
          name: name.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          fuel_type: fuelType,
          tank_capacity: parseFloat(tankCapacity) || 75.0,
          odometer_km: parseFloat(odometerKm) || 0.0,
          department: department.trim(),
          is_default: isDefault
        });
        if (isDefault) {
          await api.setDefaultVehicle(editingVehicle.id);
        }
      } else {
        const created = await api.createVehicle({
          name: name.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          fuel_type: fuelType,
          tank_capacity: parseFloat(tankCapacity) || 75.0,
          odometer_km: parseFloat(odometerKm) || 0.0,
          department: department.trim(),
          is_default: isDefault
        });
        if (isDefault && created?.id) {
          await api.setDefaultVehicle(created.id);
        }
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete vehicle "${name}"? All associated refuelling records will also be removed.`)) {
      try {
        await api.deleteVehicle(id);
        onRefresh();
      } catch (err: any) {
        alert(`Error deleting vehicle: ${err.message}`);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & CTA */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <Truck size={22} className="text-blue-600" />
            Monitored Vehicle Fleet ({vehicles.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered commercial and logistics fleet assets undergoing independent fuel audits
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <Plus size={16} />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Vehicle Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="glass-panel rounded-2xl p-5 border border-slate-200/80 shadow-xs card-hover-lift flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80 font-bold">
                      {v.plate_number}
                    </span>
                    {v.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Star size={10} className="fill-amber-400 text-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900 pt-1">
                    {v.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 size={13} />
                    <span>{v.department || 'General Fleet'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!v.is_default && (
                    <button
                      onClick={() => handleSetDefault(v.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Set as Default Vehicle"
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(v)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit vehicle"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete vehicle"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Fuel Type</span>
                  <span className="font-semibold text-slate-800 font-mono">{v.fuel_type}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Tank Capacity</span>
                  <span className="font-semibold text-slate-800 font-mono">{v.tank_capacity} L</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Audited Refuels</span>
                  <span className="font-bold text-blue-700 font-mono">{v.refuelling_count || 0} events</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Fuel</span>
                  <span className="font-bold text-slate-900 font-mono">{(v.total_fuel_litres || 0).toFixed(1)} L</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100">
              <span>Odometer: {v.odometer_km.toLocaleString()} km</span>
              <span>ID: #{v.id.toString().padStart(3, '0')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Truck size={20} />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle Name / Identifier *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Delivery Van #16"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. TX-4921"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm uppercase font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fuel Grade *
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol 95">Petrol 95</option>
                    <option value="Petrol 91">Petrol 91</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tank Capacity (L)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(e.target.value)}
                    placeholder="75"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    placeholder="35000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department / Fleet Division
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Metro Logistics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultVehicle"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="isDefaultVehicle" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Set as Primary / Default Fleet Vehicle for Audits
                </label>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
