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
import { Task, Stage, Workflow, TaskStatus, Priority } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { TaskCommentModal } from './TaskCommentModal';
import { PriorityBadge } from './PriorityBadge';
import { addCommentToTask, addReplyToComment } from '@/lib/storage';
import { currentUser } from '@/data/mockData';


interface TaskExecutionCardProps {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  isAvailable?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus, note?: string, output?: any) => void;
  onClick?: () => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'Open': { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  'In Progress': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  'Done': { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  'Need Info': { icon: AlertCircle, color: 'text-info', bg: 'bg-info/10' },
};



export function TaskExecutionCard({ task, workflow, stage, isAvailable = true, onStatusChange, onClick }: TaskExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  // Normalize legacy statuses to prevent crashes
  const normalizedStatus = (status: string): TaskStatus => {
    if (status === 'Completed') return 'Done';
    if (status === 'Pending') return 'In Progress';
    if (status === 'Not Started') return 'Open';
    if (status === 'Need Information') return 'Need Info';
    return status as TaskStatus;
  };

  const [localStatus, setLocalStatus] = useState<TaskStatus>(normalizedStatus(task.status));
  const [showCommentModal, setShowCommentModal] = useState(false);
  
  const StatusIcon = statusConfig[localStatus]?.icon || Clock;
  const isDone = localStatus === 'Done';

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'Need Info') {
      setLocalStatus('Need Info');
      setIsExpanded(true);
      return;
    }

    setLocalStatus(newStatus);
    onStatusChange(task.id, newStatus, note || undefined);
    setNote('');
    setIsExpanded(false);
  };


  const handleSubmitWithNote = () => {
    // Require note for "Need Information" status
    // Require note for "Need Info" status
    if (localStatus === 'Need Info' && !note.trim()) {
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
    <div 
      className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => isAvailable && onClick?.()}
    >
      {/* Main Content */}
      <div className={cn(
        "p-3",
        !isAvailable && "opacity-60 grayscale-[0.5] cursor-not-allowed"
      )}>
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            statusConfig[localStatus]?.bg || 'bg-muted'
          )}>
            <StatusIcon className={cn('w-4 h-4', statusConfig[localStatus]?.color || 'text-muted-foreground')} />
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0 grid grid-cols-[1fr,auto] gap-4 items-center">
            <div>
              <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-foreground text-sm">{task.name}</h3>
                     {/* Workflow Type Badge */}
                     <div className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1',
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
                  {task.description && (
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  {workflow.employee.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  {workflow.client.name}
                </span>
                {task.priority && (
                  <PriorityBadge priority={task.priority} />
                )}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions Right Side */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>


                <div className="w-[140px]">
                  <Select
                    value={localStatus}
                    onValueChange={(value) => handleStatusChange(value as TaskStatus)}
                    disabled={!isAvailable}
                  >
                    <SelectTrigger className={cn("h-8 text-xs", 
                      statusConfig[localStatus]?.bg && "border-transparent " + statusConfig[localStatus]?.bg,
                      statusConfig[localStatus]?.color || "text-foreground"
                    )}>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Open</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="In Progress">
                        <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-warning" />
                           <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Done">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          <span>Done</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Need Info">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-info" />
                          <span>Need Info</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

             
          </div>
        </div>
      </div>

      {/* Expanded Note Section */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4">
            <Textarea
              placeholder={
                localStatus === 'Need Info'
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
                disabled={localStatus === 'Need Info' && !note.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}



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
