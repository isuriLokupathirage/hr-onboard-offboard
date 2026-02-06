
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

  const openCount = myTasks.filter((t) => t.task.status === 'Open').length;
  const inProgressCount = myTasks.filter((t) => t.task.status === 'In Progress').length;
  const needInfoCount = myTasks.filter((t) => t.task.status === 'Need Info').length;
  const doneCount = myTasks.filter((t) => t.task.status === 'Done').length;

  if (!user) return null;

  return (
    <AppLayout title="My Assigned Tasks" subtitle={`${myTasks.length} total tasks`}>
      <div className="space-y-6">
        {/* Stats Summary */}
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

        {/* Filters and View Toggle */}
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

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 ml-auto">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-1"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="gap-1"
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </Button>
            </div>
          </div>
        </div>

        {/* Task Views */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No tasks match your filters</p>
              </div>
            ) : (
              filteredTasks.map(({ task, workflow, stage, isAvailable }) => (
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
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Open Column - Gray/Muted */}
            <div className="bg-muted/30 border-t-4 border-muted-foreground/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                <h3 className="font-semibold text-foreground">Open</h3>
                <span className="text-sm text-muted-foreground">({tasksByStatus['Open'].length})</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus['Open'].map(({ task, workflow, stage, isAvailable }) => (
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

            {/* In Progress Column - Yellow/Warning */}
            <div className="bg-warning/5 border-t-4 border-warning rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <h3 className="font-semibold text-foreground">In Progress</h3>
                <span className="text-sm text-muted-foreground">({tasksByStatus['In Progress'].length})</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus['In Progress'].map(({ task, workflow, stage, isAvailable }) => (
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

            {/* Need Information Column - Blue/Info */}
            <div className="bg-info/5 border-t-4 border-info rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-info" />
                <h3 className="font-semibold text-foreground">Need Info</h3>
                <span className="text-sm text-muted-foreground">({tasksByStatus['Need Info'].length})</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus['Need Info'].map(({ task, workflow, stage, isAvailable }) => (
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

            {/* Completed Column - Green/Success */}
            <div className="bg-success/5 border-t-4 border-success rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-success" />
                <h3 className="font-semibold text-foreground">Done</h3>
                <span className="text-sm text-muted-foreground">({tasksByStatus['Done'].length})</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus['Done'].map(({ task, workflow, stage, isAvailable }) => (
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
          isAdmin: !!user.isAdmin, // Ensure boolean
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

