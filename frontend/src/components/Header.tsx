import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, RefreshCw, LogOut } from 'lucide-react';
import type { NavTab, AuthUser } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onNewVerification: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  user?: AuthUser | null;
  onLogout?: () => void;
}

const titles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'Real-time telemetry and fuel refuelling verification statistics'
  },
  'live-measurement': {
    title: 'Live Flow Measurement Console',
    subtitle: 'Real-time simulated turbine sensor stream, accumulated volume, and fluid dynamics'
  },
  verify: {
    title: 'Refuelling Verification Engine',
    subtitle: 'Direct comparison between dispenser reporting and FuelTrust independent flow measurement'
  },
  history: {
    title: 'Refuelling Verification Log',
    subtitle: 'Comprehensive audit history of dispenser vs sensor volumetric events'
  },
  calibration: {
    title: 'Flow Sensor Calibration & Proving',
    subtitle: 'Calculate volumetric error, percentage deviation, and meter correction factor K'
  },
  analytics: {
    title: 'Data Analysis & Fleet Efficiency',
    subtitle: 'Fuel purchased vs consumed, vehicle efficiency metrics, and verification deviation distribution'
  },
  vehicles: {
    title: 'Vehicle Fleet Registry',
    subtitle: 'Manage monitored fleet units, tank capacities, and refuelling audits'
  },
  device: {
    title: 'Hardware & Sensor Telemetry',
    subtitle: 'ESP32 microcontroller, YF-S201 flow meter, and diagnostic status'
  },
  settings: {
    title: 'System Settings & Calibration',
    subtitle: 'Configure verification tolerance thresholds, unit scales, and system parameters'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNewVerification,
  onRefresh,
  isRefreshing = false,
  user,
  onLogout
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = titles[activeTab] || { title: 'FuelTrust', subtitle: 'Smart Fuel Verification' };

  return (
    <header className="h-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
          {meta.title}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {meta.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live System Time */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-mono border border-slate-200/80">
          <Clock size={13} className="text-slate-400" />
          <span>{timeStr || '12:00:00'}</span>
        </div>

        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Telemetry Stream Active</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-slate-900' : ''} />
          </button>
        )}

        {/* Primary CTA */}
        {activeTab !== 'verify' && (
          <button
            onClick={onNewVerification}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Verify Refuelling</span>
          </button>
        )}

        {/* User Profile & Logout */}
        {user && (
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <span className="font-semibold text-xs text-slate-900 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {user.role}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in duration-150">
                <div className="p-3 border-b border-slate-100 space-y-0.5">
                  <p className="font-semibold text-xs text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {user.role}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
