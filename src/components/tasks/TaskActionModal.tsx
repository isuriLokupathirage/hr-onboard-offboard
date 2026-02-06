import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Task, TaskStatus } from '@/types/workflow';
import { Lock, Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskActionModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: TaskStatus, note?: string, output?: any) => void;
}

export function TaskActionModal({ task, isOpen, onClose, onSubmit }: TaskActionModalProps) {
  const [note, setNote] = useState(task.notes || '');
  
  // Credentials State
  const [email, setEmail] = useState(task.outputValue?.email || '');
  const [password, setPassword] = useState(task.outputValue?.password || '');
  
  // Documents State
  const [documents, setDocuments] = useState<Array<{ name: string; url?: string; uploadedAt: string }>>(
    task.outputValue?.documents || []
  );
  const [fileName, setFileName] = useState('');

  // Reset state when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setNote(task.notes || '');
      setEmail(task.outputValue?.email || '');
      setPassword(task.outputValue?.password || '');
      setDocuments(task.outputValue?.documents || []);
    }
  }, [isOpen, task]);

  const handleDocumentAdd = () => {
    if (!fileName.trim()) return;
    
    // Simulate upload
    const newDoc = {
      name: fileName,
      url: '#', // In a real app, this would be the uploaded file URL
      uploadedAt: new Date().toISOString()
    };
    
    setDocuments([...documents, newDoc]);
    setFileName('');
  };

  const handleDocumentRemove = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    let output: any = {};

    if (task.actionType === 'CREATE_CREDENTIALS') {
      output = { email, password };
    } else if (task.actionType === 'COLLECT_DOCUMENTS') {
      output = { documents };
    }

    onSubmit('Done', note, output);
    onClose();
  };

  if (!task.actionType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Task: {task.name}</DialogTitle>
          <DialogDescription>
            {task.actionType === 'CREATE_CREDENTIALS' && "Please enter the system credentials for the employee."}
            {task.actionType === 'COLLECT_DOCUMENTS' && "Please upload or attach the requested documents."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create Credentials Form */}
          {task.actionType === 'CREATE_CREDENTIALS' && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-4">
                  <Lock className="w-4 h-4" />
                  System Credentials
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employee Email</Label>
                    <Input
                      placeholder="e.g. john.smith@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Temporary Password</Label>
                    <Input
                      type="text"
                      placeholder="Enter initial password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collect Documents Form */}
          {task.actionType === 'COLLECT_DOCUMENTS' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2 font-medium text-sm mb-4">
                  <Upload className="w-4 h-4" />
                  Document Upload
                </div>
                
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFileName(file.name);
                          // In a real app, upload here. For now, auto-add.
                          const newDoc = {
                            name: file.name,
                            url: URL.createObjectURL(file), 
                            uploadedAt: new Date().toISOString()
                          };
                          setDocuments([...documents, newDoc]);
                          setFileName(''); // Clear state if we want to allow new uploads
                          // Reset input value to allow selecting same file again if needed
                          e.target.value = '';
                        }
                      }}
                    />
                    <Label 
                      htmlFor="file-upload"
                      className="flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm font-medium transition-colors w-full h-9"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Label>
                  </div>
                </div>

                {documents.length > 0 ? (
                  <ScrollArea className="h-[120px] rounded-md border bg-background p-2">
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justified-between bg-muted/50 p-2 rounded text-sm group">
                          <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <button 
                            onClick={() => handleDocumentRemove(index)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-background/50 rounded-md border border-dashed">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No documents added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note Section */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Completion Note (Optional)</Label>
            <Textarea
              placeholder="Add any additional context or remarks..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              (task.actionType === 'CREATE_CREDENTIALS' && (!email || !password)) ||
              (task.actionType === 'COLLECT_DOCUMENTS' && documents.length === 0)
            }
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
