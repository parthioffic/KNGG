import React from 'react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStyle = () => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL':
      case 'CONFIRMED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNPAID':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'OPEN':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'Paid / செலுத்தியது';
      case 'PARTIAL':
        return 'Partial / மீதி உண்டு';
      case 'UNPAID':
        return 'Unpaid / செலுத்தவில்லை';
      case 'CONFIRMED':
        return 'Confirmed / முன்பதிவு';
      case 'COMPLETED':
        return 'Completed / முடிந்தது';
      case 'CANCELLED':
        return 'Cancelled / ரத்து';
      default:
        return status;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        getStyle(),
        className
      )}
    >
      {getLabel()}
    </span>
  );
};
