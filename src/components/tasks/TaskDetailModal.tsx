
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Task, Workflow, TaskStatus, CommentAuthor } from "@/types/workflow";
import { format } from "date-fns";
import { CommentItem } from './CommentItem';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    MessageSquare, 
    Calendar, 
    Flag, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Building2, 
    User,
    UserPlus,
    UserMinus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from './PriorityBadge';

interface TaskDetailModalProps {
  task: Task | null;
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: CommentAuthor;
  onAddComment: (text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  onStatusChange: (status: TaskStatus, note?: string) => void;
  isAvailable?: boolean;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  'Open': { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  'In Progress': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  'Done': { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  'Need Info': { icon: AlertCircle, color: 'text-info', bg: 'bg-info/10' },
};

export function TaskDetailModal({
  task,
  workflow,
  isOpen,
  onClose,
  currentUser,
  onAddComment,
  onAddReply,
  onStatusChange,
  isAvailable = true
}: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState("");

  if (!task || !workflow) return null;

  const handleSaveComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  const StatusIcon = statusConfig[task.status]?.icon || Clock;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] gap-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between gap-4 pr-8">
                <div className="space-y-1">
                    <DialogTitle className="text-xl font-semibold">{task.name}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                             <User className="w-3.5 h-3.5" />
                             {workflow.employee.name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                             <Building2 className="w-3.5 h-3.5" />
                             {workflow.client.name}
                        </span>
                        <span>•</span>
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
                </div>
                

            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
             {/* Left Column: Details */}
             <div className="w-full md:w-2/5 p-6 border-b md:border-b-0 md:border-r bg-muted/5 space-y-6 overflow-y-auto">
                 
                 {task.description && (
                     <div>
                         <h4 className="font-semibold text-sm mb-2 text-foreground">Description</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">
                            {task.description}
                         </p>
                     </div>
                 )}

                 <div className="space-y-4">
                     <h4 className="font-semibold text-sm text-foreground">Details</h4>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Flag className="w-3 h-3" /> Priority
                             </span>
                             <div>
                                <PriorityBadge priority={task.priority} />
                             </div>
                         </div>
                         
                         <div className="space-y-1">
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Calendar className="w-3 h-3" /> Due Date
                             </span>
                             <p className="text-sm font-medium">
                                 {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                             </p>
                         </div>

                         <div className="space-y-1">
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Building2 className="w-3 h-3" /> Department
                             </span>
                             <p className="text-sm font-medium">
                                 {task.department}
                             </p>
                         </div>

                         <div className="space-y-1">
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                                 <StatusIcon className="w-3 h-3" /> Status
                             </span>
                             <div>
                                 <Select
                                    value={(task.status as string) === 'Completed' ? 'Done' : task.status}
                                    onValueChange={(value) => onStatusChange(value as TaskStatus)}
                                    disabled={!isAvailable}
                                  >
                                    <SelectTrigger className={cn("w-full h-8 text-xs", 
                                      statusConfig[(task.status as string) === 'Completed' ? 'Done' : task.status]?.bg && "border-transparent " + statusConfig[(task.status as string) === 'Completed' ? 'Done' : task.status]?.bg,
                                      statusConfig[(task.status as string) === 'Completed' ? 'Done' : task.status]?.color || "text-foreground"
                                    )}>
                                      <div className="flex items-center gap-2 w-full">
                                         <span className="truncate">{(task.status as string) === 'Completed' ? 'Done' : task.status}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Open">Open</SelectItem>
                                      <SelectItem value="In Progress">In Progress</SelectItem>
                                      <SelectItem value="Done">Done</SelectItem>
                                      <SelectItem value="Need Info">Need Info</SelectItem>
                                    </SelectContent>
                                  </Select>
                             </div>
                         </div>
                     </div>
                 </div>

             </div>

             {/* Right Column: Comments */}
             <div className="flex-1 flex flex-col min-h-[300px]">
                 <div className="p-4 border-b bg-muted/10 font-medium text-sm flex items-center gap-2">
                     <MessageSquare className="w-4 h-4 text-muted-foreground" />
                     Activity & Comments
                 </div>
                 
                 <ScrollArea className="flex-1 p-6">
                     <div className="space-y-6">
                        {task.comments && task.comments.length > 0 ? (
                            task.comments.map(c => (
                                <CommentItem
                                    key={c.id}
                                    comment={c}
                                    onReply={onAddReply}
                                    currentUserIsAdmin={currentUser.isAdmin}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No activity yet</p>
                            </div>
                        )}
                     </div>
                 </ScrollArea>

                 <div className="p-4 border-t bg-background">
                      <div className="relative">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="min-h-[80px] resize-none pr-20 pb-10"
                            maxLength={1000} 
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                             <span className="text-xs text-muted-foreground">{newComment.length}/1000</span>
                             <Button 
                                size="sm"
                                onClick={handleSaveComment} 
                                disabled={!newComment.trim()}
                             >
                                Post
                             </Button>
                        </div>
                      </div>
                 </div>
             </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
