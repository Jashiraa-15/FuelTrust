import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { LiveMeasurementScreen } from './screens/LiveMeasurementScreen';
import { VerificationScreen } from './screens/VerificationScreen';
import { CalibrationScreen } from './screens/CalibrationScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { VehiclesScreen } from './screens/VehiclesScreen';
import { DeviceScreen } from './screens/DeviceScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VerificationDetailModal } from './components/VerificationDetailModal';
import type {
  NavTab,
  Vehicle,
  Refuelling,
  DashboardData,
  AnalyticsData,
  DeviceStatus,
  AppSettings,
  AuthUser
} from './types';
import { api } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Authentication State - In-memory only: always requires Login on startup or reload
  const [user, setUser] = useState<AuthUser | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refuellings, setRefuellings] = useState<Refuelling[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Live measurement handoff data
  const [initialMeasuredVolume, setInitialMeasuredVolume] = useState<number | null>(null);
  const [initialUncertainty, setInitialUncertainty] = useState<number | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Inspection Modal State
  const [inspectedRefuelling, setInspectedRefuelling] = useState<Refuelling | null>(null);

  // Ensure legacy persistent session tokens are removed on application mount
  useEffect(() => {
    try {
      localStorage.removeItem('fueltrust_auth_user');
      sessionStorage.clear();
    } catch {
      // ignore
    }
  }, []);

  // Login handler - In-memory session for current page lifecycle only
  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('fueltrust_auth_user');
      sessionStorage.clear();
    } catch {
      // ignore
    }
  };

  // Unified Data Fetcher
  const loadAllData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setBackendError(null);

      const [dashRes, vehRes, refRes, devRes, setRes, anaRes] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getVehicles().catch(() => []),
        api.getRefuellings().catch(() => []),
        api.getDeviceStatus().catch(() => null),
        api.getSettings().catch(() => null),
        api.getAnalytics().catch(() => null),
      ]);

      if (dashRes) setDashboardData(dashRes);
      if (vehRes) setVehicles(vehRes);
      if (refRes) setRefuellings(refRes);
      if (devRes) setDeviceStatus(devRes);
      if (setRes) setSettings(setRes);
      if (anaRes) setAnalyticsData(anaRes);

    } catch (err: any) {
      setBackendError(err.message || 'Unable to connect to FuelTrust API service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Handle refuelling delete
  const handleDeleteRefuelling = async (id: number) => {
    try {
      await api.deleteRefuelling(id);
      loadAllData(true);
      if (inspectedRefuelling?.id === id) {
        setInspectedRefuelling(null);
      }
    } catch (err: any) {
      alert(`Could not delete refuelling: ${err.message}`);
    }
  };

  const handleTransferToVerify = (volume: number, uncertainty?: number) => {
    setInitialMeasuredVolume(volume);
    if (uncertainty !== undefined) {
      setInitialUncertainty(uncertainty);
    }
    setActiveTab('verify');
  };

  // 0. If not logged in, show Login Screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deviceOnline={Boolean(deviceStatus)}
      />

      {/* 2. Main Application Flow */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          user={user}
          onLogout={handleLogout}
          onNewVerification={() => {
            setInitialMeasuredVolume(null);
            setInitialUncertainty(null);
            setActiveTab('verify');
          }}
          onRefresh={() => loadAllData(true)}
          isRefreshing={isRefreshing}
        />

        {/* Global Connection / Backend Error Notice */}
        {backendError && (
          <div className="mx-8 mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">Backend Connection Alert: </span>
                <span>{backendError}</span>
              </div>
            </div>
            <button
              onClick={() => loadAllData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Screen View */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              data={dashboardData}
              loading={isLoading}
              onSelectRefuelling={(r) => setInspectedRefuelling(r)}
              onNavigateVerify={() => {
                setInitialMeasuredVolume(null);
                setInitialUncertainty(null);
                setActiveTab('verify');
              }}
              onNavigateHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'live-measurement' && (
            <LiveMeasurementScreen
              onTransferToVerify={handleTransferToVerify}
            />
          )}

          {activeTab === 'verify' && (
            <VerificationScreen
              vehicles={vehicles}
              defaultThreshold={settings?.verification_threshold || 2.0}
              initialMeasuredVolume={initialMeasuredVolume}
              initialUncertainty={initialUncertainty}
              onVerificationSaved={() => {
                setInitialMeasuredVolume(null);
                setInitialUncertainty(null);
                loadAllData(true);
                setActiveTab('history');
              }}
            />
          )}

          {activeTab === 'calibration' && (
            <CalibrationScreen />
          )}

          {activeTab === 'history' && (
            <HistoryScreen
              refuellings={refuellings}
              vehicles={vehicles}
              onSelectRefuelling={(r) => setInspectedRefuelling(r)}
              onDeleteRefuelling={handleDeleteRefuelling}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsScreen
              data={analyticsData}
              loading={isLoading}
              vehicles={vehicles}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesScreen
              vehicles={vehicles}
              onRefresh={() => loadAllData(true)}
            />
          )}

          {activeTab === 'device' && (
            <DeviceScreen
              deviceStatus={deviceStatus}
              onRefreshStatus={() => loadAllData(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSettingsUpdated={() => loadAllData(true)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* 3. Global Inspection Detail Modal */}
      {inspectedRefuelling && (
        <VerificationDetailModal
          refuelling={inspectedRefuelling}
          onClose={() => setInspectedRefuelling(null)}
          onDelete={handleDeleteRefuelling}
        />
      )}
    </div>
  );
};

export default App;
