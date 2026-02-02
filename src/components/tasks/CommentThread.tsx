import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Comment, CommentAuthor } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  currentUser: CommentAuthor;
  variant?: 'default' | 'panel';
}

export function CommentThread({ 
  comments, 
  onAddComment, 
  onAddReply,
  currentUser,
  variant = 'default'
}: CommentThreadProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleAddComment = (text: string) => {
    onAddComment(text);
    setShowCommentForm(false);
  };

  // Panel variant: Optimized for side sheet
  if (variant === 'panel') {
    return (
      <div className="flex flex-col h-full">
        {/* Comments List */}
        <div className="flex-1 space-y-6 min-h-0">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
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

        {/* Sticky Comment Form at Bottom */}
        <div className="pt-4 mt-4 border-t bg-background sticky bottom-0">
          {showCommentForm ? (
            <CommentForm
              onSubmit={handleAddComment}
              onCancel={() => setShowCommentForm(false)}
              placeholder="Write a comment..."
              submitLabel="Replay"
            />
          ) : (
             <Button
              className="w-full justify-start text-muted-foreground"
              variant="outline"
              onClick={() => setShowCommentForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Write a comment...
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Collapsed state: No comments and form not open (Default Variant)
  if (comments.length === 0 && !showCommentForm) {
    return (
      <div className="flex justify-end px-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setShowCommentForm(true)}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h4 className="font-semibold text-foreground">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h4>
        </div>
        {!showCommentForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Comment
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <CommentForm
          onSubmit={handleAddComment}
          onCancel={() => setShowCommentForm(false)}
          placeholder="Share your thoughts or ask a question..."
          submitLabel="Post Comment"
        />
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-4 mt-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={onAddReply}
              currentUserIsAdmin={currentUser.isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
