import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Dot
} from 'recharts';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkflowWithStats extends Workflow {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  needInfoTasks: number;
  overdueTasks: number;
}

interface WorkflowDashboardProps {
  workflows: WorkflowWithStats[];
}

const COLORS = {
  onboarding: '#10b981', // emerald-500
  offboarding: '#ef4444', // red-500
  active: '#3b82f6',      // blue-500
  completed: '#22c55e',   // green-500
  pending: '#f59e0b',     // amber-500
  needInfo: '#06b6d4',    // cyan-500
  overdue: '#dc2626'      // red-600
};

export function WorkflowDashboard({ workflows }: WorkflowDashboardProps) {
  const navigate = useNavigate();
  const [checklistTimeRange, setChecklistTimeRange] = useState('all');
  const [taskTimeRange, setTaskTimeRange] = useState('all');

  const filterWorkflows = (items: WorkflowWithStats[], range: string) => {
    if (range === 'all') return items;
    const now = new Date();
    let days = 0;
    if (range === '7d') days = 7;
    if (range === '30d') days = 30;
    if (range === '90d') days = 90;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return items.filter(w => new Date(w.createdAt) >= cutoff);
  };

  const checklistWorkflows = useMemo(() => filterWorkflows(workflows, checklistTimeRange), [workflows, checklistTimeRange]);
  const taskWorkflows = useMemo(() => filterWorkflows(workflows, taskTimeRange), [workflows, taskTimeRange]);
  
  // Stats for Summary Cards (Unfiltered)
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter(w => w.status === 'In Progress').length;
    
    // Active Onboarding/Offboarding
    const activeOnboarding = workflows.filter(w => w.type === 'Onboarding' && w.status === 'In Progress').length;
    const activeOffboarding = workflows.filter(w => w.type === 'Offboarding' && w.status === 'In Progress').length;
    
    const onboarding = workflows.filter(w => w.type === 'Onboarding').length;
    const offboarding = workflows.filter(w => w.type === 'Offboarding').length;
    
    // Aggregated task stats
    const totalTasks = workflows.reduce((acc, w) => acc + w.totalTasks, 0);
    const completedTasks = workflows.reduce((acc, w) => acc + w.completedTasks, 0);
    const pendingTasks = workflows.reduce((acc, w) => acc + w.pendingTasks, 0);
    const needInfoTasks = workflows.reduce((acc, w) => acc + w.needInfoTasks, 0);
    const overdueTasks = workflows.reduce((acc, w) => acc + w.overdueTasks, 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { 
      total, 
      active, 
      activeOnboarding,
      activeOffboarding,
      onboarding, 
      offboarding,
      totalTasks,
      completedTasks,
      pendingTasks,
      needInfoTasks,
      overdueTasks,
      completionRate
    };
  }, [workflows]);

  // Stats for Checklist Overview Chart (Filtered by checklistTimeRange)
  const checklistStats = useMemo(() => {
    const onboarding = checklistWorkflows.filter(w => w.type === 'Onboarding').length;
    const offboarding = checklistWorkflows.filter(w => w.type === 'Offboarding').length;
    return { onboarding, offboarding };
  }, [checklistWorkflows]);

  // Stats for Task Status Chart (Filtered by taskTimeRange)
  const taskStats = useMemo(() => {
    const completedTasks = taskWorkflows.reduce((acc, w) => acc + w.completedTasks, 0);
    const pendingTasks = taskWorkflows.reduce((acc, w) => acc + w.pendingTasks, 0);
    const needInfoTasks = taskWorkflows.reduce((acc, w) => acc + w.needInfoTasks, 0);
    return { completedTasks, pendingTasks, needInfoTasks };
  }, [taskWorkflows]);

  // Data for Charts
  const typeData = [
    { name: 'Onboarding', value: checklistStats.onboarding, color: COLORS.onboarding },
    { name: 'Offboarding', value: checklistStats.offboarding, color: COLORS.offboarding },
  ].filter(d => d.value > 0);

  const taskStatusData = [
    { name: 'Completed', value: taskStats.completedTasks, fill: COLORS.completed },
    { name: 'In Progress', value: taskStats.pendingTasks, fill: COLORS.pending },
    { name: 'Need Info', value: taskStats.needInfoTasks, fill: COLORS.needInfo },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/workflows?type=Onboarding&status=In Progress')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Onboarding Checklists</CardTitle>
            <UserPlus className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOnboarding}</div>
            <p className="text-xs text-muted-foreground">Active Onboarding Workflows</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/workflows?type=Offboarding&status=In Progress')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offboarding Checklists</CardTitle>
            <UserMinus className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOffboarding}</div>
            <p className="text-xs text-muted-foreground">Active Offboarding Workflows</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/admin/monitoring')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total In Progress Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Across all active workflows</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Workflow Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist Overview</CardTitle>
                <CardDescription>Breakdown by type and status</CardDescription>
              </div>
              <Select value={checklistTimeRange} onValueChange={setChecklistTimeRange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-muted-foreground">Onboarding ({stats.onboarding})</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-muted-foreground">Offboarding ({stats.offboarding})</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Overview */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Status Breakdown</CardTitle>
                <CardDescription>Current state of all tasks across workflows</CardDescription>
              </div>
              <Select value={taskTimeRange} onValueChange={setTaskTimeRange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
