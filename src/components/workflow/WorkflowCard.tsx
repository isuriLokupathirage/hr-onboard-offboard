import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { Workflow } from '@/types/workflow';
import { StatusBadge, WorkflowTypeBadge, ProgressBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const navigate = useNavigate();

  const totalTasks = workflow.stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = workflow.stages.reduce(
    (acc, stage) => acc + stage.tasks.filter((t) => t.status === 'Done').length,
    0
  );

  const dateLabel = workflow.type === 'Onboarding' ? 'Start Date' : 'End Date';
  const date = workflow.type === 'Onboarding' 
    ? workflow.employee.startDate 
    : workflow.employee.endDate;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-all duration-200 cursor-pointer group',
        workflow.status === 'Completed' && 'opacity-75'
      )}
      onClick={() => navigate(`/workflows/${workflow.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
              {workflow.employee.name}
            </h3>
            <p className="text-sm text-muted-foreground">{workflow.employee.position}</p>
          </div>
        </div>
        <WorkflowTypeBadge type={workflow.type} />
      </div>

      {/* Client */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Client:</span>
        <span className="text-sm font-medium text-foreground">{workflow.client.name}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{completedTasks} of {totalTasks} tasks</span>
        </div>
        <ProgressBar value={completedTasks} max={totalTasks} size="md" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <StatusBadge status={workflow.status} />
          {date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {dateLabel}: {new Date(date).toLocaleDateString()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
