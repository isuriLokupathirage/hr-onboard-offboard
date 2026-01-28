import { useState } from 'react';
import { 
  User, 
  Building2, 
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Task, Stage, Workflow, TaskStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskKanbanCardProps {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  onStatusChange: (taskId: string, status: TaskStatus, note?: string) => void;
}

export function TaskKanbanCard({ task, workflow, stage, onStatusChange }: TaskKanbanCardProps) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);
  const isDone = localStatus === 'Done';

  const handleStatusChange = (newStatus: TaskStatus) => {
    setLocalStatus(newStatus);
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
      {/* Task Name */}
      <h4 className="font-medium text-sm text-foreground mb-2">{task.name}</h4>
      
      {/* Employee & Client */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {workflow.employee.name}
        </span>
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {workflow.client.name}
        </span>
      </div>

      {/* Stage & Type */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
          {stage.name}
        </span>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
          workflow.type === 'Onboarding' 
            ? 'bg-accent/10 text-accent' 
            : 'bg-warning/10 text-warning'
        )}>
          {workflow.type === 'Onboarding' ? (
            <UserPlus className="w-3 h-3" />
          ) : (
            <UserMinus className="w-3 h-3" />
          )}
          {workflow.type}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-border">
        <Button
          variant={localStatus === 'Done' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusChange('Done')}
          className={cn(
            'flex-1 h-7 text-xs',
            localStatus === 'Done' && 'bg-success hover:bg-success/90'
          )}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Done
        </Button>
        <Button
          variant={localStatus === 'Pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusChange('Pending')}
          disabled={isDone}
          className={cn(
            'flex-1 h-7 text-xs',
            localStatus === 'Pending' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
            isDone && 'opacity-50'
          )}
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Button>
        <Button
          variant={localStatus === 'Need Information' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusChange('Need Information')}
          disabled={isDone}
          className={cn(
            'flex-1 h-7 text-xs',
            localStatus === 'Need Information' && 'bg-info hover:bg-info/90 text-info-foreground',
            isDone && 'opacity-50'
          )}
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Need Info
        </Button>
      </div>
    </div>
  );
}
