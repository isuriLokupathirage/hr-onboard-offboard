import { useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, WorkflowTypeBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { mockWorkflows, clients } from '@/data/mockData';
import { WorkflowType, WorkflowStatus } from '@/types/workflow';

export default function Workflows() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkflowType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const matchesSearch =
      workflow.employee.name.toLowerCase().includes(search.toLowerCase()) ||
      workflow.employee.position.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || workflow.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesClient = clientFilter === 'all' || workflow.client.id === clientFilter;

    return matchesSearch && matchesType && matchesStatus && matchesClient;
  });

  return (
    <AppLayout title="Active Workflows" subtitle="Manage all employee onboarding and offboarding">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee name or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as WorkflowType | 'all')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Offboarding">Offboarding</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorkflowStatus | 'all')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => navigate('/start/onboarding')} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Workflows Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Workflow Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No workflows found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => {
                  const totalTasks = workflow.stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
                  const completedTasks = workflow.stages.reduce(
                    (acc, stage) => acc + stage.tasks.filter((t) => t.status === 'Done').length,
                    0
                  );
                  const date = workflow.type === 'Onboarding' 
                    ? workflow.employee.startDate 
                    : workflow.employee.endDate;

                  return (
                    <TableRow 
                      key={workflow.id} 
                      className="cursor-pointer"
                      onClick={() => navigate(`/workflows/${workflow.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{workflow.employee.name}</span>
                            <p className="text-xs text-muted-foreground">{workflow.employee.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{workflow.client.name}</TableCell>
                      <TableCell>
                        <WorkflowTypeBadge type={workflow.type} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={workflow.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProgressBar value={completedTasks} max={totalTasks} className="w-24" size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {completedTasks}/{totalTasks}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {date && new Date(date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
