import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

const variantStyles = {
  default: 'bg-card border-border',
  accent: 'bg-accent/10 border-accent/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  accent: 'bg-accent/20 text-accent',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
};

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-white p-6 transition-all hover:shadow-card-hover flex items-center justify-between',
      )}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-2">Total {title.toLowerCase()}</p>
      </div>
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center', 
        variantStyles[variant] === 'default' ? 'bg-muted/50 text-muted-foreground' : 
        variant === 'accent' ? 'bg-blue-100 text-blue-600' :
        variant === 'success' ? 'bg-green-100 text-green-600' :
        variant === 'warning' ? 'bg-orange-100 text-orange-600' :
        'bg-purple-100 text-purple-600'
      )}>
        {icon}
      </div>
    </div>
  );
}
