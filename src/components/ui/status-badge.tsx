import { cn } from '@/lib/utils';
import { TaskStatus, WorkflowStatus, WorkflowType } from '@/types/workflow';
import { Check, Clock, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | WorkflowStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isDone = status === 'Done' || status === 'Completed';
  const isNeedInfo = status === 'Need Info';
  const isCancelled = status === 'Cancelled';
  const isOpen = status === 'Open';

  return (
    <span
      className={cn(
        'status-badge',
        isDone ? 'status-done' : isNeedInfo ? 'bg-info/15 text-info' : isCancelled ? 'bg-muted text-muted-foreground' : isOpen ? 'status-pending' : 'bg-warning/15 text-warning',
        className
      )}
    >
      {isDone ? (
        <Check className="w-3 h-3" />
      ) : isNeedInfo ? (
        <AlertCircle className="w-3 h-3" />
      ) : isCancelled ? (
        <Ban className="w-3 h-3" />
      ) : isOpen ? (
        <Clock className="w-3 h-3 text-muted-foreground" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {status}
    </span>
  );
}

interface WorkflowTypeBadgeProps {
  type: WorkflowType;
  className?: string;
}

export function WorkflowTypeBadge({ type, className }: WorkflowTypeBadgeProps) {
  const isOnboarding = type === 'Onboarding';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        isOnboarding
          ? 'bg-accent/15 text-accent'
          : 'bg-primary/10 text-primary',
        className
      )}
    >
      {isOnboarding ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {type}
    </span>
  );
}

interface ProgressBadgeProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBadge({ completed, total, className }: ProgressBadgeProps) {
  const isComplete = completed === total;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        isComplete
          ? 'bg-success/15 text-success'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Loader2 className="w-3 h-3" />
      )}
      {completed}/{total} Tasks
    </span>
  );
}
