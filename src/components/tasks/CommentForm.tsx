import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentFormProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
}

export function CommentForm({ 
  onSubmit, 
  onCancel, 
  placeholder = "Add a comment...",
  submitLabel = "Post Comment",
  isReply = false
}: CommentFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={isReply ? "ml-12 mt-2" : "mt-3"}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          <Send className="w-4 h-4 mr-1" />
          {submitLabel}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Press Ctrl+Enter to submit
      </p>
    </div>
  );
}
