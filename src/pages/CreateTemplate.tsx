import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, X, GripVertical, Check, FileText, Calendar, Flag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { users, clients, onboardingStageTemplates, offboardingStageTemplates } from '@/data/mockData';
import { WorkflowType, Department, WorkflowAction, Priority } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getTemplates, updateTemplate, getTemplateById } from '@/lib/storage';

interface NewTask {
  id: string;
  name: string;
  department: Department;
  assignedToId: string;
  actionType?: WorkflowAction;
  priority?: Priority;
  requiredDate?: string;
}

interface NewStage {
  id: string;
  name: string;
  order: number;
  tasks: NewTask[];
}

export default function CreateTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isEditing = !!id;

  const [step, setStep] = useState(1);
  const [templateName, setTemplateName] = useState('');
  const [clientId, setClientId] = useState('');
  const [workflowType, setWorkflowType] = useState<WorkflowType | ''>('');
  const [copyFromTemplate, setCopyFromTemplate] = useState<string>('');
  const [stages, setStages] = useState<NewStage[]>([]);
  const [templateNotFound, setTemplateNotFound] = useState(false);

  useEffect(() => {
    const targetId = id || duplicateId;
    if (targetId) {
      const template = getTemplateById(targetId);
      if (template) {
        setTemplateName(isEditing ? template.name : `${template.name} Copy`);
        setWorkflowType(template.type);
        setClientId(template.client.id);
        setStages(
          template.stages.map((s, i) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            tasks: s.tasks.map((t, j) => ({
              id: t.id,
              name: t.name,
              department: t.department,
              assignedToId: 'unassigned',
              actionType: t.actionType,
              priority: t.priority,
              requiredDate: t.requiredDate,
            })),
          }))
        );
      } else {
        setTemplateNotFound(true);
      }
    }
  }, [id, duplicateId, isEditing]);

  const availableTemplates = getTemplates().filter(
    (t) => t.type === workflowType
  );

  const handleTypeChange = (type: WorkflowType) => {
    setWorkflowType(type);
    setCopyFromTemplate('');
    const templates = type === 'Onboarding' ? onboardingStageTemplates : offboardingStageTemplates;
    setStages(
      templates.map((t: NewStage, i: number) => ({
        id: `stage-${Date.now()}-${i}`,
        name: t.name,
        order: i + 1,
        tasks: t.tasks.map((task: NewTask, j: number) => ({
          id: `task-${Date.now()}-${i}-${j}`,
          name: task.name,
          department: task.department,
          assignedToId: 'unassigned',
          actionType: task.actionType,
          priority: 'Medium',
          requiredDate: '',
        })),
      }))
    );
  };

  const handleCopyTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setStages(
        template.stages.map((s, i) => ({
          id: `stage-${Date.now()}-${i}`,
          name: s.name,
          order: i + 1,
          tasks: s.tasks.map((t, j) => ({
            id: `task-${Date.now()}-${i}-${j}`,
            name: t.name,
            department: t.department,
            assignedToId: 'unassigned',
            actionType: t.actionType,
            priority: t.priority,
            requiredDate: t.requiredDate,
          })),
        }))
      );
    }
  };

  const addStage = () => {
    const newStage: NewStage = {
      id: `stage-${Date.now()}-${stages.length}`,
      name: `Stage ${stages.length + 1}`,
      order: stages.length + 1,
      tasks: [],
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (stageId: string) => {
    setStages(stages.filter(stage => stage.id !== stageId));
  };

  const updateStage = (stageId: string, updates: Partial<NewStage>) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  const addTask = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    const newTask: NewTask = {
      id: `task-${stageId}-${Date.now()}`,
      name: '',
      department: 'HR',
      assignedToId: 'unassigned',
      priority: 'Medium',
      requiredDate: '',
    };

    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, tasks: [...stage.tasks, newTask] }
        : stage
    ));
  };

  const removeTask = (stageId: string, taskId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, tasks: stage.tasks.filter(task => task.id !== taskId) }
        : stage
    ));
  };

  const updateTask = (stageId: string, taskId: string, updates: Partial<NewTask>) => {
    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { 
            ...stage, 
            tasks: stage.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        : stage
    ));
  };

  const canProceedStep1 = templateName.trim() !== '' && clientId !== '' && workflowType !== '';
  const canProceedStep2 = stages.length > 0 && stages.every(s => s.tasks.length > 0);

  const handleSubmit = () => {
    if (!canProceedStep2 || !templateName.trim() || !clientId || !workflowType) {
      toast({
        title: 'Incomplete Template',
        description: 'Please fill in all required fields and add at least one stage with tasks.',
        variant: 'destructive',
      });
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      toast({
        title: 'Invalid Client',
        description: 'Selected client not found.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare the template data with all required fields
    const templateData = {
      id: isEditing ? id! : `template-${Date.now()}`,
      name: templateName.trim(),
      type: workflowType as WorkflowType,
      client,
      stages: stages.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        order: index + 1,
        tasks: stage.tasks.map(task => ({
          id: task.id,
          name: task.name,
          department: task.department,
          assignedToId: task.assignedToId,
          actionType: task.actionType,
          priority: task.priority || 'Medium',
          requiredDate: task.requiredDate,
          status: 'Not Started' as const,
          dueDate: null, // This is specific to workflow instances
          completedAt: null,
          comments: [],
        })),
      })),
    };

    // Use updateTemplate which handles both creation and updates
    updateTemplate(templateData);
    
    toast({
      title: isEditing ? 'Template Updated' : 'Template Created',
      description: isEditing 
        ? 'Workflow template has been updated successfully.' 
        : 'New workflow template has been created successfully.',
    });

    navigate('/templates');
  };

  if (templateNotFound) {
    return (
      <AppLayout title="Template Not Found">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Template Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested workflow template does not exist or is corrupted.</p>
          <Button variant="outline" onClick={() => navigate('/templates')}>Back to Templates</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? "Edit Workflow Template" : "Create Workflow Template"}
      subtitle="Define a reusable workflow template"
    >
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium',
                  step >= s
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">
                  {s === 1 && 'Basic Info'}
                  {s === 2 && 'Stages & Tasks'}
                  {s === 3 && 'Review'}
                </div>
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-4',
                    step > s ? 'bg-accent' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Template Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    placeholder="e.g., Standard Employee Onboarding"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workflowType">Workflow Type *</Label>
                  <Select 
                    value={workflowType} 
                    onValueChange={(value: WorkflowType) => handleTypeChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Offboarding">Offboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {workflowType && (
                  <div>
                    <Label htmlFor="copyTemplate">Copy from existing template (optional)</Label>
                    <Select 
                      value={copyFromTemplate} 
                      onValueChange={(value) => {
                        setCopyFromTemplate(value);
                        if (value) handleCopyTemplate(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template to copy from" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Continue to Stages & Tasks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Stages & Tasks */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Stages & Tasks</h2>
                <Button variant="outline" onClick={addStage} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Stage
                </Button>
              </div>

              <div className="space-y-6">
                {stages.map((stage) => (
                  <div key={stage.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                      {stages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStage(stage.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3 ml-8">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                        >
                          <Input
                            placeholder="Task name"
                            value={task.name}
                            onChange={(e) =>
                              updateTask(stage.id, task.id, { name: e.target.value })
                            }
                            className="flex-1 min-w-[200px]"
                          />
                          <Select
                            value={task.department}
                            onValueChange={(v) =>
                              updateTask(stage.id, task.id, { department: v as Department })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Data Input for Required Date */}
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  onSelect={(date) => {
                                      if (date) {
                                          updateTask(stage.id, task.id, { requiredDate: format(date, 'yyyy-MM-dd') });
                                      }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Input
                                placeholder="Due date (opt)"
                                value={task.requiredDate || ''}
                                onChange={(e) =>
                                    updateTask(stage.id, task.id, { requiredDate: e.target.value })
                                }
                                className="w-32 h-9 text-xs"
                            />
                          </div>

                          {/* Priority Select */}
                          <Select
                            value={task.priority || 'Medium'}
                            onValueChange={(v) =>
                                updateTask(stage.id, task.id, { priority: v as Priority })
                            }
                          >
                             <SelectTrigger className="w-32 h-9">
                                <div className="flex items-center gap-2">
                                    <Flag className={cn(
                                        "w-3 h-3",
                                        task.priority === 'High' ? "text-red-500 fill-red-500" :
                                        task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                        "text-blue-500 fill-blue-500"
                                    )} />
                                    <SelectValue placeholder="Priority" />
                                </div>
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                             </SelectContent>
                          </Select>

                          <Select
                            value={task.assignedToId}
                            onValueChange={(v) =>
                              updateTask(stage.id, task.id, { assignedToId: v })
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Default assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">No default</SelectItem>
                              {users
                                .filter((u) => u.department === task.department)
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTask(stage.id, task.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(stage.id)}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Review Template
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Review Template</h2>

              {/* Template Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{templateName}</p>
                    <p className="text-sm text-muted-foreground">{workflowType} Template</p>
                  </div>
                </div>
              </div>

              {/* Stages Summary */}
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div key={stage.id} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3">{stage.name}</h4>
                    <div className="space-y-2">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{task.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-muted">
                              {task.department}
                            </span>
                            {task.actionType && (
                              <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                {task.actionType.replace('_', ' ')}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              {users.find((u) => u.id === task.assignedToId)?.name || 'No default'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                {isEditing ? 'Update Template' : 'Create Template'}
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}