
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Filter, Search, LayoutGrid, List } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Stage, Workflow, TaskStatus } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskExecutionCard } from '@/components/tasks/TaskExecutionCard';
import { TaskKanbanCard } from '@/components/tasks/TaskKanbanCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { 
  getWorkflows, 
  updateWorkflow, 
  isTaskAvailable, 
  getNextTask, 
  addNotification,
  addCommentToTask,
  addReplyToComment,
  completeWorkflow
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

interface TaskWithContext {
  task: Task;
  workflow: Workflow;
  stage: Stage;
  isAvailable: boolean;
}

type ViewMode = 'list' | 'kanban';

export default function MyTasks() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

  // Get all tasks assigned to the current user
  const myTasks: TaskWithContext[] = useMemo(() => {
    if (!user) return [];
    
    return workflows.flatMap((workflow) =>
      workflow.stages.flatMap((stage) =>
        stage.tasks
          .filter((task) => task.assignedTo?.id === user.id)
          .map((task) => ({ 
            task, 
            workflow, 
            stage,
            isAvailable: isTaskAvailable(workflow, task.id)
          }))
      )
    );
  }, [workflows, user]);

  const selectedTaskWithContext = useMemo(() => {
    return selectedTaskId ? myTasks.find(t => t.task.id === selectedTaskId) || null : null;
  }, [myTasks, selectedTaskId]);

  // Get unique clients for filter
  const clients = useMemo(() => {
    const clientSet = new Set(myTasks.map((t) => t.workflow.client.name));
    return Array.from(clientSet);
  }, [myTasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return myTasks.filter(({ task, workflow }) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.employee.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesType = typeFilter === 'all' || workflow.type === typeFilter;
      const matchesClient = clientFilter === 'all' || workflow.client.name === clientFilter;
      return matchesSearch && matchesStatus && matchesType && matchesClient;
    });
  }, [myTasks, searchQuery, statusFilter, typeFilter, clientFilter]);

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    return {
      'Open': filteredTasks.filter((t) => t.task.status === 'Open'),
      'In Progress': filteredTasks.filter((t) => t.task.status === 'In Progress'),
      'Need Info': filteredTasks.filter((t) => t.task.status === 'Need Info'),
      'Done': filteredTasks.filter((t) => t.task.status === 'Done'),
    };
  }, [filteredTasks]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus, note?: string, output?: { email?: string, password?: string }) => {
    const workflowToUpdate = workflows.find(w => 
      w.stages.some(s => s.tasks.some(t => t.id === taskId))
    );

    if (workflowToUpdate) {
      const updatedWorkflow = {
        ...workflowToUpdate,
        employee: {
          ...workflowToUpdate.employee,
          email: output?.email || workflowToUpdate.employee.email,
        },
        stages: workflowToUpdate.stages.map(s => ({
          ...s,
          tasks: s.tasks.map(t => 
            t.id === taskId ? { 
              ...t, 
              status: newStatus, 
              notes: note || t.notes,
              outputValue: output || t.outputValue 
            } : t
          )
        }))
      };

      // Handle sequential notifications
      if (newStatus === 'Done') {
        const nextTask = getNextTask(workflowToUpdate, taskId);
        if (nextTask && nextTask.assignedTo) {
          addNotification({
            type: 'task_assigned',
            message: `It's time to start your task: "${nextTask.name}" for ${workflowToUpdate.employee.name}`,
            workflowId: workflowToUpdate.id,
            taskId: nextTask.id,
          });
        }
      }

      // Check if all tasks in the workflow are done
      const allDone = updatedWorkflow.stages.every(s => 
        s.tasks.every(t => t.status === 'Done')
      );
      
      if (allDone) {
        completeWorkflow(updatedWorkflow);
      } else {
        updatedWorkflow.status = 'In Progress';
        updateWorkflow(updatedWorkflow);
      }
      loadWorkflows();
      
      toast({
        title: 'Task Updated',
        description: `Task status changed to ${newStatus}.`,
      });
    }
  };

  // Helper to ensure we have a valid ID even for legacy data
  const getEmpId = (workflow: any) => {
    return workflow.employee.id || workflow.employee.email || workflow.employee.name;
  };

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Group filtered tasks by employee
  const employeesWithTasks = useMemo(() => {
    const groups = new Map();
    filteredTasks.forEach(({ task, workflow }) => {
      const empId = getEmpId(workflow);
      if (!groups.has(empId)) {
        groups.set(empId, {
          id: empId, // Store the resolved ID
          employee: workflow.employee,
          client: workflow.client,
          tasks: [],
          pendingCount: 0
        });
      }
      const group = groups.get(empId);
      group.tasks.push(task);
      if (task.status !== 'Done') {
        group.pendingCount++;
      }
    });
    return Array.from(groups.values());
  }, [filteredTasks]);

  // If an employee is selected, filter the tasks for the view
  const displayTasks = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return filteredTasks.filter(t => getEmpId(t.workflow) === selectedEmployeeId);
  }, [filteredTasks, selectedEmployeeId]);

  // Recalculate stats for the *selected* view (all or specific employee)
  // Actually the top stats should probably reflect GLOBAL status always? 
  // Or context specific? Let's keep them global for "My Assigned Tasks" overview.
  const openCount = myTasks.filter((t) => t.task.status === 'Open').length;
  const inProgressCount = myTasks.filter((t) => t.task.status === 'In Progress').length;
  const needInfoCount = myTasks.filter((t) => t.task.status === 'Need Info').length;
  const doneCount = myTasks.filter((t) => t.task.status === 'Done').length;

  if (!user) return null;

  const handleEmployeeClick = (empId: string) => {
    setSelectedEmployeeId(empId);
    // Reset selection and filters when switching views to show everything
    setSelectedTaskId(null);
    setStatusFilter('all');
    setTypeFilter('all');
    setClientFilter('all');
    setSearchQuery(''); 
  };

  return (
    <AppLayout title="My Assigned Tasks" subtitle={selectedEmployeeId ? "Employee Details" : `${myTasks.length} total tasks across ${employeesWithTasks.length} employees`}>
      <div className="space-y-6">
        {/* Stats Summary - Always Global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xl font-bold text-muted-foreground">{openCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="font-semibold text-foreground">Not started</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-xl font-bold text-warning">{inProgressCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="font-semibold text-foreground">Active tasks</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
              <span className="text-xl font-bold text-info">{needInfoCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Need Info</p>
              <p className="font-semibold text-foreground">Awaiting input</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <span className="text-xl font-bold text-success">{doneCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-semibold text-foreground">Tasks done</p>
            </div>
          </div>
        </div>

        {/* Global Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks or employee names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Need Info">Need Info</SelectItem>
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

        {/* Content Area */}
        {!selectedEmployeeId ? (
          /* Employee Grid View */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {employeesWithTasks.map((group) => (
              <div 
                key={group.id}
                onClick={() => handleEmployeeClick(group.id)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-sidebar-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-secondary-foreground">
                    {group.employee.name.charAt(0)}
                  </div>
                  <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                    {group.pendingCount} Tasks
                  </div>
                </div>
                
                <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                  {group.employee.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{group.employee.position} • {group.employee.department}</p>
                
                <div className="pt-4 border-t border-border flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                        {group.client.name.charAt(0)}
                     </div>
                     <span className="text-sm text-foreground">{group.client.name}</span>
                   </div>
                </div>
              </div>
            ))}
            
            {employeesWithTasks.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No employees found with assigned tasks matching your filters.</p>
              </div>
            )}
          </div>
        ) : (
          /* Task Drill-Down View */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => setSelectedEmployeeId(null)}
                    className="gap-2 pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
                >
                    ← Back to Employees
                </Button>
                {(() => {
                    const emp = myTasks.find(t => getEmpId(t.workflow) === selectedEmployeeId)?.workflow.employee;
                    return emp ? (
                    <div className="flex items-center gap-3 border-l pl-4 border-border">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                            {emp.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-sm leading-none">{emp.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                        </div>
                    </div>
                    ) : null;
                })()}
              </div>

              {/* View Toggle - Moved here */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-1 h-8"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="gap-1 h-8"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </Button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-4">
                {displayTasks.map(({ task, workflow, stage, isAvailable }) => (
                    <TaskExecutionCard
                      key={task.id}
                      task={task}
                      workflow={workflow}
                      stage={stage}
                      isAvailable={isAvailable}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedTaskId(task.id)}
                    />
                  ))
                }
                {displayTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                    <p>No tasks found for this employee.</p>
                  </div>
                )}
              </div>
            ) : (
             /* Kanban View logic adapted for displayTasks */
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Open', 'In Progress', 'Need Info', 'Done'].map(status => {
                  const tasks = displayTasks.filter(t => t.task.status === status);
                  const statusColor = 
                    status === 'Open' ? 'muted' :
                    status === 'In Progress' ? 'warning' :
                    status === 'Need Info' ? 'info' : 'success';
                  
                  return (
                    <div key={status} className={`bg-${statusColor}/5 border-t-4 border-${status === 'Open' ? 'muted-foreground/40' : statusColor} rounded-xl p-4 min-h-[200px]`}>
                      <div className="flex items-center gap-2 mb-4">
                         <div className={`w-3 h-3 rounded-full bg-${status === 'Open' ? 'muted-foreground/40' : statusColor}`} />
                         <h3 className="font-semibold text-foreground">{status}</h3>
                         <span className="text-sm text-muted-foreground">({tasks.length})</span>
                      </div>
                      <div className="space-y-3">
                        {tasks.map(({ task, workflow, stage, isAvailable }) => (
                          <TaskKanbanCard
                            key={task.id}
                            task={task}
                            workflow={workflow}
                            stage={stage}
                            isAvailable={isAvailable}
                            onStatusChange={handleStatusChange}
                            onClick={() => setSelectedTaskId(task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
             </div>
            )}
          </div>
        )}

      <TaskDetailModal
        task={selectedTaskWithContext?.task || null}
        workflow={selectedTaskWithContext?.workflow || null}
        isOpen={!!selectedTaskWithContext}
        onClose={() => setSelectedTaskId(null)}
        isAvailable={selectedTaskWithContext?.isAvailable}
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: !!user.isAdmin, 
          avatar: user.avatar
        }}
        onStatusChange={(status, note) => {
           if (selectedTaskWithContext) {
             handleStatusChange(selectedTaskWithContext.task.id, status, note);
           }
        }}
        onAddComment={(text) => {
             if (selectedTaskWithContext) {
                addCommentToTask(selectedTaskWithContext.workflow.id, selectedTaskWithContext.task.id, text, {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  isAdmin: !!user.isAdmin,
                  avatar: user.avatar
                });
                window.dispatchEvent(new Event('workflowsUpdated'));
             }
        }}
        onAddReply={(commentId, text) => {
             if (selectedTaskWithContext) {
                addReplyToComment(selectedTaskWithContext.workflow.id, selectedTaskWithContext.task.id, commentId, text, {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  isAdmin: !!user.isAdmin,
                  avatar: user.avatar
                });
                window.dispatchEvent(new Event('workflowsUpdated'));
             }
        }}
      />
      </div>
    </AppLayout>
  );

}

