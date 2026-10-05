import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AuthUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@fueltrust.com');
  const [password, setPassword] = useState<string>('fueltrust');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('admin@fueltrust.com');
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanEmail || !cleanPass) {
        setError('Please enter your email or username and password.');
        setIsLoading(false);
        return;
      }

      if ((cleanEmail === 'admin@fueltrust.com' || cleanEmail === 'demo@fueltrust.com') && cleanPass === 'fueltrust') {
        const user: AuthUser = {
          email: cleanEmail,
          name: 'Lead Fuel Inspector',
          role: 'Fleet Metrology Lead'
        };
        onLoginSuccess(user);
      } else if (cleanPass.length >= 4) {
        const displayName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ') || 'Fleet Inspector';
        const user: AuthUser = {
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@fueltrust.com`,
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          role: 'Operations Specialist'
        };
        onLoginSuccess(user);
      } else {
        setError('Invalid credentials. Please verify your username and password.');
        setIsLoading(false);
      }
    }, 350);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* Subtle Background Radial Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10 mb-1">
            <Shield size={28} className="stroke-[2.2] text-white" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              FuelTrust
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Smart Fuel Verification & Vehicle Efficiency Monitoring
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email / Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fueltrust.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-mono"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-mono"
              />
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs shadow-md shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Login'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Security / System Footer */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-1">
          <p className="text-[11px] text-slate-400">
            Enterprise Grade Fuel Auditing & Metrology Platform
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Password Recovery
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1 text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-1" />
                <p className="font-bold">Reset Instructions Sent</p>
                <p className="text-[11px] text-emerald-700">
                  Password reset verification has been dispatched to your email address.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered work email to receive password reset instructions.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
