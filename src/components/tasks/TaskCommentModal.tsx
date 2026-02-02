
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Task, Workflow, CommentAuthor } from "@/types/workflow";
import { format } from "date-fns";
import { CommentItem } from './CommentItem';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from 'lucide-react';

interface TaskCommentModalProps {
  task: Task | null;
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: CommentAuthor;
  onAddComment: (text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
}

export function TaskCommentModal({
  task,
  workflow,
  isOpen,
  onClose,
  currentUser,
  onAddComment,
  onAddReply
}: TaskCommentModalProps) {
  const [newComment, setNewComment] = useState("");

  if (!task || !workflow) return null;

  const handleSave = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment("");
      // Keep modal open to show the new comment
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Comment</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
             <div>
                <span className="font-semibold block text-foreground">Project:</span>
                <span className="text-muted-foreground">{workflow.client.name}</span>
             </div>
             <div>
               <span className="font-semibold block text-foreground">Activity:</span>
               <span className="text-muted-foreground">{task.name}</span>
             </div>

          </div>

          <div className="flex-1 overflow-hidden flex flex-col border-t border-b bg-muted/5">
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
                            <p className="text-sm">No comments yet</p>
                        </div>
                    )}
                 </div>
             </ScrollArea>
          </div>

          <div className="p-6 space-y-4 bg-background">
              <div>
                  <label className="font-semibold text-sm mb-2 block text-foreground">Comment</label>
                  <Textarea
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     placeholder="Add a comment..."
                     className="min-h-[100px] resize-none focus-visible:ring-amber-500"
                     maxLength={1000} 
                   />
                   <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted-foreground">{newComment.length}/1000</span>
                   </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                 <Button variant="outline" onClick={onClose} className="w-32">Cancel</Button>
                 <Button 
                    onClick={handleSave} 
                    className="w-40 bg-amber-500 hover:bg-amber-600 text-white" 
                    disabled={!newComment.trim()}
                 >
                    Save Comment
                 </Button>
              </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
