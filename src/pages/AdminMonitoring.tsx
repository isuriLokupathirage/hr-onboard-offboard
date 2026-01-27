import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockWorkflows } from '@/data/mockData';
import { Workflow, TaskStatus } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';

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

  // Calculate workflow stats
  const workflowsWithStats: WorkflowWithStats[] = useMemo(() => {
    return mockWorkflows.map((workflow) => {
      const allTasks = workflow.stages.flatMap((s) => s.tasks);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'Done').length;
      const pendingTasks = allTasks.filter((t) => t.status === 'Pending').length;
      const needInfoTasks = allTasks.filter((t) => t.status === 'Need Information').length;
      // Mock overdue calculation (in real app, compare with due dates)
      const overdueTasks = allTasks.filter(
        (t) => t.status === 'Pending' && t.dueDate && new Date(t.dueDate) < new Date()
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
  }, []);

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

  // Summary stats
  const totalWorkflows = workflowsWithStats.length;
  const inProgressWorkflows = workflowsWithStats.filter((w) => w.status === 'In Progress').length;
  const workflowsWithIssues = workflowsWithStats.filter(
    (w) => w.needInfoTasks > 0 || w.overdueTasks > 0
  ).length;

  return (
    <AppLayout title="Task Monitoring" subtitle="Admin overview of all workflows and tasks">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalWorkflows}</p>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{inProgressWorkflows}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalWorkflows - inProgressWorkflows}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{workflowsWithIssues}</p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
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
          {filteredWorkflows.map((workflow) => (
            <WorkflowMonitorCard
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedWorkflows.has(workflow.id)}
              onToggle={() => toggleWorkflow(workflow.id)}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

interface WorkflowMonitorCardProps {
  workflow: WorkflowWithStats;
  isExpanded: boolean;
  onToggle: () => void;
}

function WorkflowMonitorCard({ workflow, isExpanded, onToggle }: WorkflowMonitorCardProps) {
  const progress = workflow.totalTasks > 0 
    ? Math.round((workflow.completedTasks / workflow.totalTasks) * 100) 
    : 0;
  
  const hasIssues = workflow.needInfoTasks > 0 || workflow.overdueTasks > 0;

  return (
    <div className={cn(
      'bg-card border rounded-xl overflow-hidden transition-all',
      hasIssues ? 'border-warning' : 'border-border'
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
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {workflow.stages.map((stage, stageIndex) => {
            const stageTasks = stage.tasks;
            const stageCompleted = stageTasks.filter((t) => t.status === 'Done').length;
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
                    <div key={task.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TaskStatusIcon status={task.status} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{task.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.assignedTo?.name || 'Unassigned'} • {task.department}
                          </p>
                        </div>
                      </div>
                      <TaskStatusBadge status={task.status} />
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
    case 'Done':
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
      status === 'Done' && 'bg-success/10 text-success',
      status === 'Pending' && 'bg-warning/10 text-warning',
      status === 'Need Information' && 'bg-info/10 text-info'
    )}>
      {status}
    </span>
  );
}
