import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { VerificationStatus } from '../types';

interface StatusBadgeProps {
  status: VerificationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const isVerified = status.toUpperCase() === 'VERIFIED';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  if (isVerified) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 tracking-wide font-medium shadow-xs ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 shrink-0" />}
        <span>VERIFIED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide font-medium shadow-xs ${sizeClasses[size]}`}
    >
      {showIcon && <AlertTriangle size={iconSizes[size]} className="text-amber-600 shrink-0" />}
      <span>REVIEW</span>
    </span>
  );
};
