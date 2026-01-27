import { useState } from 'react';
import { Check, User, MoreVertical, Calendar } from 'lucide-react';
import { Task, Department } from '@/types/workflow';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onEdit?: (taskId: string) => void;
}

const departmentColors: Record<Department, string> = {
  HR: 'bg-purple-100 text-purple-700 border-purple-200',
  IT: 'bg-blue-100 text-blue-700 border-blue-200',
  Finance: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function TaskCard({ task, onStatusChange, onEdit }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDone = task.status === 'Done';

  const handleToggleStatus = () => {
    onStatusChange?.(task.id, isDone ? 'Pending' : 'Done');
  };

  return (
    <div
      className={cn(
        'task-card group animate-fade-in',
        isDone && 'opacity-75'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleStatus}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            isDone
              ? 'bg-success border-success text-success-foreground'
              : 'border-border hover:border-accent'
          )}
        >
          {isDone && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm font-medium text-foreground',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.name}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                    isHovered && 'opacity-100'
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(task.id)}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  Mark as {isDone ? 'Pending' : 'Done'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Department Badge */}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                departmentColors[task.department]
              )}
            >
              {task.department}
            </span>

            {/* Assignee */}
            {task.assignedTo && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {task.assignedTo.name}
              </span>
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
