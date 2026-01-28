import { useState } from 'react';
import { 
  User, 
  Building2, 
  Calendar, 
  MessageSquare, 
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';
import { Task, Stage, Workflow, TaskStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TaskExecutionCardProps {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  onStatusChange: (taskId: string, status: TaskStatus, note?: string) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'Pending': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  'Done': { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  'Need Information': { icon: AlertCircle, color: 'text-info', bg: 'bg-info/10' },
};

export function TaskExecutionCard({ task, workflow, stage, onStatusChange }: TaskExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);

  const StatusIcon = statusConfig[localStatus].icon;
  const isDone = localStatus === 'Done';

  const handleStatusChange = (newStatus: TaskStatus) => {
    setLocalStatus(newStatus);
    if (newStatus !== 'Need Information') {
      onStatusChange(task.id, newStatus, note || undefined);
      setNote('');
      setIsExpanded(false);
    }
  };

  const handleSubmitWithNote = () => {
    onStatusChange(task.id, localStatus, note);
    setNote('');
    setIsExpanded(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Indicator */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            statusConfig[localStatus].bg
          )}>
            <StatusIcon className={cn('w-5 h-5', statusConfig[localStatus].color)} />
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">{task.name}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    {workflow.employee.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    {workflow.client.name}
                  </span>
                </div>
              </div>

              {/* Workflow Type Badge */}
              <div className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1',
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
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                {stage.name}
              </span>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                task.department === 'HR' && 'bg-purple-100 text-purple-700 border-purple-200',
                task.department === 'IT' && 'bg-blue-100 text-blue-700 border-blue-200',
                task.department === 'Finance' && 'bg-emerald-100 text-emerald-700 border-emerald-200'
              )}>
                {task.department}
              </span>
              {task.dueDate && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant={localStatus === 'Done' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('Done')}
            className={cn(
              localStatus === 'Done' && 'bg-success hover:bg-success/90'
            )}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Done
          </Button>
          <Button
            variant={localStatus === 'Pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('Pending')}
            disabled={isDone}
            className={cn(
              localStatus === 'Pending' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
              isDone && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Button>
          <Button
            variant={localStatus === 'Need Information' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (!isDone) {
                setLocalStatus('Need Information');
                setIsExpanded(true);
              }
            }}
            disabled={isDone}
            className={cn(
              localStatus === 'Need Information' && 'bg-info hover:bg-info/90 text-info-foreground',
              isDone && 'opacity-50 cursor-not-allowed'
            )}
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Need Info
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Add Note
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Note Section */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4">
            <Textarea
              placeholder="Add a note or comment about this task..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitWithNote}>
                <Send className="w-4 h-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
