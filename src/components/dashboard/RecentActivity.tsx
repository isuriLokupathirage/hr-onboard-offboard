import { Check, UserPlus, UserMinus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'task_completed' | 'workflow_started' | 'workflow_completed' | 'task_assigned';
  message: string;
  user: string;
  timestamp: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'task_completed',
    message: 'Completed "Send offer letter" for Alex Thompson',
    user: 'Sarah Johnson',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'workflow_started',
    message: 'Started offboarding workflow for Rachel Green',
    user: 'James Wilson',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    type: 'task_assigned',
    message: 'Assigned "Create email account" to Michael Chen',
    user: 'Sarah Johnson',
    timestamp: '5 hours ago',
  },
  {
    id: '4',
    type: 'workflow_completed',
    message: 'Completed onboarding for David Kim',
    user: 'Sarah Johnson',
    timestamp: '1 day ago',
  },
  {
    id: '5',
    type: 'task_completed',
    message: 'Completed "Background verification" for Alex Thompson',
    user: 'James Wilson',
    timestamp: '1 day ago',
  },
];

const iconMap = {
  task_completed: Check,
  workflow_started: UserPlus,
  workflow_completed: UserMinus,
  task_assigned: Clock,
};

const iconColorMap = {
  task_completed: 'bg-success/15 text-success',
  workflow_started: 'bg-accent/15 text-accent',
  workflow_completed: 'bg-primary/15 text-primary',
  task_assigned: 'bg-warning/15 text-warning',
};

export function RecentActivity() {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest workflow updates</p>
      </div>

      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div key={activity.id} className="p-4 flex items-start gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  iconColorMap[activity.type]
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.user} • {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
