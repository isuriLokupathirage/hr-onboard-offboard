import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Stage, Task } from '@/types/workflow';
import { TaskCard } from './TaskCard';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StageColumnProps {
  stage: Stage;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  onAddTask?: (stageId: string) => void;
  variant?: 'kanban' | 'accordion';
}

export function StageColumn({
  stage,
  onTaskStatusChange,
  onAddTask,
  variant = 'kanban',
}: StageColumnProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedTasks = stage.tasks.filter((t) => t.status === 'Done').length;
  const totalTasks = stage.tasks.length;

  if (variant === 'accordion') {
    return (
      <div className="stage-card overflow-hidden animate-fade-in">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-foreground text-left">
                {stage.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressBar
              value={completedTasks}
              max={totalTasks}
              className="w-24"
              size="sm"
            />
            <span
              className={cn(
                'text-sm font-medium',
                completedTasks === totalTasks
                  ? 'text-success'
                  : 'text-muted-foreground'
              )}
            >
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-3 border-t border-border">
            {stage.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onTaskStatusChange}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask?.(stage.id)}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stage-card flex flex-col h-full min-w-[320px] max-w-[360px] animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <ProgressBar value={completedTasks} max={totalTasks} size="sm" />
      </div>

      {/* Tasks */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {stage.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
          />
        ))}
      </div>

      {/* Add Task */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask?.(stage.id)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
