import { useState } from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import { Comment } from '@/types/workflow';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, text: string) => void;
  currentUserIsAdmin: boolean;
  depth?: number;
}

export function CommentItem({ 
  comment, 
  onReply, 
  currentUserIsAdmin,
  depth = 0 
}: CommentItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("group", depth > 0 && "ml-12 mt-3")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium text-sm",
          comment.author.isAdmin 
            ? "bg-gradient-to-br from-purple-500 to-purple-700" 
            : "bg-gradient-to-br from-blue-500 to-blue-700"
        )}>
          {comment.author.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-4 h-4" />
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {comment.author.name}
            </span>
            {comment.author.isAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {getTimeAgo(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
            {comment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">

            {comment.replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 text-xs"
              >
                {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>



          {/* Nested Replies */}
          {isExpanded && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  currentUserIsAdmin={currentUserIsAdmin}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
