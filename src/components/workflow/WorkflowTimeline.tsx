import { Check, Circle } from 'lucide-react';
import { Stage } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface WorkflowTimelineProps {
  stages: Stage[];
  currentStageIndex?: number;
}

export function WorkflowTimeline({ stages, currentStageIndex }: WorkflowTimelineProps) {
  // Calculate current stage based on completion
  const calculatedCurrentIndex = stages.findIndex((stage) =>
    stage.tasks.some((task) => task.status === 'Pending')
  );
  const activeIndex = currentStageIndex ?? calculatedCurrentIndex;

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2" />
        
        {/* Progress Line */}
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-accent -translate-y-1/2 transition-all duration-500"
          style={{
            width: activeIndex >= 0 
              ? `${(activeIndex / (stages.length - 1)) * 100}%` 
              : stages.every(s => s.tasks.every(t => t.status === 'Done')) 
                ? '100%' 
                : '0%',
          }}
        />

        {/* Stage Indicators */}
        {stages.map((stage, index) => {
          const isCompleted = stage.tasks.every((task) => task.status === 'Done');
          const isCurrent = index === activeIndex;
          const isPast = index < activeIndex || (isCompleted && !isCurrent);

          return (
            <div
              key={stage.id}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-success text-success-foreground'
                    : isCurrent
                    ? 'bg-accent text-accent-foreground ring-4 ring-accent/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="absolute top-12 text-center w-32">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {stage.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stage.tasks.filter((t) => t.status === 'Done').length}/{stage.tasks.length} tasks
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
