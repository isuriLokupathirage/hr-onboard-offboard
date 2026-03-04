import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LibraryTask, REFERENCE_DATE_LABELS } from '@/types/workflow';
import { Calendar, Building2, FileText, Bell, Edit2 } from 'lucide-react';

interface LibraryTaskViewModalProps {
  task: LibraryTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LibraryTaskViewModal({ task, isOpen, onClose }: LibraryTaskViewModalProps) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Task Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-8 space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{task.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-full text-accent font-medium border border-accent/20">
                <Building2 className="w-3.5 h-3.5" />
                {task.department}
              </div>
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium border border-border">
                <Calendar className="w-3.5 h-3.5" />
                {task.dueDateConfig.type === 'none' && 'No Due Date'}
                {task.dueDateConfig.type === 'on-date' && `On ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
                {task.dueDateConfig.type === 'relative' && `${task.dueDateConfig.days} ${task.dueDateConfig.unit} ${task.dueDateConfig.direction} ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
              </div>
            </div>
          </div>

          {task.description && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Notification Pulse</Label>
            <div className="flex items-center gap-2 text-sm text-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
              <Bell className="w-4 h-4 text-primary" />
              <span>{task.notificationConfig}</span>
            </div>
          </div>

          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Attachments</Label>
              <div className="grid grid-cols-1 gap-2">
                {task.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-accent/30 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate">{file}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/5">View</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/5">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl hover:bg-muted font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
