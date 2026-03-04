import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, X, GripVertical, Check, FileText, Calendar, Flag, AlertCircle, Trash2, Bell, Clock, ChevronUp, ChevronDown, Unlink, Link2, MoreVertical, Paperclip } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { users, clients, onboardingStageTemplates, offboardingStageTemplates } from '@/data/mockData';
import { WorkflowType, Department, WorkflowAction, Priority, LibraryTask, ReferenceDate, REFERENCE_DATE_LABELS, ONBOARDING_REFERENCE_DATES, OFFBOARDING_REFERENCE_DATES } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getTemplates, updateTemplate, getTemplateById, createLibraryTask } from '@/lib/storage';
import { LibraryTaskModal } from '@/components/templates/LibraryTaskModal';

interface NewTask {
  id: string;
  name: string;
  description?: string;
  department: Department;
  assignedToId: string;
  actionType?: WorkflowAction;
  priority?: Priority;
  requiredDate?: string;
  dueDateConfig?: {
    type: 'none' | 'on-date' | 'relative';
    days?: number;
    unit?: 'days' | 'weeks' | 'months';
    direction?: 'before' | 'after';
    referenceDate?: ReferenceDate;
  };
  notificationConfig?: string;
  dependentOn?: string[];
  indent?: number;
  groupId?: string; // Optional group assignment
  attachments?: string[];
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
  const location = useLocation();
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
  const [tasks, setTasks] = useState<NewTask[]>([]); // Root-level tasks (ungrouped)
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<LibraryTask | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupAction, setGroupAction] = useState<'create' | 'select'>('create');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Handle imported tasks from library
  useEffect(() => {
    const state = location.state as { importedTasks?: LibraryTask[]; type?: WorkflowType };
    if (state?.importedTasks && state.importedTasks.length > 0) {
      const mappedTasks: NewTask[] = state.importedTasks.map((t, i) => ({
        id: `task-imported-${Date.now()}-${i}`,
        name: t.name,
        description: t.description,
        department: t.department as Department,
        assignedToId: 'unassigned',
        priority: t.priority || 'Medium',
        dueDateConfig: t.dueDateConfig,
        notificationConfig: t.notificationConfig,
        requiredDate: '',
        dependentOn: [],
        attachments: t.attachments || [],
        indent: 0,
      }));
      setTasks(mappedTasks);
      
      // Prioritize type from navigation state if available (for UI inference)
      if (state.type) {
        setWorkflowType(state.type);
      }
    } else if (state?.type) {
      // If no tasks but type is passed (e.g. "Onboarding Templates" -> "New")
      setWorkflowType(state.type);
    }
      
    // Clear state so it doesn't re-trigger on reload if navigated away and back
    if (state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
            tasks: [], // Empty tasks in stages during editing; use flat 'tasks' list instead
          }))
        );
        
        // Populate flat tasks list for Step 2
        const allTasks: NewTask[] = [];
        template.stages.forEach(s => {
          s.tasks.forEach(t => {
            allTasks.push({
              id: t.id,
              name: t.name,
              description: t.description,
              department: t.department,
              assignedToId: 'unassigned',
              actionType: t.actionType,
              priority: t.priority,
              dueDateConfig: t.dueDateConfig,
              notificationConfig: t.notificationConfig,
              requiredDate: t.requiredDate,
              dependentOn: t.dependentOn || [],
              indent: t.indent || 0,
              attachments: t.attachments || [],
              groupId: s.id
            });
          });
        });
        setTasks(allTasks);
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
    setStages([]);
    setTasks([]);
  };

  const handleCopyTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setStages(
        template.stages.map((s, i) => {
          const newStageId = `stage-${Date.now()}-${i}`;
          return {
            id: newStageId,
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
              dueDateConfig: t.dueDateConfig,
              notificationConfig: t.notificationConfig,
              requiredDate: t.requiredDate,
              dependentOn: t.dependentOn || [],
              indent: t.indent || 0,
              attachments: t.attachments || [],
              groupId: newStageId
            })),
          };
        })
      );

      // Also populate flat tasks list
      const allTasks: NewTask[] = [];
      template.stages.forEach((s, i) => {
        const newStageId = `stage-${Date.now()}-${i}`;
        s.tasks.forEach((t, j) => {
          allTasks.push({
            id: `task-${Date.now()}-${i}-${j}`,
            name: t.name,
            description: t.description,
            department: t.department,
            assignedToId: 'unassigned',
            actionType: t.actionType,
            priority: t.priority,
            dueDateConfig: t.dueDateConfig,
            notificationConfig: t.notificationConfig,
            requiredDate: t.requiredDate,
            dependentOn: t.dependentOn || [],
            indent: t.indent || 0,
            attachments: t.attachments || [],
            groupId: newStageId
          });
        });
      });
      setTasks(allTasks);
    }
  };

  const handleClearTemplate = () => {
    setCopyFromTemplate('');
    setStages([]);
    setTasks([]);
    toast({
      title: 'Template Cleared',
      description: 'The selected template and its tasks have been removed.',
    });
  };

  const addStage = () => {
    const newStage: NewStage = {
      id: `stage-${Date.now()}-${stages.length}`,
      name: `Group ${stages.length + 1}`,
      description: '',
      order: stages.length + 1,
      tasks: [],
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (stageId: string) => {
    setStages(stages.filter(stage => stage.id !== stageId));
  };

  const ungroupStage = (stageId: string) => {
    // Move all tasks in this stage to root (ungrouped)
    setTasks(tasks.map(task => 
      task.groupId === stageId ? { ...task, groupId: undefined } : task
    ));
    // Remove the stage
    setStages(stages.filter(stage => stage.id !== stageId));
  };

  const updateStage = (stageId: string, updates: Partial<NewStage>) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  const addTask = (stageId: string) => {
    setCurrentStageId(stageId);
    setIsTaskModalOpen(true);
  };

  const removeTask = (stageId: string, taskId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, tasks: stage.tasks.filter(task => task.id !== taskId) }
        : stage
    ));
  };

  // NOTE: These updates are strictly local to the Template Creation Wizard.
  // Changes made here (Description, Priority, etc.) will NOT update the original tasks in the Library.
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

  // Root-level task management (ungrouped tasks)
  const addRootTask = () => {
    setCurrentStageId(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskFromModal = (taskData: Omit<LibraryTask, 'id' | 'createdAt' | 'updatedAt'> | LibraryTask) => {
    // Save to global library first as a new reusable task
    const libraryTask = createLibraryTask(taskData as Omit<LibraryTask, 'id' | 'createdAt' | 'updatedAt'>);
    
    // Create the local task for this template
    const newTask: NewTask = {
      id: `task-${currentStageId || 'root'}-${Date.now()}`,
      name: taskData.name,
      description: taskData.description,
      department: taskData.department as Department,
      assignedToId: 'unassigned',
      priority: taskData.priority || 'Medium',
      dueDateConfig: taskData.dueDateConfig || { type: 'none' },
      notificationConfig: taskData.notificationConfig || 'Soon After Task Is Imported',
      requiredDate: '',
      dependentOn: [],
      indent: 0,
      groupId: currentStageId || undefined,
    };
    
    // Always add to the flat tasks list for Step 2 editing.
    // handleSubmit will handle re-grouping these into stages based on groupId.
    setTasks([...tasks, newTask]);
    
    setIsTaskModalOpen(false);
    setCurrentStageId(null);
  };

  const removeRootTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const ungroupTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, groupId: undefined } : task
    ));
  };

  // NOTE: These updates are strictly local to the Template Creation Wizard.
  // Changes made here (Description, Priority, etc.) will NOT update the original tasks in the Library.
  const updateRootTask = (taskId: string, updates: Partial<NewTask>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };


  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    
    // Find target index to swap with (nearest task with same groupId)
    let targetIndex = -1;
    
    if (direction === 'up') {
      for (let i = taskIndex - 1; i >= 0; i--) {
        if ((tasks[i].groupId || undefined) === (task.groupId || undefined)) {
          targetIndex = i;
          break;
        }
      }
    } else {
      for (let i = taskIndex + 1; i < tasks.length; i++) {
        if ((tasks[i].groupId || undefined) === (task.groupId || undefined)) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1) {
      const newTasks = [...tasks];
      // Simple swap ensures relative order changes without breaking filtering
      [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];
      setTasks(newTasks);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleGroupSelectedTasks = () => {
    if (selectedTaskIds.length === 0) return;
    setGroupAction('create');
    setSelectedGroupId('');
    setNewGroupName('');
    setNewGroupDescription('');
    setIsGroupModalOpen(true);
  };

  const confirmCreateGroup = () => {
    if (groupAction === 'create') {
      if (!newGroupName.trim()) {
        toast({
          title: 'Required Field',
          description: 'Please enter a group name.',
          variant: 'destructive',
        });
        return;
      }

      // Create a new group
      const newStageId = `stage-${Date.now()}`;
      const newStage: NewStage = {
        id: newStageId,
        name: newGroupName,
        description: newGroupDescription,
        order: stages.length + 1,
        tasks: []
      };

      // Update tasks to belong to this new group
      const updatedTasks = tasks.map(task => 
        selectedTaskIds.includes(task.id) 
          ? { ...task, groupId: newStageId } 
          : task
      );

      setStages([...stages, newStage]);
      setTasks(updatedTasks);
      
      toast({
        title: 'Group Created',
        description: `${selectedTaskIds.length} tasks moved to "${newGroupName}".`,
      });
    } else {
      // Add to existing group
      if (!selectedGroupId) {
        toast({
          title: 'Required Field',
          description: 'Please select an existing group.',
          variant: 'destructive',
        });
        return;
      }

      const targetStage = stages.find(s => s.id === selectedGroupId);
      if (!targetStage) return;

      const updatedTasks = tasks.map(task => 
        selectedTaskIds.includes(task.id) 
          ? { ...task, groupId: selectedGroupId } 
          : task
      );

      setTasks(updatedTasks);
      
      toast({
        title: 'Tasks Grouped',
        description: `${selectedTaskIds.length} tasks moved to "${targetStage.name}".`,
      });
    }

    setSelectedTaskIds([]); // Clear selection
    setIsGroupModalOpen(false);
  };

  const canProceedStep1 = templateName.trim() !== '' && clientId !== '' && workflowType !== '';
  const totalTasks = tasks.length + stages.reduce((sum, s) => sum + s.tasks.length, 0);
  const canProceedStep2 = totalTasks > 0; // At least one task (grouped or ungrouped)

  const handleSubmit = () => {
    if (!canProceedStep2 || !templateName.trim() || !clientId || !workflowType) {
      toast({
        title: 'Incomplete Template',
        description: 'Please fill in all required fields and add at least one task.',
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
    // Convert root-level tasks into stages based on groupId
    const finalStages = [...stages];
    
    // Group root tasks by their groupId
    const ungroupedTasks = tasks.filter(t => !t.groupId);
    const groupedTasks = tasks.filter(t => t.groupId);
    
    // If there are ungrouped tasks, add them to their assigned groups
    groupedTasks.forEach(task => {
      const stageIndex = finalStages.findIndex(s => s.id === task.groupId);
      if (stageIndex >= 0) {
        finalStages[stageIndex] = {
          ...finalStages[stageIndex],
          tasks: [...finalStages[stageIndex].tasks, task]
        };
      }
    });
    
    // If there are ungrouped tasks and no stages exist, create a default stage
    // Or if there are ungrouped tasks, we need to put them somewhere
    if (ungroupedTasks.length > 0) {
      finalStages.unshift({
        id: 'ungrouped',
        name: 'Tasks',
        description: '',
        order: 0,
        tasks: ungroupedTasks
      });
    }

    const templateData = {
      id: isEditing ? id! : `template-${Date.now()}`,
      name: templateName.trim(),
      type: workflowType as WorkflowType,
      client,
      stages: finalStages.map((stage, index) => ({
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
          dueDateConfig: task.dueDateConfig,
          notificationConfig: task.notificationConfig,
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

    navigate(`/templates/${templateData.type.toLowerCase()}`);
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


  // Dependency management functions for flat task structure
  const addTaskDependency = (taskId: string, parentTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentDeps = task.dependentOn || [];
    
    // Prevent self-dependency
    if (taskId === parentTaskId) {
      toast({
        title: 'Invalid Dependency',
        description: 'A task cannot depend on itself.',
        variant: 'destructive',
      });
      return;
    }
    
    // Prevent duplicate dependencies
    if (currentDeps.includes(parentTaskId)) return;
    
    // Check for circular dependency
    if (wouldCreateCircularDependency(taskId, parentTaskId)) {
      toast({
        title: 'Circular Dependency Detected',
        description: 'This dependency would create a circular reference. Please choose a different parent task.',
        variant: 'destructive',
      });
      return;
    }

    updateRootTask(taskId, {
      dependentOn: [...currentDeps, parentTaskId]
    });
  };

  const removeTaskDependency = (taskId: string, parentTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newDeps = (task.dependentOn || []).filter(d => d !== parentTaskId);
    updateRootTask(taskId, { dependentOn: newDeps });
  };

  // Check if adding a dependency would create a circular reference
  const wouldCreateCircularDependency = (taskId: string, parentTaskId: string): boolean => {
    const visited = new Set<string>();
    
    const hasCycle = (currentId: string): boolean => {
      if (currentId === taskId) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      
      const currentTask = tasks.find(t => t.id === currentId);
      if (!currentTask || !currentTask.dependentOn) return false;
      
      return currentTask.dependentOn.some(depId => hasCycle(depId));
    };
    
    return hasCycle(parentTaskId);
  };

  // Get all tasks with group names for dependency dropdown
  const getAllTasksForDependencyDropdown = (excludeTaskId?: string) => {
    return tasks
      .filter(t => t.id !== excludeTaskId) // Exclude current task
      .map(task => {
        const group = stages.find(s => s.id === task.groupId);
        let displayName = group ? `${group.name}: ${task.name}` : task.name;
        if (displayName.length > 50) {
          displayName = displayName.substring(0, 50) + '.....';
        }
        return {
          id: task.id,
          name: task.name,
          groupName: group ? group.name : 'Ungrouped',
          displayName
        };
      });
  };


  return (
    <AppLayout
      title={isEditing ? "Edit Check List Template" : "Create Check List Template"}
      subtitle="Create task groups with dependencies"
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
                  {s === 2 && 'Groups & Tasks'}
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
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Template Information</h2>
                {workflowType && (
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {workflowType} Template
                  </div>
                )}
              </div>
              
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

                {/* Workflow Type hidden but preserved in state */}
                {/* <div>
                  <Label htmlFor="workflowType">Workflow Type *</Label>
                  <Select 
                    value={workflowType} 
                    onValueChange={(value: WorkflowType) => handleTypeChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Offboarding">Offboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                {workflowType && (
                  <div>
                    <Label htmlFor="copyTemplate">Copy from existing template (optional)</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={copyFromTemplate} 
                        onValueChange={(value) => {
                          setCopyFromTemplate(value);
                          if (value) handleCopyTemplate(value);
                        }}
                      >
                        <SelectTrigger className="flex-1">
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
                      {copyFromTemplate && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={handleClearTemplate}
                          className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                          title="Clear template selection"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
                Continue to Groups &amp; Tasks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Tasks */}
        {step === 2 && (
          <>
            <div className="space-y-6 relative">
             <div className="bg-card border border-border rounded-xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
                 <div className="flex gap-2">
                    <Button onClick={addRootTask} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Plus className="w-4 h-4" />
                      Add Task
                    </Button>
                   {selectedTaskIds.length > 0 && (
                     <Button onClick={handleGroupSelectedTasks} variant="secondary" className="gap-2">
                       <GripVertical className="w-4 h-4" />
                       Group Selected ({selectedTaskIds.length})
                     </Button>
                   )}
                 </div>
               </div>
 

               {/* Tasks Section */}
               <div className="space-y-3">
                 {tasks.length === 0 && stages.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                     <p className="mb-4">No tasks yet. Click "Add Task" to get started.</p>
                   </div>
                 )}

                  {/* Render Stages and their tasks */}
                  {stages.map((stage) => {
                    const groupTasks = tasks.filter(t => t.groupId === stage.id);
                    if (groupTasks.length === 0) return null; // Don't render empty stages here

                    return (
                      <div key={stage.id} className="bg-muted/50 border border-border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-1">
                            <Input
                              value={stage.name}
                              onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                              className="font-semibold text-lg h-auto border-transparent hover:border-border focus:border-accent bg-transparent px-0"
                              placeholder="Group Name"
                            />
                            <Input
                              value={stage.description || ''}
                              onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                              className="text-sm h-auto border-transparent hover:border-border focus:border-accent bg-transparent px-0 text-muted-foreground"
                              placeholder="Add description..."
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStage(stage.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex justify-end -mt-3 mb-2 px-4">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => ungroupStage(stage.id)}
                            className="text-muted-foreground hover:text-accent h-7 text-xs gap-1.5"
                          >
                             <Unlink className="w-3.5 h-3.5" />
                             Ungroup All
                          </Button>
                        </div>

                        {groupTasks.map((task, index) => (
                          <div 
                            key={task.id} 
                            className={cn(
                              "bg-card border rounded-xl p-5 relative transition-all group shadow-sm",
                              selectedTaskIds.includes(task.id) ? "border-accent ring-1 ring-accent" : "border-border hover:border-accent/40"
                            )}
                          >
                            <div className="absolute top-5 left-5 z-10">
                              <Checkbox 
                                checked={selectedTaskIds.includes(task.id)}
                                onCheckedChange={() => toggleTaskSelection(task.id)}
                              />
                            </div>

                            <div className="absolute top-5 right-5 z-10 flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => toggleTaskExpansion(task.id)}>
                                  {expandedTaskIds.includes(task.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => ungroupTask(task.id)} className="gap-2">
                                      <Unlink className="w-3.5 h-3.5" />
                                      Ungroup Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => removeRootTask(task.id)} className="gap-2 text-destructive focus:text-destructive">
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Remove Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            {/* Rendering Task Card Content */}
                            {!expandedTaskIds.includes(task.id) && (
                               <div className="mt-1 pl-8 py-1 cursor-pointer flex items-center gap-3" onClick={() => toggleTaskExpansion(task.id)}>
                                  <span className="font-medium text-sm">{task.name || "Untitled Task"}</span>
                                  {task.attachments && task.attachments.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                                        <Paperclip className="h-3 w-3" />
                                        <span>{task.attachments.length}</span>
                                      </div>
                                  )}
                               </div>
                            )}
                            <div className={cn("flex gap-5 mt-6", !expandedTaskIds.includes(task.id) && "hidden")}>
                             {/* Left Side: Numbering and Reordering */}
                             <div className="flex flex-col items-center gap-1.5">
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className={cn(
                                   "h-6 w-6 rounded-md hover:bg-accent/10 hover:text-accent transition-colors",
                                   // Disable up if it's the first in its visual group
                                   index === 0 && "opacity-0 pointer-events-none"
                                 )}
                                 onClick={() => moveTask(task.id, 'up')}
                               >
                                 <ChevronUp className="w-4 h-4" />
                               </Button>
                               
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className={cn(
                                   "h-6 w-6 rounded-md hover:bg-accent/10 hover:text-accent transition-colors",
                                    // Disable down if it's the last in its visual group
                                   index === groupTasks.length - 1 && "opacity-0 pointer-events-none"
                                 )}
                                 onClick={() => moveTask(task.id, 'down')}
                               >
                                 <ChevronDown className="w-4 h-4" />
                               </Button>
                               
                               {index < groupTasks.length - 1 && (
                                 <div className="w-0.5 h-full min-h-[20px] bg-accent/5 my-1" />
                               )}
                             </div>
     
                             {/* Main Content */}
                             <div className="flex-1 space-y-4">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                 <div className="space-y-4">
                                   <div className="space-y-2">
                                     <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task Details</Label>
                                     <Input
                                       placeholder="Task name"
                                       className="font-medium text-base h-10 bg-muted/30 cursor-not-allowed"
                                       value={task.name}
                                       readOnly
                                     />
                                     <Input
                                       placeholder="Add details or instructions..."
                                       className="text-sm h-9"
                                       value={task.description || ''}
                                       onChange={(e) => updateRootTask(task.id, { description: e.target.value })}
                                     />
                                   </div>
     
                                   <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-1.5">
                                       <Label className="text-[10px] font-bold text-muted-foreground uppercase">Department</Label>
                                       <Select
                                         value={task.department}
                                         onValueChange={(v) => updateRootTask(task.id, { department: v as Department })}
                                       >
                                         <SelectTrigger className="h-8 text-xs">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="HR">HR</SelectItem>
                                           <SelectItem value="IT">IT</SelectItem>
                                           <SelectItem value="Managers">Managers</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                     <div className="space-y-1.5">
                                       <Label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</Label>
                                       <Select
                                         value={task.priority}
                                         onValueChange={(v) => updateRootTask(task.id, { priority: v as Priority })}
                                       >
                                         <SelectTrigger className="h-8 text-xs">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="High">
                                              <div className="flex items-center gap-2">
                                                <Flag className="w-3 h-3 text-red-500 fill-red-500" />
                                                <span>High</span>
                                              </div>
                                           </SelectItem>
                                           <SelectItem value="Medium">
                                              <div className="flex items-center gap-2">
                                                <Flag className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span>Medium</span>
                                              </div>
                                           </SelectItem>
                                           <SelectItem value="Low">
                                              <div className="flex items-center gap-2">
                                                <Flag className="w-3 h-3 text-blue-500 fill-blue-500" />
                                                <span>Low</span>
                                              </div>
                                           </SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                   </div>
                                 </div>
     
                                 <div className="space-y-4">
                                   <div className="space-y-2">
                                     <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timing & Settings</Label>
                                     
                                     <div className="p-3 bg-muted/30 rounded-lg space-y-3 border border-border/50">
                                       <div className="grid grid-cols-[16px_1fr_auto] items-center gap-2">
                                         <Clock className="w-3.5 h-3.5 text-orange-500" />
                                         <Label className="text-xs font-medium">Due Date Configuration</Label>
                                         <Select
                                           value={task.dueDateConfig?.type || 'none'}
                                           onValueChange={(v: any) => updateRootTask(task.id, { 
                                             dueDateConfig: { ...task.dueDateConfig, type: v } 
                                           })}
                                         >
                                           <SelectTrigger className="h-7 text-xs w-[110px] bg-background">
                                             <SelectValue />
                                           </SelectTrigger>
                                            <SelectContent>
                                             <SelectItem value="none">None</SelectItem>
                                             <SelectItem value="on-date">On Date</SelectItem>
                                             <SelectItem value="relative">Relative</SelectItem>
                                           </SelectContent>
                                         </Select>
                                        </div>

                                        {(task.dueDateConfig?.type === 'on-date' || task.dueDateConfig?.type === 'relative') && (
                                          <div className="flex items-center gap-2 pl-6 animate-fade-in">
                                            <span className="text-xs text-muted-foreground">Ref:</span>
                                            <Select
                                              value={task.dueDateConfig.referenceDate || 'hire-date'}
                                              onValueChange={(v: any) => updateRootTask(task.id, {
                                                dueDateConfig: { ...task.dueDateConfig!, referenceDate: v }
                                              })}
                                            >
                                              <SelectTrigger className="h-7 w-40 text-xs bg-background"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                {(workflowType === 'Offboarding' ? OFFBOARDING_REFERENCE_DATES : workflowType === 'Onboarding' ? ONBOARDING_REFERENCE_DATES : [...ONBOARDING_REFERENCE_DATES, ...OFFBOARDING_REFERENCE_DATES]).map((value) => (
                                                  <SelectItem key={value} value={value}>{REFERENCE_DATE_LABELS[value]}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
 
                                        {task.dueDateConfig?.type === 'relative' && (
                                          <div className="flex items-center gap-2 pl-6 animate-fade-in">
                                            <span className="text-xs text-muted-foreground">Due</span>
                                            <Input
                                              type="number"
                                              className="h-7 w-14 text-xs bg-background"
                                              value={task.dueDateConfig.days || ''}
                                              onChange={(e) => updateRootTask(task.id, {
                                                dueDateConfig: { ...task.dueDateConfig!, days: parseInt(e.target.value) || 0 }
                                              })}
                                            />
                                            <Select
                                              value={task.dueDateConfig.unit || 'days'}
                                              onValueChange={(v: any) => updateRootTask(task.id, {
                                                dueDateConfig: { ...task.dueDateConfig!, unit: v }
                                              })}
                                            >
                                              <SelectTrigger className="h-7 w-20 text-xs bg-background"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="days">Days</SelectItem>
                                                <SelectItem value="weeks">Weeks</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Select
                                              value={task.dueDateConfig.direction || 'after'}
                                              onValueChange={(v: any) => updateRootTask(task.id, {
                                                dueDateConfig: { ...task.dueDateConfig!, direction: v }
                                              })}
                                            >
                                              <SelectTrigger className="h-7 w-20 text-xs bg-background"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="before">Before</SelectItem>
                                                <SelectItem value="after">After</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <span className="text-xs text-muted-foreground">{REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}</span>
                                          </div>
                                        )}
                                     </div>
 
                                     <div className="space-y-1.5 mt-3">
                                       <div className="flex items-center gap-2">
                                         <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                                         <Label className="text-[10px] font-bold text-muted-foreground uppercase">Notifications</Label>
                                       </div>
                                       <Select
                                         value={task.notificationConfig || 'immediately'}
                                         onValueChange={(v) => updateRootTask(task.id, { notificationConfig: v })}
                                       >
                                         <SelectTrigger className="h-8 text-xs">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="immediately">Immediately</SelectItem>
                                           <SelectItem value="1_day_before">1 Day Before Due Date</SelectItem>
                                           <SelectItem value="on_due_date">On Due Date</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>

                                      {/* Dependencies Section */}
                                      <div className="space-y-1.5 mt-3">
                                        <div className="flex items-center gap-2">
                                          <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Dependencies</Label>
                                        </div>
                                        <Select
                                          value=""
                                          onValueChange={(v) => addTaskDependency(task.id, v)}
                                        >
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder={
                                              task.dependentOn && task.dependentOn.length > 0 
                                                ? `${task.dependentOn.length} selected` 
                                                : "Select parent tasks"
                                            } />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {getAllTasksForDependencyDropdown(task.id).length === 0 ? (
                                              <div className="text-xs text-muted-foreground p-2">No other tasks available</div>
                                            ) : (
                                              getAllTasksForDependencyDropdown(task.id).map((availableTask) => (
                                                <SelectItem key={availableTask.id} value={availableTask.id}>
                                                  {availableTask.displayName}
                                                </SelectItem>
                                              ))
                                            )}
                                          </SelectContent>
                                        </Select>
                                        
                                        {/* Display selected dependencies as badges */}
                                        {task.dependentOn && task.dependentOn.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-2">
                                            {task.dependentOn.map((depId) => {
                                              const depTask = tasks.find(t => t.id === depId);
                                              if (!depTask) return null;
                                              const depGroup = stages.find(s => s.id === depTask.groupId);
                                              return (
                                                <div 
                                                  key={depId} 
                                                  className="inline-flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-md text-xs"
                                                >
                                                  <Link2 className="w-3 h-3" />
                                                  <span className="max-w-[150px] truncate">
                                                    {depGroup ? `${depGroup.name}: ${depTask.name}` : depTask.name}
                                                  </span>
                                                  <button
                                                    onClick={() => removeTaskDependency(task.id, depId)}
                                                    className="hover:bg-accent/20 rounded-sm p-0.5 transition-colors"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Attachments Section */}
                                      {task.attachments && task.attachments.length > 0 && (
                                        <div className="space-y-1.5 mt-3">
                                          <div className="flex items-center gap-2">
                                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Attachments</Label>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            {task.attachments.map((file, i) => (
                                              <div key={i} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border border-border/50">
                                                <FileText className="w-3 h-3 text-muted-foreground" />
                                                <span>{file}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                 </div>
                               </div>
     


                          </div>
                    </div>
                  </div>
                    </div>
                ))}
                      </div>
                    );
                  })}

                  {/* Render Ungrouped Tasks */}
                  {tasks.filter(t => !t.groupId).map((task, index) => {
                    const ungroupedTasks = tasks.filter(t => !t.groupId);
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "bg-card border rounded-xl p-5 relative transition-all group shadow-sm",
                          selectedTaskIds.includes(task.id) ? "border-accent ring-1 ring-accent" : "border-border hover:border-accent/40"
                        )}
                      >
                        <div className="absolute top-5 left-5 z-10">
                          <Checkbox 
                            checked={selectedTaskIds.includes(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                          />
                        </div>

                        <div className="absolute top-5 right-5 z-10 flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => toggleTaskExpansion(task.id)}>
                                {expandedTaskIds.includes(task.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => removeRootTask(task.id)} className="gap-2 text-destructive focus:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                        </div>

                        {!expandedTaskIds.includes(task.id) && (
                           <div className="mt-1 pl-8 py-1 cursor-pointer flex items-center gap-3" onClick={() => toggleTaskExpansion(task.id)}>
                              <span className="font-medium text-sm">{task.name || "Untitled Task"}</span>
                              {task.attachments && task.attachments.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{task.attachments.length}</span>
                                  </div>
                              )}
                           </div>
                        )}
                        <div className={cn("flex gap-5 mt-6", !expandedTaskIds.includes(task.id) && "hidden")}>
                          {/* Left Side: Numbering and Reordering */}
                          <div className="flex flex-col items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 rounded-md hover:bg-accent/10 hover:text-accent transition-colors",
                                index === 0 && "opacity-0 pointer-events-none"
                              )}
                              onClick={() => moveTask(task.id, 'up')}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 rounded-md hover:bg-accent/10 hover:text-accent transition-colors",
                                index === ungroupedTasks.length - 1 && "opacity-0 pointer-events-none"
                              )}
                              onClick={() => moveTask(task.id, 'down')}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            
                            {index < ungroupedTasks.length - 1 && (
                              <div className="w-0.5 h-full min-h-[20px] bg-accent/5 my-1" />
                            )}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task Details</Label>
                                  <Input
                                    placeholder="Task name"
                                    className="font-medium text-base h-10 bg-muted/30 cursor-not-allowed"
                                    value={task.name}
                                    readOnly
                                  />
                                  <Input
                                    placeholder="Add details or instructions..."
                                    className="text-sm h-9"
                                    value={task.description || ''}
                                    onChange={(e) => updateRootTask(task.id, { description: e.target.value })}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Department</Label>
                                    <Select
                                      value={task.department}
                                      onValueChange={(v) => updateRootTask(task.id, { department: v as Department })}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="HR">HR</SelectItem>
                                        <SelectItem value="IT">IT</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</Label>
                                    <Select
                                      value={task.priority || 'Medium'}
                                      onValueChange={(v) => updateRootTask(task.id, { priority: v as Priority })}
                                    >
                                      <SelectTrigger className="h-9">
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
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timing & Settings</Label>
                                  
                                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-accent" />
                                        Due Date Configuration
                                      </Label>
                                      <Select
                                        value={task.dueDateConfig?.type || 'none'}
                                        onValueChange={(v: any) => updateRootTask(task.id, { 
                                          dueDateConfig: { ...task.dueDateConfig, type: v } 
                                        })}
                                      >
                                        <SelectTrigger className="h-7 w-32 border-0 bg-transparent text-xs font-medium focus:ring-0 px-0">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          <SelectItem value="on-date">On Date</SelectItem>
                                          <SelectItem value="relative">Relative</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {(task.dueDateConfig?.type === 'on-date' || task.dueDateConfig?.type === 'relative') && (
                                      <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                                        <span className="text-xs text-muted-foreground">Ref:</span>
                                        <Select
                                          value={task.dueDateConfig.referenceDate || 'hire-date'}
                                          onValueChange={(v: any) => updateRootTask(task.id, {
                                            dueDateConfig: { ...task.dueDateConfig, referenceDate: v }
                                          })}
                                        >
                                          <SelectTrigger className="h-8 w-44">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(workflowType === 'Offboarding' ? OFFBOARDING_REFERENCE_DATES : workflowType === 'Onboarding' ? ONBOARDING_REFERENCE_DATES : [...ONBOARDING_REFERENCE_DATES, ...OFFBOARDING_REFERENCE_DATES]).map((value) => (
                                              <SelectItem key={value} value={value}>{REFERENCE_DATE_LABELS[value]}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {task.dueDateConfig?.type === 'relative' && (
                                      <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                                        <Input
                                          type="number"
                                          className="w-16 h-8 text-center"
                                          value={task.dueDateConfig.days || 0}
                                          onChange={(e) => updateRootTask(task.id, {
                                            dueDateConfig: { ...task.dueDateConfig, days: parseInt(e.target.value) || 0 }
                                          })}
                                        />
                                        <Select
                                          value={task.dueDateConfig.unit || 'days'}
                                          onValueChange={(v: any) => updateRootTask(task.id, {
                                            dueDateConfig: { ...task.dueDateConfig, unit: v }
                                          })}
                                        >
                                          <SelectTrigger className="h-8 w-24">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="days">days</SelectItem>
                                            <SelectItem value="weeks">weeks</SelectItem>
                                            <SelectItem value="months">months</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select
                                          value={task.dueDateConfig.direction || 'after'}
                                          onValueChange={(v: any) => updateRootTask(task.id, {
                                            dueDateConfig: { ...task.dueDateConfig, direction: v }
                                          })}
                                        >
                                          <SelectTrigger className="h-8 w-24">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="after">after</SelectItem>
                                            <SelectItem value="before">before</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <span className="text-xs text-muted-foreground">{REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1.5 pt-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                      <Bell className="w-2.5 h-2.5" />
                                      Notifications
                                    </Label>
                                    <Select
                                      value={task.notificationConfig || 'immediately'}
                                      onValueChange={(v) => updateRootTask(task.id, { notificationConfig: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="immediately">Immediately</SelectItem>
                                        <SelectItem value="1_day_before">1 Day Before Due Date</SelectItem>
                                        <SelectItem value="on_due_date">On Due Date</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Dependencies Section */}
                                  <div className="space-y-1.5 pt-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                      <Link2 className="w-2.5 h-2.5" />
                                      Dependencies
                                    </Label>
                                    <Select
                                      value=""
                                      onValueChange={(v) => addTaskDependency(task.id, v)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder={
                                          task.dependentOn && task.dependentOn.length > 0 
                                            ? `${task.dependentOn.length} selected` 
                                            : "Select parent tasks"
                                        } />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAllTasksForDependencyDropdown(task.id).length === 0 ? (
                                          <div className="text-xs text-muted-foreground p-2">No other tasks available</div>
                                        ) : (
                                          getAllTasksForDependencyDropdown(task.id).map((availableTask) => (
                                            <SelectItem key={availableTask.id} value={availableTask.id}>
                                              {availableTask.displayName}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                    
                                    {/* Display selected dependencies as badges */}
                                    {task.dependentOn && task.dependentOn.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {task.dependentOn.map((depId) => {
                                          const depTask = tasks.find(t => t.id === depId);
                                          if (!depTask) return null;
                                          const depGroup = stages.find(s => s.id === depTask.groupId);
                                          return (
                                            <div 
                                              key={depId} 
                                              className="inline-flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-md text-xs"
                                            >
                                              <Link2 className="w-3 h-3" />
                                              <span className="max-w-[150px] truncate">
                                                {depGroup ? `${depGroup.name}: ${depTask.name}` : depTask.name}
                                              </span>
                                              <button
                                                onClick={() => removeTaskDependency(task.id, depId)}
                                                className="hover:bg-accent/20 rounded-sm p-0.5 transition-colors"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Attachments Section */}
                                  {task.attachments && task.attachments.length > 0 && (
                                    <div className="space-y-1.5 mt-3">
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Attachments</Label>
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {task.attachments.map((file, i) => (
                                          <div key={i} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border border-border/50">
                                            <FileText className="w-3 h-3 text-muted-foreground" />
                                            <span>{file}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>


                        </div>
                      </div>
                  </div>

                  );
                })}
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

              {/* Group Creation Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={groupAction} onValueChange={(v: 'create' | 'select') => setGroupAction(v)} className="flex gap-4 mb-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create">Create New Group</Label>
              </div>
              {stages.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="select" />
                  <Label htmlFor="select">Select Existing Group</Label>
                </div>
              )}
            </RadioGroup>

            {groupAction === 'create' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Pre-Boarding"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc">Description (Optional)</Label>
                  <Input
                    id="group-desc"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Brief description of this group's purpose"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Select Group <span className="text-destructive">*</span></Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmCreateGroup}>
              {groupAction === 'create' ? 'Create Group' : 'Move Tasks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LibraryTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                  setIsTaskModalOpen(false);
                  setSelectedTaskForModal(null);
                  setCurrentStageId(null);
                }}
                onSave={handleSaveTaskFromModal}
                task={selectedTaskForModal || undefined}
                workflowType={workflowType}
              />
            </div>
            </>
          )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
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

              {/* Tasks Summary */}
              <div className="space-y-4 relative">
                {/* Ungrouped Tasks */}
                {tasks.filter(t => !t.groupId).length > 0 && (
                  <div className="border border-border rounded-lg p-4 bg-card z-10 relative">
                    <div className="mb-3">
                      <h4 className="font-medium text-foreground">Tasks</h4>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter(t => !t.groupId).map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{task.name}</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider">
                                {task.department}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Flag className={cn(
                                  "w-3 h-3",
                                  task.priority === 'High' ? "text-red-500 fill-red-500" :
                                  task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                  "text-blue-500 fill-blue-500"
                                )} />
                                <span className="text-[11px] font-medium">{task.priority}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="text-[11px]">
                                  {task.dueDateConfig?.type === 'none' && 'No due date'}
                                  {task.dueDateConfig?.type === 'on-date' && `On ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
                                  {task.dueDateConfig?.type === 'relative' && `${task.dueDateConfig.days} ${task.dueDateConfig.unit} ${task.dueDateConfig.direction} ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground pl-2 border-l-2 border-border/50">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grouped Tasks */}
                {stages.map((stage) => {
                  const groupTasks = [...stage.tasks, ...tasks.filter(t => t.groupId === stage.id)];
                  if (groupTasks.length === 0) return null;

                  return (
                    <div key={stage.id} className="border border-border rounded-lg p-4 bg-card z-10 relative">
                      <div className="mb-3 flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={stage.name}
                            onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                            className="font-medium h-9 border-transparent hover:border-border focus:border-accent bg-transparent px-0 text-foreground"
                            placeholder="Group Name"
                          />
                          <Input
                            value={stage.description || ''}
                            onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                            className="text-sm h-8 border-transparent hover:border-border focus:border-accent bg-transparent px-0 text-muted-foreground"
                            placeholder="Add description..."
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStage(stage.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {groupTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{task.name}</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider">
                                  {task.department}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Flag className={cn(
                                    "w-3 h-3",
                                    task.priority === 'High' ? "text-red-500 fill-red-500" :
                                    task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                    "text-blue-500 fill-blue-500"
                                  )} />
                                  <span className="text-[11px] font-medium">{task.priority}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-[11px]">
                                    {task.dueDateConfig?.type === 'none' && 'No due date'}
                                    {task.dueDateConfig?.type === 'on-date' && `On ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
                                    {task.dueDateConfig?.type === 'relative' && `${task.dueDateConfig.days} ${task.dueDateConfig.unit} ${task.dueDateConfig.direction} ${REFERENCE_DATE_LABELS[task.dueDateConfig.referenceDate || 'hire-date']}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground pl-2 border-l-2 border-border/50">{task.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
