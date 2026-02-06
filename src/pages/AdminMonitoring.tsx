import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Trash2,
  MessageSquare,
  Lock,
  Flag,
  Calendar,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Workflow, TaskStatus, Task } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mockData';
import { getWorkflows, deleteWorkflow, updateWorkflow,  isTaskAvailable,
  getEmployeeAccounts,
  updateEmployeeAccount,
  addCommentToTask,
  addReplyToComment,
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { TaskCommentModal } from '@/components/tasks/TaskCommentModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
// ... existing imports



const ITEMS_PER_PAGE = 10;

interface WorkflowWithStats extends Workflow {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  needInfoTasks: number;
  overdueTasks: number;
}

export default function AdminMonitoring() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  // Removed pagination for sectioned view
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTaskData, setActiveTaskData] = useState<{ task: Task; workflow: Workflow } | null>(null);
  
  // Cancellation state
  const [workflowToCancel, setWorkflowToCancel] = useState<Workflow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Delete confirm state
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  const loadWorkflows = useCallback(() => {
    setWorkflows(getWorkflows());
  }, []);

  useEffect(() => {
    loadWorkflows();

    // Listen for workflow updates from other pages
    const handleWorkflowsUpdated = () => {
      loadWorkflows();
    };
    window.addEventListener('workflowsUpdated', handleWorkflowsUpdated);
    return () => {
      window.removeEventListener('workflowsUpdated', handleWorkflowsUpdated);
    };
  }, [loadWorkflows]);



  // Calculate workflow stats
  const workflowsWithStats: WorkflowWithStats[] = useMemo(() => {
    return workflows.map((workflow) => {
      const allTasks = workflow.stages.flatMap((s) => s.tasks);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'Done').length;
      const pendingTasks = allTasks.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
      const needInfoTasks = allTasks.filter((t) => t.status === 'Need Info').length;
      // Mock overdue calculation (in real app, compare with due dates)
      const overdueTasks = allTasks.filter(
        (t) => (t.status === 'Open' || t.status === 'In Progress') && t.dueDate && new Date(t.dueDate) < new Date()
      ).length;

      return {
        ...workflow,
        totalTasks,
        completedTasks,
        pendingTasks,
        needInfoTasks,
        overdueTasks,
      };
    });
  }, [workflows]);

  // Derived active task and workflow for modal to ensure live updates
  const activeTask = useMemo(() => {
    if (!activeTaskData) return null;
    const wf = workflows.find(w => w.id === activeTaskData.workflow.id);
    if (!wf) return null;
    const allTasks = wf.stages.flatMap(s => s.tasks);
    return allTasks.find(t => t.id === activeTaskData.task.id) || null;
  }, [workflows, activeTaskData]);

  const activeWorkflow = useMemo(() => {
     if (!activeTaskData) return null;
     return workflows.find(w => w.id === activeTaskData.workflow.id) || null;
  }, [workflows, activeTaskData]);

  // Get unique clients
  const clients = useMemo(() => {
    const clientSet = new Set(workflowsWithStats.map((w) => w.client.name));
    return Array.from(clientSet);
  }, [workflowsWithStats]);

  // Apply filters
  const filteredWorkflows = useMemo(() => {
    return workflowsWithStats.filter((workflow) => {
      const matchesSearch =
        workflow.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.client.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
      const matchesType = typeFilter === 'all' || workflow.type === typeFilter;
      const matchesClient = clientFilter === 'all' || workflow.client.name === clientFilter;
      return matchesSearch && matchesStatus && matchesType && matchesClient;
    });
  }, [workflowsWithStats, searchQuery, statusFilter, typeFilter, clientFilter]);



  // Group workflows by status
  const groupedWorkflows = useMemo(() => {
    return {
      inProgress: filteredWorkflows.filter(w => w.status === 'In Progress'),
      cancelled: filteredWorkflows.filter(w => w.status === 'Cancelled'),
      completed: filteredWorkflows.filter(w => w.status === 'Completed'),
    };
  }, [filteredWorkflows]);

  const toggleWorkflow = (workflowId: string) => {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
      } else {
        next.add(workflowId);
      }
      return next;
    });
  };

  const handleEditWorkflow = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation();
    const route = workflow.type === 'Onboarding' ? '/start/onboarding' : '/start/offboarding';
    navigate(`${route}?edit=${workflow.id}`);
  };

  const handleDeleteWorkflow = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation();
    setWorkflowToDelete(workflow);
  };
  
  const handleConfirmDelete = () => {
    if (!workflowToDelete) return;

    deleteWorkflow(workflowToDelete.id);
    loadWorkflows();
    setWorkflowToDelete(null);

    toast({
      title: 'Workflow Deleted',
      description: `Successfully deleted the workflow for ${workflowToDelete.employee.name}.`,
    });
  };

  const handleInitiateCancel = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation();
    setWorkflowToCancel(workflow);
    setCancelReason('');
  };

  const handleConfirmCancel = () => {
    if (!workflowToCancel || !cancelReason.trim()) return;

    const updatedWorkflow: Workflow = {
      ...workflowToCancel,
      status: 'Cancelled',
      cancellationReason: cancelReason,
      cancelledBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
        avatar: currentUser.avatar,
        isAdmin: currentUser.isAdmin
      },
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateWorkflow(updatedWorkflow);
    loadWorkflows();
    setWorkflowToCancel(null);
    setCancelReason('');

    toast({
      title: 'Workflow Cancelled',
      description: `The workflow for ${workflowToCancel.employee.name} has been cancelled.`,
    });
  };

  // Summary stats
  const totalWorkflows = workflowsWithStats.length;
  const inProgressWorkflows = workflowsWithStats.filter((w) => w.status === 'In Progress').length;
  const workflowsWithIssues = workflowsWithStats.filter(
    (w) => w.needInfoTasks > 0 || w.overdueTasks > 0
  ).length;

  return (
    <AppLayout title="Task Monitoring" subtitle="Admin overview of all workflows and tasks">
      <div className="space-y-6 pb-20">
        {/* Dashboard Charts */}


        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">


            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Offboarding">Offboarding</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs View */}
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              In Progress
              <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                {groupedWorkflows.inProgress.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              Cancelled
              <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                {groupedWorkflows.cancelled.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Completed
              <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                {groupedWorkflows.completed.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {groupedWorkflows.inProgress.length > 0 ? (
              groupedWorkflows.inProgress.map((workflow) => (
                <WorkflowMonitorCard
                  key={workflow.id}
                  workflow={workflow}
                  isExpanded={expandedWorkflows.has(workflow.id)}
                  onToggle={() => toggleWorkflow(workflow.id)}
                  onEdit={(e) => handleEditWorkflow(e, workflow)}
                  onDelete={(e) => handleDeleteWorkflow(e, workflow)}
                  onCancel={(e) => handleInitiateCancel(e, workflow)}
                  onViewActivity={(task) => setActiveTaskData({ task, workflow })}
                />
              ))
            ) : (
               <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No active workflows found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {groupedWorkflows.cancelled.length > 0 ? (
              groupedWorkflows.cancelled.map((workflow) => (
                <WorkflowMonitorCard
                  key={workflow.id}
                  workflow={workflow}
                  isExpanded={expandedWorkflows.has(workflow.id)}
                  onToggle={() => toggleWorkflow(workflow.id)}
                  onDelete={(e) => handleDeleteWorkflow(e, workflow)}
                  onViewActivity={(task) => setActiveTaskData({ task, workflow })}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No cancelled workflows found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {groupedWorkflows.completed.length > 0 ? (
              groupedWorkflows.completed.map((workflow) => (
                <WorkflowMonitorCard
                  key={workflow.id}
                  workflow={workflow}
                  isExpanded={expandedWorkflows.has(workflow.id)}
                  onToggle={() => toggleWorkflow(workflow.id)}
                  onDelete={(e) => handleDeleteWorkflow(e, workflow)}
                  onViewActivity={(task) => setActiveTaskData({ task, workflow })}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No completed workflows found.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!workflowToCancel} onOpenChange={(open) => !open && setWorkflowToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the workflow for <strong>{workflowToCancel?.employee.name}</strong>? 
              This action cannot be undone. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason" className="mb-2 block">Reason for Cancellation</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowToCancel(null)}>Keep Workflow</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim()}
            >
              Cancel Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the workflow for <strong>{workflowToDelete?.employee.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              Delete Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskCommentModal 
        task={activeTask}
        workflow={activeWorkflow}
        isOpen={!!activeTaskData && !!activeTask && !!activeWorkflow}
        onClose={() => setActiveTaskData(null)}
        currentUser={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isAdmin: !!currentUser.isAdmin,
          avatar: currentUser.avatar
        }}
        onAddComment={(text) => {
          if (activeTask && activeWorkflow) {
            addCommentToTask(activeWorkflow.id, activeTask.id, text, {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              isAdmin: !!currentUser.isAdmin,
              avatar: currentUser.avatar
            });
            loadWorkflows();
          }
        }}
        onAddReply={(commentId, text) => {
           if (activeTask && activeWorkflow) {
            addReplyToComment(activeWorkflow.id, activeTask.id, commentId, text, {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              isAdmin: !!currentUser.isAdmin,
              avatar: currentUser.avatar
            });
            loadWorkflows();
           }
        }}
      />

    </AppLayout>
  );
}



interface WorkflowMonitorCardProps {
  workflow: WorkflowWithStats;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onCancel?: (e: React.MouseEvent) => void;
  onViewActivity: (task: Task) => void;
}

function WorkflowMonitorCard({ workflow, isExpanded, onToggle, onEdit, onDelete, onCancel, onViewActivity }: WorkflowMonitorCardProps) {
  const progress = workflow.totalTasks > 0 
    ? Math.round((workflow.completedTasks / workflow.totalTasks) * 100) 
    : 0;
  
  const hasIssues = workflow.needInfoTasks > 0 || workflow.overdueTasks > 0;

  return (
    <div className={cn(
      'bg-card border rounded-xl overflow-hidden transition-all',
      hasIssues ? 'border-warning' : 'border-border',
      workflow.status === 'Cancelled' && 'opacity-75 grayscale bg-muted/10'
    )}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground">{workflow.employee.name}</h3>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                workflow.type === 'Onboarding' 
                  ? 'bg-accent/10 text-accent' 
                  : 'bg-warning/10 text-warning'
              )}>
                {workflow.type}
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                workflow.status === 'Completed'
                  ? 'bg-success/10 text-success'
                  : workflow.status === 'Cancelled'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              )}>
                {workflow.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {workflow.client.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {workflow.employee.position}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {workflow.overdueTasks > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{workflow.overdueTasks} overdue</span>
              </div>
            )}
            {workflow.needInfoTasks > 0 && (
              <div className="flex items-center gap-1 text-info">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{workflow.needInfoTasks} need info</span>
              </div>
            )}
            <div className="w-32">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <ProgressBar value={progress} variant={progress === 100 ? 'success' : 'accent'} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 border-l border-border pl-4">
              {workflow.status === 'In Progress' && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Edit Workflow"
                  onClick={onEdit}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {workflow.status === 'In Progress' && onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Cancel Workflow"
                  onClick={onCancel}
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  workflow.status === 'In Progress' 
                    ? "opacity-50 cursor-not-allowed text-muted-foreground" 
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
                onClick={workflow.status === 'In Progress' ? undefined : onDelete}
                disabled={workflow.status === 'In Progress'}
                title={workflow.status === 'In Progress' ? "Cannot delete in-progress workflow" : "Delete Workflow"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {workflow.status === 'Cancelled' && workflow.cancellationReason && (
            <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive text-sm">Workflow Cancelled</h4>
                {workflow.cancelledBy && workflow.cancelledAt && (
                   <p className="text-xs text-destructive/80 mb-1">
                      Cancelled by {workflow.cancelledBy.name} on {new Date(workflow.cancelledAt).toLocaleDateString()} at {new Date(workflow.cancelledAt).toLocaleTimeString()}
                   </p>
                )}
                <p className="text-sm text-destructive/90">{workflow.cancellationReason}</p>
              </div>
            </div>
          )}
          {workflow.stages.map((stage, stageIndex) => {
            const stageTasks = stage.tasks;
            const stageCompleted = stageTasks.filter((t) => t.status === 'Done').length;
            const stageProgress = stageTasks.length > 0 
              ? Math.round((stageCompleted / stageTasks.length) * 100) 
              : 0;

            return (
              <div key={stage.id} className="border-b border-border last:border-b-0">
                {/* Stage Header */}
                <div className="px-6 py-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      Stage {stageIndex + 1}: {stage.name}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                        {stageCompleted}/{stageTasks.length} tasks
                        </span>
                        <div className="w-20">
                        <ProgressBar 
                            value={stageProgress} 
                            size="sm" 
                            variant={stageProgress === 100 ? 'success' : 'default'} 
                        />
                        </div>
                    </div>
                  </div>
                  {stage.description && (
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  )}
                </div>

                {/* Tasks */}
                <div className="divide-y divide-border">
                  {stage.tasks.map((task) => {
                    const isAvailable = isTaskAvailable(workflow, task.id);
                    return (
                    <div key={task.id} className={cn("px-6 py-3", !isAvailable && "opacity-60 bg-muted/20")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isAvailable ? <TaskStatusIcon status={task.status} /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                          <div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">{task.name}</p>
                                    {!isAvailable && (
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                                            Locked
                                        </span>
                                    )}
                                </div>
                                {task.description && (
                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {task.assignedTo?.name || 'Unassigned'} • {task.department}
                              {task.priority && (
                                <PriorityBadge priority={task.priority} className="ml-2" />
                              )}
                              {task.dueDate && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            
                            {/* Dependency Info */}
                            {!isAvailable && task.dependentOn && task.dependentOn.length > 0 && (
                                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Waiting for dependencies
                                </p>
                            )}
                          </div>
                        </div>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      {/* Task Notes */}

                    {/* Comments */}
                    {/* Comments / Activity Action */}
                    <div className="px-6 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewActivity(task)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {task.comments && task.comments.length > 0 
                          ? `View Activity (${task.comments.length})` 
                          : 'Add Comment'}
                      </Button>
                    </div>
                  </div>
                  );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'Done':
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case 'Need Info':
      return <AlertCircle className="w-5 h-5 text-info" />;
    default:
      return <Clock className="w-5 h-5 text-warning" />;
  }
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded text-xs font-medium',
      status === 'Done' && 'bg-success/10 text-success',
      (status === 'Open' || status === 'In Progress') && 'bg-warning/10 text-warning',
      status === 'Need Info' && 'bg-info/10 text-info'
    )}>
      {status}
    </span>
  );
}
