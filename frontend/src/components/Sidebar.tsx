import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  BarChart3,
  Truck,
  Cpu,
  Settings,
  Shield,
  Activity,
  Compass,
  type LucideIcon
} from 'lucide-react';
import type { NavTab } from '../types';

interface NavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  deviceOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-measurement', label: 'Live Measurement', icon: Activity, badge: 'Live' },
    { id: 'calibration', label: 'Calibration', icon: Compass },
    { id: 'verify', label: 'Verification', icon: ShieldCheck, badge: 'Verify' },
    { id: 'analytics', label: 'Data Analysis', icon: BarChart3, badge: 'Insights' },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'history', label: 'Refuelling History', icon: History },
    { id: 'device', label: 'Hardware & Telemetry', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl text-slate-700 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-200/80 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shadow-slate-900/10">
          <Shield size={20} className="stroke-[2.2] text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">FUEL</span>
            <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">TRUST</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">
            Smart Fuel Verification
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  isActive
                    ? 'bg-slate-800 text-slate-200'
                    : item.badge === 'Live'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : item.badge === 'Insights'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hardware Telemetry Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 text-[11px]">Telemetry Node</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200/80">
            ONLINE
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          ESP32 Ingest Stream Connected
        </p>
        <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Flow: YF-S201</span>
          <span>Temp: 24.5°C</span>
        </div>
      </div>
    </aside>
  );
};
