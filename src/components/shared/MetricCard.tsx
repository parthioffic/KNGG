import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  tamilTitle?: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  tamilTitle,
  value,
  subValue,
  icon: Icon,
  variant = 'default',
  className,
  onClick,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          iconBg: 'bg-emerald-600 text-white',
          value: 'text-emerald-900',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          iconBg: 'bg-amber-600 text-white',
          value: 'text-amber-900',
        };
      case 'danger':
        return {
          bg: 'bg-red-50 border-red-200',
          iconBg: 'bg-red-600 text-white',
          value: 'text-red-900',
        };
      case 'default':
      default:
        return {
          bg: 'bg-white border-slate-200',
          iconBg: 'bg-forest-800 text-white',
          value: 'text-slate-900',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-xl border shadow-sm transition-all duration-150',
        colors.bg,
        onClick && 'cursor-pointer hover:shadow-md hover:border-forest-600',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title} {tamilTitle && <span className="text-xs text-slate-400 font-tamil">({tamilTitle})</span>}
          </p>
          <h3 className={cn('text-2xl font-bold tracking-tight mt-1 font-mono', colors.value)}>
            {value}
          </h3>
          {subValue && (
            <p className="text-xs text-slate-600 mt-1 font-medium">{subValue}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg flex items-center justify-center shadow-sm', colors.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
