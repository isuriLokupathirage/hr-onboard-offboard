
import { useMemo } from 'react';
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
  // Stats for Summary Cards
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter(w => w.status === 'In Progress').length;
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

  // Data for Charts
  const typeData = [
    { name: 'Onboarding', value: stats.onboarding, color: COLORS.onboarding },
    { name: 'Offboarding', value: stats.offboarding, color: COLORS.offboarding },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Active', value: stats.active, color: COLORS.active },
    { name: 'Completed', value: stats.total - stats.active, color: COLORS.completed },
  ].filter(d => d.value > 0);

  const taskStatusData = [
    { name: 'Completed', value: stats.completedTasks, fill: COLORS.completed },
    { name: 'In Progress', value: stats.pendingTasks, fill: COLORS.pending },
    { name: 'Need Info', value: stats.needInfoTasks, fill: COLORS.needInfo },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.total} Total Workflows</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.completedTasks} / {stats.totalTasks} Tasks Done</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needInfoTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks Awaiting Input</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks Past Due Date</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Workflow Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Workflow Overview</CardTitle>
            <CardDescription>Breakdown by type and status</CardDescription>
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
            <CardTitle>Task Status Breakdown</CardTitle>
            <CardDescription>Current state of all tasks across workflows</CardDescription>
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
