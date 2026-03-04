import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LibraryTask, Department, TaskCategory, DueDateConfig, Priority, ReferenceDate, REFERENCE_DATE_LABELS, ONBOARDING_REFERENCE_DATES, OFFBOARDING_REFERENCE_DATES, WorkflowType } from '@/types/workflow';
import { X, HelpCircle, Upload, FileText, Flag } from 'lucide-react';

interface LibraryTaskModalProps {
  task?: LibraryTask;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<LibraryTask, 'id' | 'createdAt' | 'updatedAt'> | LibraryTask) => void;
  workflowType?: WorkflowType | '';
}

const DEPARTMENTS: Department[] = ['HR', 'IT', 'Finance', 'Marketing', 'Legal'];

export function LibraryTaskModal({ task, isOpen, onClose, onSave, workflowType }: LibraryTaskModalProps) {
  const availableReferenceDates = workflowType === 'Offboarding' 
    ? OFFBOARDING_REFERENCE_DATES 
    : workflowType === 'Onboarding' 
      ? ONBOARDING_REFERENCE_DATES 
      : [...ONBOARDING_REFERENCE_DATES, ...OFFBOARDING_REFERENCE_DATES];
  const [name, setName] = useState('');
  const [assignTo, setAssignTo] = useState<string>('');
  const [dueDateType, setDueDateType] = useState<'none' | 'on-date' | 'relative'>('none');
  const [dueDays, setDueDays] = useState<string>('');
  const [dueUnit, setDueUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [dueDirection, setDueDirection] = useState<'before' | 'after'>('after');
  const [referenceDate, setReferenceDate] = useState<ReferenceDate>('hire-date');
  const [notificationConfig, setNotificationConfig] = useState('Soon After Task Is Imported');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setAssignTo(task.department);
      setDueDateType(task.dueDateConfig.type === 'on-hire' as any ? 'on-date' : task.dueDateConfig.type);
      setDueDays(task.dueDateConfig.days?.toString() || '');
      setDueUnit(task.dueDateConfig.unit || 'days');
      setDueDirection(task.dueDateConfig.direction || 'after');
      setReferenceDate(task.dueDateConfig.referenceDate || 'hire-date');
      setPriority(task.priority || 'Medium');
      setDescription(task.description);
      setAttachments(task.attachments || []);
    } else {
      setName('');
      setAssignTo('HR');
      setPriority('Medium');
      setDueDateType('none');
      setDueDays('');
      setDueUnit('days');
      setDueDirection('after');
      setReferenceDate(availableReferenceDates[0] || 'hire-date');
      setNotificationConfig('Soon After Task Is Imported');
      setDescription('');
      setAttachments([]);
    }
  }, [task, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(f => f.name);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const dueDateConfig: DueDateConfig = {
      type: dueDateType,
      days: dueDateType === 'relative' ? parseInt(dueDays) || 0 : undefined,
      unit: dueDateType === 'relative' ? dueUnit : undefined,
      direction: dueDateType === 'relative' ? dueDirection : undefined,
      referenceDate: dueDateType !== 'none' ? referenceDate : undefined,
    };

    const taskData = {
      ...(task && { id: task.id }),
      name,
      department: assignTo as Department,
      priority,
      category: 'Miscellaneous',
      allowFileUpload: false,
      dueDateConfig,
      notificationConfig,
      description,
      attachments,
    };

    onSave(taskData as any);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-primary">
            {task ? 'Edit Task' : 'Add Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Row 1: Name and Assignee */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Task Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Background Check" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Priority</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>High</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-blue-500 fill-blue-500" />
                    <span>Low</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date Config */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Due Date</Label>
            <RadioGroup 
              value={dueDateType} 
              onValueChange={(v: any) => setDueDateType(v)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="none" id="due-none" />
                <Label htmlFor="due-none" className="font-normal">None</Label>
              </div>
              <div className="flex items-center space-x-3 gap-2">
                <RadioGroupItem value="on-date" id="due-on-date" />
                <Label htmlFor="due-on-date" className="font-normal">On</Label>
                <Select 
                  value={referenceDate} 
                  onValueChange={(v: ReferenceDate) => setReferenceDate(v)}
                  disabled={dueDateType !== 'on-date' && dueDateType !== 'relative'}
                >
                  <SelectTrigger className="w-48 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReferenceDates.map((value) => (
                      <SelectItem key={value} value={value}>{REFERENCE_DATE_LABELS[value]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3 gap-2 flex-wrap">
                <RadioGroupItem value="relative" id="due-relative" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Input 
                    type="number" 
                    className="w-16 h-8 text-center" 
                    value={dueDays}
                    onChange={(e) => setDueDays(e.target.value)}
                    disabled={dueDateType !== 'relative'}
                  />
                  <Select 
                    value={dueUnit} 
                    onValueChange={(v: any) => setDueUnit(v)}
                    disabled={dueDateType !== 'relative'}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">days</SelectItem>
                      <SelectItem value="weeks">weeks</SelectItem>
                      <SelectItem value="months">months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={dueDirection} 
                    onValueChange={(v: any) => setDueDirection(v)}
                    disabled={dueDateType !== 'relative'}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after">after</SelectItem>
                      <SelectItem value="before">before</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">{REFERENCE_DATE_LABELS[referenceDate]}</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Send Assignment Notifications...</Label>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <Select value={notificationConfig} onValueChange={setNotificationConfig}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Soon After Task Is Imported">Soon After Task Is Assigned</SelectItem>
                <SelectItem value="Do Not Send">Do Not Send</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              className="resize-none h-24"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Attach File(s)</Label>
            
            {attachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{file}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div 
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors group relative"
            >
              <input 
                type="file" 
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PNG up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[100px]"
            onClick={handleSave}
            disabled={!name}
          >
            {task ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
