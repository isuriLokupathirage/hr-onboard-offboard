import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Priority } from '@/types/workflow';

const priorityConfig: Record<Priority, { color: string }> = {
  'High': { color: 'text-red-600' },
  'Medium': { color: 'text-yellow-600' },
  'Low': { color: 'text-green-600' },
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium",
      priorityConfig[priority]?.color,
      className
    )}>
      <Flag className="w-3 h-3" />
      {priority}
    </span>
  );
}
