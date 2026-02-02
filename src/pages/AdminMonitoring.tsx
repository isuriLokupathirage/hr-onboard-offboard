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
  Flag,
  Calendar
} from 'lucide-react';
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
import { getWorkflows, deleteWorkflow, updateWorkflow, getEmployeeAccounts, updateEmployeeAccount, addCommentToTask, addReplyToComment } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { TaskCommentModal } from '@/components/tasks/TaskCommentModal';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTaskData, setActiveTaskData] = useState<{ task: Task; workflow: Workflow } | null>(null);
  
  // Cancellation state
  const [workflowToCancel, setWorkflowToCancel] = useState<Workflow | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  useEffect(() => {
    // Deactivate employee if offboarding workflow is completed
    workflows.forEach((wf) => {
      if (wf.type === 'Offboarding' && wf.status === 'Completed') {
        const allTasks = wf.stages.flatMap((s) => s.tasks);
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((t) => t.status === 'Completed').length;
        if (totalTasks > 0 && completedTasks === totalTasks) {
          // Find employee by email
          const employees = getEmployeeAccounts();
          const empIdx = employees.findIndex(e => e.email === wf.employee.email);
          if (empIdx !== -1 && employees[empIdx].status !== 'Inactive') {
            updateEmployeeAccount({ ...employees[empIdx], status: 'Inactive' });
          }
        }
      }
    });
  }, [workflows]);

  // Calculate workflow stats
  const workflowsWithStats: WorkflowWithStats[] = useMemo(() => {
    return workflows.map((workflow) => {
      const allTasks = workflow.stages.flatMap((s) => s.tasks);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'Completed').length;
      const pendingTasks = allTasks.filter((t) => t.status === 'Not Started' || t.status === 'In Progress').length;
      const needInfoTasks = allTasks.filter((t) => t.status === 'Need Information').length;
      // Mock overdue calculation (in real app, compare with due dates)
      const overdueTasks = allTasks.filter(
        (t) => (t.status === 'Not Started' || t.status === 'In Progress') && t.dueDate && new Date(t.dueDate) < new Date()
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, clientFilter]);

  const totalPages = Math.ceil(filteredWorkflows.length / ITEMS_PER_PAGE);
  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  const handleDeleteWorkflow = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the workflow for ${name}?`)) {
      deleteWorkflow(id);
      loadWorkflows();
      toast({
        title: 'Workflow Deleted',
        description: `Successfully deleted the workflow for ${name}.`,
      });
    }
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

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

        {/* Workflow List */}
        <div className="space-y-4">
          {paginatedWorkflows.map((workflow) => (
            <WorkflowMonitorCard
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedWorkflows.has(workflow.id)}
               onToggle={() => toggleWorkflow(workflow.id)}
               onDelete={(e) => handleDeleteWorkflow(e, workflow.id, workflow.employee.name)}
               onCancel={(e) => handleInitiateCancel(e, workflow)}
               onViewActivity={(task) => setActiveTaskData({ task, workflow })}
             />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkflows.length)}
              </span> of{' '}
              <span className="font-medium text-foreground">{filteredWorkflows.length}</span> workflows
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-1 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 p-0",
                      currentPage === page && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-1 px-3"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
  onDelete?: (e: React.MouseEvent) => void;
  onCancel?: (e: React.MouseEvent) => void;
  onViewActivity: (task: Task) => void;
}

function WorkflowMonitorCard({ workflow, isExpanded, onToggle, onDelete, onCancel, onViewActivity }: WorkflowMonitorCardProps) {
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
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                title="Delete Workflow"
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
                <p className="text-sm text-destructive/90">{workflow.cancellationReason}</p>
              </div>
            </div>
          )}
          {workflow.stages.map((stage, stageIndex) => {
            const stageTasks = stage.tasks;
            const stageCompleted = stageTasks.filter((t) => t.status === 'Completed').length;
            const stageProgress = stageTasks.length > 0 
              ? Math.round((stageCompleted / stageTasks.length) * 100) 
              : 0;

            return (
              <div key={stage.id} className="border-b border-border last:border-b-0">
                {/* Stage Header */}
                <div className="px-6 py-3 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Stage {stageIndex + 1}: {stage.name}
                    </span>
                  </div>
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

                {/* Tasks */}
                <div className="divide-y divide-border">
                  {stage.tasks.map((task) => (
                    <div key={task.id} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TaskStatusIcon status={task.status} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.assignedTo?.name || 'Unassigned'} • {task.department}
                              {task.priority && (
                                <span className={cn(
                                  "ml-2 inline-flex items-center gap-1 text-xs font-medium",
                                  task.priority === 'High' && "text-red-600",
                                  task.priority === 'Medium' && "text-yellow-600",
                                  task.priority === 'Low' && "text-green-600"
                                )}>
                                  <Flag className="w-3 h-3" /> {task.priority}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </p>
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
                  ))}
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
    case 'Completed':
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case 'Need Information':
      return <AlertCircle className="w-5 h-5 text-info" />;
    default:
      return <Clock className="w-5 h-5 text-warning" />;
  }
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded text-xs font-medium',
      status === 'Completed' && 'bg-success/10 text-success',
      (status === 'Not Started' || status === 'In Progress') && 'bg-warning/10 text-warning',
      status === 'Need Information' && 'bg-info/10 text-info'
    )}>
      {status}
    </span>
  );
}
