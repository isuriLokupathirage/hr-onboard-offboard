import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, X, GripVertical, Check, FileText, Calendar, Flag, AlertCircle, Trash2 } from 'lucide-react';
// DependencyArrows import removed
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
  description?: string;
  department: Department;
  assignedToId: string;
  actionType?: WorkflowAction;
  priority?: Priority;
  requiredDate?: string;
  dependentOn?: string[];
  indent?: number;
}

interface NewStage {
  id: string;
  name: string;
  description?: string;
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

  // dragState removed

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
            description: s.description,
            order: s.order,
            tasks: s.tasks.map((t, j) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              department: t.department,
              assignedToId: 'unassigned',
              actionType: t.actionType,
            priority: t.priority,
              requiredDate: t.requiredDate,
              dependentOn: t.dependentOn || [],
              indent: t.indent || 0,
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
        description: t.description,
        order: i + 1,
        tasks: t.tasks.map((task: NewTask, j: number) => ({
          id: `task-${Date.now()}-${i}-${j}`,
          name: task.name,
          description: task.description,
          department: task.department,
          assignedToId: 'unassigned',
          actionType: task.actionType,
          priority: 'Medium',
          requiredDate: '',
          dependentOn: [],
          indent: 0,
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
          description: s.description,
          order: i + 1,
          tasks: s.tasks.map((t, j) => ({
            id: `task-${Date.now()}-${i}-${j}`,
            name: t.name,
            description: t.description,
            department: t.department,
            assignedToId: 'unassigned',
            actionType: t.actionType,
            priority: t.priority,
            requiredDate: t.requiredDate,
            dependentOn: t.dependentOn || [],
            indent: t.indent || 0,
          })),
        }))
      );
    }
  };

  const addStage = () => {
    const newStage: NewStage = {
      id: `stage-${Date.now()}-${stages.length}`,
      name: `Stage ${stages.length + 1}`,
      description: '',
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
      description: '',
      department: 'HR',
      assignedToId: 'unassigned',
      priority: 'Medium',
      requiredDate: '',
      dependentOn: [],
      indent: 0,
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
        description: stage.description,
        order: index + 1,
        tasks: stage.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          department: task.department,
          assignedToId: task.assignedToId,
          actionType: task.actionType,
          priority: task.priority || 'Medium',
          requiredDate: task.requiredDate,
          dependentOn: task.dependentOn || [],
          indent: task.indent || 0,
          status: 'Open' as const,
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
        ? 'Check List template has been updated successfully.' 
        : 'New check list template has been created successfully.',
    });

    navigate('/templates');
  };

  if (templateNotFound) {
    return (
      <AppLayout title="Template Not Found">
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Template Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested check list template does not exist or is corrupted.</p>
          <Button variant="outline" onClick={() => navigate('/templates')}>Back to Templates</Button>
        </div>
      </AppLayout>
    );
  }


  // Drag and drop logic removed

  const removeDependency = (stageId: string, taskId: string, depIdToRemove: string) => {
    const stage = stages.find(s => s.id === stageId);
    const task = stage?.tasks.find(t => t.id === taskId);
    if (!stage || !task) return;
    
    const newDeps = (task.dependentOn || []).filter(d => d !== depIdToRemove);
    updateTask(stageId, taskId, { dependentOn: newDeps });
  };

  const addDependency = (stageId: string, taskId: string, depIdToAdd: string) => {
      const stage = stages.find(s => s.id === stageId);
      const task = stage?.tasks.find(t => t.id === taskId);
      if (!stage || !task) return;

      const currentDeps = task.dependentOn || [];
      if (!currentDeps.includes(depIdToAdd)) {
           // Basic circular dependency check
           // In a real app, you'd do a full graph traversal check here
           if (taskId === depIdToAdd) return; 

           updateTask(stageId, taskId, {
               dependentOn: [...currentDeps, depIdToAdd]
           });
      }
  };

  // Get all tasks for dependency dropdown
  const getAllTasks = () => {
      return stages.flatMap(s => s.tasks);
  };


  return (
    <AppLayout
      title={isEditing ? "Edit Check List Template" : "Create Check List Template"}
      subtitle="Create hierarchical checklists with dependencies"
    >
      <div className="max-w-5xl mx-auto">

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
          <>
            <div className="space-y-6 animate-fade-in relative">
             <div className="bg-card border border-border rounded-xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-semibold text-foreground">Stages & Tasks</h2>
                 <Button variant="outline" onClick={addStage} className="gap-2">
                   <Plus className="w-4 h-4" />
                   Add Stage
                 </Button>
               </div>
 
               {stages.map((stage) => (
                   <div key={stage.id} className="border border-border rounded-lg p-4">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3 flex-1">
                         <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                         <div className="flex-1 space-y-2">
                             <Input
                             value={stage.name}
                             onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                             className="font-medium"
                             placeholder="Stage Name"
                             />
                             <Input
                                 value={stage.description || ''}
                                 onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                                 className="text-sm text-muted-foreground bg-muted/20 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                                 placeholder="Add optional description for this stage..."
                             />
                         </div>
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
 
                     <div className="space-y-3 ml-8 relative">
                       {/* Arrows removed from here, moved to global container */}
                       {stage.tasks.map((task, index) => (
                         <div 
                           key={task.id} 
                           id={`task-card-${task.id}`}
                           className="flex items-start gap-4 p-4 bg-card border rounded-lg relative transition-all group"
                         >
                           {/* Numbering */}
                           <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground mt-2 shrink-0">
                               {index + 1}
                           </div>

                           <div className="flex-1 space-y-4">
                             <div className="space-y-3">
                                 <div className="flex gap-3">
                                 <Input
                                     placeholder="Task name"
                                     className="flex-1"
                                     value={task.name}
                                     onChange={(e) =>
                                     updateTask(stage.id, task.id, { name: e.target.value })
                                     }
                                 />
                                 </div>
                                 <Input
                                     placeholder="Add optional description..."
                                     className="text-xs text-muted-foreground border-0 border-b rounded-none px-0 h-7 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50 w-full"
                                     value={task.description || ''}
                                     onChange={(e) =>
                                         updateTask(stage.id, task.id, { description: e.target.value })
                                     }
                                 />
                             </div>
                             
                             {/* Visual Feedback for Dependencies */}
                             {(task.dependentOn || []).length > 0 && (
                                 <div className="flex flex-wrap gap-2">
                                     {(task.dependentOn || []).map(depId => {
                                         const depTask = getAllTasks().find(t => t.id === depId);
                                         return (
                                             <span 
                                                 key={depId} 
                                                 className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200"
                                             >
                                                 <AlertCircle className="w-3 h-3" />
                                                 Depends on: <span className="font-medium max-w-[150px] truncate">{depTask?.name || 'Unknown Task'}</span>
                                                 <button
                                                     onClick={() => removeDependency(stage.id, task.id, depId)}
                                                     className="ml-1 hover:text-destructive"
                                                     title="Remove dependency"
                                                 >
                                                     <X className="w-3 h-3" />
                                                 </button>
                                             </span>
                                         );
                                     })}
                                 </div>
                             )}
                             
                             <div className="flex flex-wrap gap-3 items-center">
                               <Select
                                 value={task.department}
                                 onValueChange={(v) =>
                                   updateTask(stage.id, task.id, { department: v as Department })
                                 }
                               >
                                 <SelectTrigger className="w-32">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="HR">HR</SelectItem>
                                   <SelectItem value="IT">IT</SelectItem>
                                   <SelectItem value="Finance">Finance</SelectItem>
                                   <SelectItem value="Marketing">Marketing</SelectItem>
                                 </SelectContent>
                               </Select>

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

                               {/* Dependency Selection Dropdown */}
                               <Select
                                    onValueChange={(v) => addDependency(stage.id, task.id, v)}
                               >
                                   <SelectTrigger className="w-48 h-9 border-dashed text-muted-foreground">
                                       <Plus className="w-3.5 h-3.5 mr-2" />
                                       <span className="text-xs">Add Dependency</span>
                                   </SelectTrigger>
                                   <SelectContent>
                                        {stages.flatMap((s) => 
                                            s.tasks.map((t, index) => ({ ...t, stageName: s.name, taskIndex: index + 1 }))
                                        )
                                        .filter(t => t.id !== task.id && !(task.dependentOn || []).includes(t.id))
                                        .map(t => (
                                            <SelectItem key={t.id} value={t.id} className="text-xs">
                                                <span className="font-medium text-muted-foreground mr-2">{t.taskIndex}.</span>
                                                <span title={t.name}>
                                                    {(t.name || 'Unnamed Task').length > 50 
                                                        ? (t.name || 'Unnamed Task').substring(0, 50) + '...'
                                                        : (t.name || 'Unnamed Task')}
                                                </span>
                                                {stages.length > 1 && <span className="ml-2 text-[10px] text-muted-foreground opacity-70">({t.stageName})</span>}
                                            </SelectItem>
                                        ))}
                                        {getAllTasks().filter(t => t.id !== task.id && !(task.dependentOn || []).includes(t.id)).length === 0 && (
                                            <div className="p-2 text-xs text-muted-foreground text-center">No available tasks</div>
                                        )}
                                   </SelectContent>
                               </Select>
                               
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() => removeTask(stage.id, task.id)}
                                 className="text-muted-foreground hover:text-destructive ml-auto"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                           </div>
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
           </>
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
              <div className="space-y-4 relative">
                {stages.map((stage) => (
                    <div key={stage.id} className="border border-border rounded-lg p-4 bg-card z-10 relative">
                        <div className="mb-3">
                            <h4 className="font-medium text-foreground">{stage.name}</h4>
                            {stage.description && (
                                <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                            )}
                        </div>
                    <div className="space-y-2">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          className="flex flex-col gap-1 p-2 rounded hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground font-medium">{task.name}</span>
                                <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs bg-muted">
                                {task.department}
                              </span>
                              {task.actionType && (
                                <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                  {task.actionType.replace('_', ' ')}
                                </span>
                              )}
                              <span className="text-muted-foreground text-xs">
                                {users.find((u) => u.id === task.assignedToId)?.name || 'No default'}
                              </span>
                            </div>
                          </div>
                            {task.description && (
                                <p className="text-xs text-muted-foreground ml-2 border-l-2 pl-2 border-border">{task.description}</p>
                            )}
                          </div>
                          
                          {/* Dependency Badges */}
                          {task.dependentOn && task.dependentOn.length > 0 && (
                             <div className="flex flex-wrap gap-2 pl-2">
                                {(task.dependentOn || []).map(depId => {
                                    const depTask = stages.flatMap(s => s.tasks).find(t => t.id === depId);
                                    return (
                                        <span 
                                            key={depId} 
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200"
                                        >
                                            <AlertCircle className="w-3 h-3" />
                                            Depends on: {depTask?.name || 'Unknown Task'}
                                        </span>
                                    );
                                })}
                            </div>
                          )}
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