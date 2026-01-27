import { UserPlus, UserMinus, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { MyTasksList } from '@/components/dashboard/MyTasksList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { mockWorkflows, currentUser } from '@/data/mockData';

export default function Dashboard() {
  const onboardingCount = mockWorkflows.filter((w) => w.type === 'Onboarding' && w.status === 'In Progress').length;
  const offboardingCount = mockWorkflows.filter((w) => w.type === 'Offboarding' && w.status === 'In Progress').length;
  const completedCount = mockWorkflows.filter((w) => w.status === 'Completed').length;
  
  const myPendingTasks = mockWorkflows.reduce((acc, workflow) => {
    return acc + workflow.stages.reduce((stageAcc, stage) => {
      return stageAcc + stage.tasks.filter(
        (task) => task.assignedTo?.id === currentUser.id && task.status === 'Pending'
      ).length;
    }, 0);
  }, 0);

  const activeWorkflows = mockWorkflows.filter((w) => w.status === 'In Progress').slice(0, 3);

  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, Michael">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Onboarding"
            value={onboardingCount}
            icon={<UserPlus className="w-6 h-6" />}
            variant="accent"
          />
          <StatCard
            title="Active Offboarding"
            value={offboardingCount}
            icon={<UserMinus className="w-6 h-6" />}
            variant="warning"
          />
          <StatCard
            title="My Pending Tasks"
            value={myPendingTasks}
            icon={<Clock className="w-6 h-6" />}
            variant="default"
          />
          <StatCard
            title="Completed This Month"
            value={completedCount}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="success"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Workflows */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Active Workflows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </div>

          {/* My Tasks */}
          <div className="space-y-4">
            <MyTasksList />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <RecentActivity />
        </div>
      </div>
    </AppLayout>
  );
}
