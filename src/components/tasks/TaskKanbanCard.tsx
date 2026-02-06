import { useState } from 'react';
import { 
  User, 
  Building2, 
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Flag,
  Calendar
} from 'lucide-react';
import { Task, Stage, Workflow, TaskStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


import { TaskCommentModal } from './TaskCommentModal';
import { addCommentToTask, addReplyToComment } from '@/lib/storage';
import { currentUser } from '@/data/mockData';
import { MessageSquare } from 'lucide-react';


interface TaskKanbanCardProps {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  isAvailable?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus, note?: string, output?: any) => void;
  onClick?: () => void;
}

export function TaskKanbanCard({ task, workflow, stage, isAvailable = true, onStatusChange, onClick }: TaskKanbanCardProps) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const isDone = localStatus === 'Done';

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!isAvailable) return;
    
    setLocalStatus(newStatus);
    onStatusChange(task.id, newStatus);
  };

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-3 shadow-sm transition-all hover:shadow-md cursor-pointer",
        !isAvailable && "opacity-60 grayscale-[0.5] cursor-not-allowed"
      )}
      onClick={() => isAvailable && onClick?.()}
    >
      {/* Task Name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-foreground">{task.name}</h4>
        {!isAvailable && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
      </div>
      
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

       {/* Priority & Date */}
       <div className="flex items-center gap-2 mb-3 flex-wrap">
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
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border">
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>


      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border mt-2">


         <div className="flex items-center gap-1">
          <Button
            variant={localStatus === 'Open' ? 'default' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('Open');
            }}
            disabled={isDone || !isAvailable}
            className={cn(
              'h-7 text-xs px-2',
              localStatus === 'Open' && 'bg-muted hover:bg-muted/90'
            )}
            title="Mark as Open"
          >
            <Clock className="w-3 h-3 text-muted-foreground" />
          </Button>
          <Button
            variant={localStatus === 'Done' ? 'default' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('Done');
            }}
            disabled={!isAvailable}
            className={cn(
              'h-7 text-xs px-2',
              localStatus === 'Done' && 'bg-success hover:bg-success/90'
            )}
            title="Mark as Done"
          >
            <CheckCircle2 className="w-3 h-3" />
          </Button>
          <Button
            variant={localStatus === 'In Progress' ? 'default' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('In Progress');
            }}
            disabled={isDone || !isAvailable}
            className={cn(
              'h-7 text-xs px-2',
              localStatus === 'In Progress' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
              (isDone || !isAvailable) && 'opacity-50'
            )}
             title="Mark as Pending"
          >
            <Clock className="w-3 h-3" />
          </Button>
          <Button
            variant={localStatus === 'Need Info' ? 'default' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange('Need Info');
            }}
            disabled={isDone || !isAvailable}
            className={cn(
              'h-7 text-xs px-2',
              localStatus === 'Need Info' && 'bg-info hover:bg-info/90 text-info-foreground',
              (isDone || !isAvailable) && 'opacity-50'
            )}
             title="Request Info"
          >
            <AlertCircle className="w-3 h-3" />
          </Button>
         </div>
      </div>
     
      
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
            // Force update or rely on parent reload could be tricky here without prop, 
            // but usually storage update + window event works if setup.
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

