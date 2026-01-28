import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Building2, Mail, LayoutGrid, List } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { StageColumn } from '@/components/workflow/StageColumn';
import { StatusBadge, WorkflowTypeBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { mockWorkflows } from '@/data/mockData';

type ViewMode = 'kanban' | 'accordion';

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const workflow = mockWorkflows.find((w) => w.id === id);
  
  const stages = workflow?.stages || [];

  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = stages.reduce(
    (acc, stage) => acc + stage.tasks.filter((t) => t.status === 'Done').length,
    0
  );

  if (!workflow) {
    return (
      <AppLayout title="Workflow Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The workflow you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/workflows')}>Back to Workflows</Button>
        </div>
      </AppLayout>
    );
  }

  const dateLabel = workflow.type === 'Onboarding' ? 'Start Date' : 'End Date';
  const date = workflow.type === 'Onboarding' 
    ? workflow.employee.startDate 
    : workflow.employee.endDate;

  return (
    <AppLayout
      title={`${workflow.type} Workflow`}
      subtitle={workflow.employee.name}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/workflows')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Button>

        {/* Employee Info Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    {workflow.employee.name}
                  </h2>
                  <WorkflowTypeBadge type={workflow.type} />
                  <StatusBadge status={workflow.status} />
                </div>
                <p className="text-muted-foreground">{workflow.employee.position}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {workflow.client.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {workflow.employee.email}
                  </span>
                  {date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {dateLabel}: {new Date(date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </p>
              </div>
              <ProgressBar value={completedTasks} max={totalTasks} className="w-48" />
              <p className="text-xs text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Workflow Progress</h3>
          <WorkflowTimeline stages={stages} />
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Tasks by Stage</h3>
            <p className="text-sm text-muted-foreground">View only — task status updates are managed from My Tasks</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'accordion' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('accordion')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Stages - View Only (no onTaskStatusChange) */}
        {viewMode === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                variant="kanban"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                variant="accordion"
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
