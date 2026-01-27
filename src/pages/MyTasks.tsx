import { useState, useMemo } from 'react';
import { Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockWorkflows, currentUser } from '@/data/mockData';
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

interface TaskWithContext {
  task: Task;
  workflow: Workflow;
  stage: Stage;
}

export default function MyTasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Get all tasks assigned to the current user
  const myTasks: TaskWithContext[] = useMemo(() => {
    return mockWorkflows.flatMap((workflow) =>
      workflow.stages.flatMap((stage) =>
        stage.tasks
          .filter((task) => task.assignedTo?.id === currentUser.id)
          .map((task) => ({ task, workflow, stage }))
      )
    );
  }, []);

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

  const handleStatusChange = (taskId: string, newStatus: TaskStatus, note?: string) => {
    // In a real app, this would update the backend
    console.log(`Task ${taskId} status changed to ${newStatus}`, note ? `Note: ${note}` : '');
  };

  const pendingCount = myTasks.filter((t) => t.task.status === 'Pending').length;
  const needInfoCount = myTasks.filter((t) => t.task.status === 'Need Information').length;
  const doneCount = myTasks.filter((t) => t.task.status === 'Done').length;

  return (
    <AppLayout title="My Assigned Tasks" subtitle={`${myTasks.length} total tasks`}>
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-xl font-bold text-warning">{pendingCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-semibold text-foreground">Tasks to complete</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
              <span className="text-xl font-bold text-info">{needInfoCount}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Need Information</p>
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

        {/* Filters */}
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
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Need Information">Need Information</SelectItem>
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

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">No tasks match your filters</p>
            </div>
          ) : (
            filteredTasks.map(({ task, workflow, stage }) => (
              <TaskExecutionCard
                key={task.id}
                task={task}
                workflow={workflow}
                stage={stage}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
