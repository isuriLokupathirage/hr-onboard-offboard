import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Building2, Mail, LayoutGrid, List, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StageColumn } from '@/components/workflow/StageColumn';
import { StatusBadge, WorkflowTypeBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Workflow } from '@/types/workflow';
import { getWorkflowById, updateWorkflow, updateEmployeeAccount, deactivateEmployeeAccount, getEmployeeAccounts } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ViewMode = 'kanban' | 'accordion';


export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      const found = getWorkflowById(id);
      setWorkflow(found || null);
    }
    setLoading(false);
  }, [id]);

  const handleComplete = () => {
    if (!workflow) return;

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'Completed',
      updatedAt: new Date().toISOString(),
    };

    updateWorkflow(updatedWorkflow);
    setWorkflow(updatedWorkflow);

    if (workflow.type === 'Onboarding') {
      const { users } = require('@/data/mockData');
      const supervisor = users.find((u: any) => u.id === workflow.employee.supervisorId);

      const existingAccounts = getEmployeeAccounts();
      const existingAccount = existingAccounts.find(
        (a: any) => a.email === workflow.employee.email
      );

      // Collect documents from all tasks
      const allDocuments = workflow.stages.flatMap(stage => 
        stage.tasks.flatMap(task => task.outputValue?.documents || [])
      );

      if (!existingAccount) {
        // Create new account
        updateEmployeeAccount({
          id: crypto.randomUUID(),
          name: workflow.employee.name,
          email: workflow.employee.email || '',
          position: workflow.employee.position,
          department: workflow.employee.department,
          client: workflow.client,

          employmentType: workflow.employee.employmentType,
          supervisor: supervisor,
          status: 'Active',
          onboardedAt: new Date().toISOString(),
          documents: allDocuments,
        });
      } else {
        // Account exists (manual creation or previous workflow). 
        // We should link/merge the documents from this workflow to the existing employee account.
        if (allDocuments.length > 0) {
          const currentDocs = existingAccount.documents || [];
          // Merge unique docs by name to avoid exact duplicates if re-run
          const newDocs = allDocuments.filter(ad => !currentDocs.some(cd => cd.name === ad.name));
          
          if (newDocs.length > 0) {
            const updatedDocs = [...currentDocs, ...newDocs];
            
            updateEmployeeAccount({
              ...existingAccount,
              documents: updatedDocs
            });
          }
        }
      }
    } else {
      // Deactivate account
      if (workflow.employee.email) {
        deactivateEmployeeAccount(workflow.employee.email);
      }
    }

    toast({
      title: "Workflow Completed",
      description: `The ${workflow.type.toLowerCase()} process for ${workflow.employee.name} has been successfully finalized.`,
    });
  };

  const handleCancelWorkflow = () => {
    if (!workflow || !cancelReason.trim()) return;

    const updatedWorkflow: Workflow = {
      ...workflow,
      status: 'Cancelled',
      cancellationReason: cancelReason,
      updatedAt: new Date().toISOString(),
    };

    updateWorkflow(updatedWorkflow);
    setWorkflow(updatedWorkflow);
    setCancelDialogOpen(false);
    setCancelReason('');

    toast({
      title: "Workflow Cancelled",
      description: `The workflow for ${workflow.employee.name} has been cancelled.`,
    });
    
    // Optional: Redirect or stay on page. Staying on page allows seeing the cancelled status.
  };

  const stages = workflow?.stages || [];

  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = stages.reduce(
    (acc, stage) => acc + stage.tasks.filter((t) => t.status === 'Completed').length,
    0
  );

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

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

            <div className="flex flex-col items-end gap-4">
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

              {workflow.status === 'In Progress' && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Workflow
                  </Button>
                  <Button 
                    onClick={handleComplete}
                    disabled={completedTasks < totalTasks}
                    className={cn(
                      "gap-2",
                      completedTasks === totalTasks ? "bg-success hover:bg-success/90" : ""
                    )}
                  >
                    <Check className="w-4 h-4" />
                    Complete Workflow
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* View Toggle */}
        <div className="flex items-end justify-between pt-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                variant="kanban"
                readOnly={true}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                variant="accordion"
                readOnly={true}
              />
            ))}
          </div>
        )}
      </div>
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this workflow? This action cannot be undone.
              Please provide a reason for the cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason" className="mb-2 block">Reason for Cancellation</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Workflow</Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelWorkflow}
              disabled={!cancelReason.trim()}
            >
              Cancel Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
