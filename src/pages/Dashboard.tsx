import { useState, useMemo, useEffect } from 'react';
import { UserPlus, UserMinus, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { currentUser } from '@/data/mockData';
import { getWorkflows } from '@/lib/storage';
import { Workflow } from '@/types/workflow';
import { WorkflowTable } from '@/components/workflow/WorkflowTable';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { WorkflowDashboard } from '@/components/dashboard/WorkflowDashboard';

interface WorkflowWithStats extends Workflow {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  needInfoTasks: number;
  overdueTasks: number;
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    setWorkflows(getWorkflows());
    
    // Listen for workflow updates from other pages
    const handleWorkflowsUpdated = () => {
      setWorkflows(getWorkflows());
    };
    
    window.addEventListener('workflowsUpdated', handleWorkflowsUpdated);
    
    return () => {
      window.removeEventListener('workflowsUpdated', handleWorkflowsUpdated);
    };
  }, []);

  // Calculate detailed stats for the WorkflowDashboard component
  const workflowsWithStats: WorkflowWithStats[] = useMemo(() => {
    return workflows.map((workflow) => {
      const allTasks = workflow.stages.flatMap((s) => s.tasks);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'Done').length;
      const pendingTasks = allTasks.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
      const needInfoTasks = allTasks.filter((t) => t.status === 'Need Info').length;
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

  const onboardingCount = useMemo(() => 
    workflows.filter((w) => w.type === 'Onboarding' && w.status === 'In Progress').length,
    [workflows]
  );
  const offboardingCount = useMemo(() => 
    workflows.filter((w) => w.type === 'Offboarding' && w.status === 'In Progress').length,
    [workflows]
  );
  const completedCount = useMemo(() => 
    workflows.filter((w) => w.status === 'Completed').length,
    [workflows]
  );
  
  const myPendingTasks = useMemo(() => 
    workflows.reduce((acc, workflow) => {
      return acc + workflow.stages.reduce((stageAcc, stage) => {
        return stageAcc + stage.tasks.filter(
          (task) => task.assignedTo?.id === currentUser.id && task.status === 'In Progress'
        ).length;
      }, 0);
    }, 0),
    [workflows]
  );

  return (
    <AppLayout title="" subtitle="">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding/Offboarding Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your employee transitions and active workflows</p>
        </div>

        {/* Stats Grid */}
        <WorkflowDashboard workflows={workflowsWithStats} />


        {/* Active Workflows Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Active Workflows</h2>
            </div>
            <Link 
              to="/workflows" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="p-0">
            <WorkflowTable workflows={workflows} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
