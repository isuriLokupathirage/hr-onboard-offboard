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
  Send,
  Lock,
  Flag
} from 'lucide-react';
import { Task, Stage, Workflow, TaskStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { TaskCommentModal } from './TaskCommentModal';
import { addCommentToTask, addReplyToComment } from '@/lib/storage';
import { currentUser } from '@/data/mockData';
import { TaskActionModal } from './TaskActionModal';

interface TaskExecutionCardProps {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  isAvailable?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus, note?: string, output?: any) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'Not Started': { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  'In Progress': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  'Completed': { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  'Need Information': { icon: AlertCircle, color: 'text-info', bg: 'bg-info/10' },
  'Blocked': { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function TaskExecutionCard({ task, workflow, stage, isAvailable = true, onStatusChange }: TaskExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  // Normalize legacy statuses to prevent crashes
  const normalizedStatus = (status: string): TaskStatus => {
    if (status === 'Done') return 'Completed';
    if (status === 'Pending') return 'In Progress';
    return status as TaskStatus;
  };

  const [localStatus, setLocalStatus] = useState<TaskStatus>(normalizedStatus(task.status));
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  
  const StatusIcon = statusConfig[localStatus].icon;
  const isDone = localStatus === 'Completed';

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'Completed' && (task.actionType === 'CREATE_CREDENTIALS' || task.actionType === 'COLLECT_DOCUMENTS')) {
      setShowActionModal(true);
      return;
    }

    setLocalStatus(newStatus);
    if (newStatus !== 'Need Information') {
      onStatusChange(task.id, newStatus, note || undefined);
      setNote('');
      setIsExpanded(false);
    }
  };



  const handleSubmitWithNote = () => {
    // Require note for "Need Information" status
    if (localStatus === 'Need Information' && !note.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please provide a comment explaining what information is needed.',
        variant: 'destructive',
      });
      return;
    }
    
    onStatusChange(task.id, localStatus, note);
    setNote('');
    setIsExpanded(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Main Content */}
      <div className={cn(
        "p-4",
        !isAvailable && "opacity-60 grayscale-[0.5] cursor-not-allowed"
      )}>
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

              {!isAvailable && (
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              )}
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
                task.department === 'Finance' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                task.department === 'Marketing' && 'bg-orange-100 text-orange-700 border-orange-200'
              )}>
                {task.department}
              </span>
              {task.priority && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                  task.priority === 'High' && 'bg-red-50 text-red-700 border-red-200',
                  task.priority === 'Medium' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  task.priority === 'Low' && 'bg-green-50 text-green-700 border-green-200',
                )}>
                   <Flag className="w-3 h-3" />
                  {task.priority}
                </span>
              )}
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
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentModal(true)}
            className="text-muted-foreground hover:text-primary mr-auto"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {task.comments && task.comments.length > 0 ? `Comments (${task.comments.length})` : 'Comments'}
          </Button>

          <Button
            variant={localStatus === 'Completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('Completed')}
            disabled={!isAvailable}
            className={cn(
              localStatus === 'Completed' && 'bg-success hover:bg-success/90'
            )}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Done
          </Button>
          <Button
            variant={localStatus === 'In Progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('In Progress')}
            disabled={isDone || !isAvailable}
            className={cn(
              localStatus === 'In Progress' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
              (isDone || !isAvailable) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Clock className="w-4 h-4 mr-1" />
            In Progress
          </Button>
          <Button
            variant={localStatus === 'Need Information' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (!isDone && isAvailable) {
                setLocalStatus('Need Information');
                setIsExpanded(true);
              }
            }}
            disabled={isDone || !isAvailable}
            className={cn(
              localStatus === 'Need Information' && 'bg-info hover:bg-info/90 text-info-foreground',
              (isDone || !isAvailable) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Need Info
          </Button>
          

        </div>
      </div>

      {/* Expanded Note Section */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4">
            <Textarea
              placeholder={
                localStatus === 'Need Information'
                  ? "Required: Explain what information is needed..."
                  : "Add a note or comment about this task..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmitWithNote}
                disabled={localStatus === 'Need Information' && !note.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}


      <TaskActionModal
        task={task}
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onSubmit={(status, not, output) => {
          onStatusChange(task.id, status, not, output);
          setLocalStatus(status);
          setIsExpanded(false);
        }}
      />
      {/* Comment Modal */}
      <TaskCommentModal
        task={task}
        workflow={workflow}
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        currentUser={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isAdmin: !!currentUser.isAdmin, // Ensure boolean
          avatar: currentUser.avatar
        }}
        onAddComment={(text) => {
             addCommentToTask(workflow.id, task.id, text, {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              isAdmin: !!currentUser.isAdmin,
              avatar: currentUser.avatar
            });
             window.dispatchEvent(new Event('workflowsUpdated'));
        }}
        onAddReply={(commentId, text) => {
             addReplyToComment(workflow.id, task.id, commentId, text, {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              isAdmin: !!currentUser.isAdmin,
              avatar: currentUser.avatar
            });
             window.dispatchEvent(new Event('workflowsUpdated'));
        }}
      />
    </div>
  );
}
