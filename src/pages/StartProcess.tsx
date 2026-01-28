import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Check, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clients, users, workflowTemplates } from '@/data/mockData';
import { WorkflowType, Department } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface TaskAssignment {
  taskId: string;
  taskName: string;
  department: Department;
  assignedToId: string;
}

interface StageWithAssignments {
  id: string;
  name: string;
  order: number;
  tasks: TaskAssignment[];
}

export default function StartProcess() {
  const { type } = useParams<{ type: 'onboarding' | 'offboarding' }>();
  const navigate = useNavigate();
  const workflowType: WorkflowType = type === 'offboarding' ? 'Offboarding' : 'Onboarding';

  const availableTemplates = workflowTemplates.filter((t) => t.type === workflowType);

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePosition, setEmployeePosition] = useState('');
  const [employeeDate, setEmployeeDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [stages, setStages] = useState<StageWithAssignments[]>([]);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = workflowTemplates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setStages(
          template.stages.map((s) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            tasks: s.tasks.map((t) => ({
              taskId: t.id,
              taskName: t.name,
              department: t.department,
              assignedToId: '',
            })),
          }))
        );
      }
    }
  }, [selectedTemplateId]);

  const updateTaskAssignment = (stageId: string, taskId: string, assignedToId: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: stage.tasks.map((task) =>
                task.taskId === taskId ? { ...task, assignedToId } : task
              ),
            }
          : stage
      )
    );
  };

  // Onboarding: no email required; Offboarding: email required
  const canProceedStep1 = workflowType === 'Onboarding'
    ? clientId && employeeName && employeePosition && employeeDate && selectedTemplateId
    : clientId && employeeName && employeeEmail && employeePosition && employeeDate && selectedTemplateId;

  const canProceedStep2 = stages.length > 0;

  const handleSubmit = () => {
    toast({
      title: `${workflowType} Started`,
      description: `${workflowType} process for ${employeeName} has been initiated.`,
    });
    navigate('/workflows');
  };

  return (
    <AppLayout
      title={`Start ${workflowType}`}
      subtitle={`Begin ${workflowType.toLowerCase()} process for an employee`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  s === step
                    ? 'bg-accent text-accent-foreground'
                    : s < step
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={cn('ml-2 text-sm font-medium', s === step ? 'text-foreground' : 'text-muted-foreground')}>
                {s === 1 ? 'Employee Info' : s === 2 ? 'Assign Tasks' : 'Review'}
              </span>
              {s < 3 && <div className="w-12 h-px bg-border mx-4" />}
            </div>
          ))}
        </div>

        {/* Step 1: Employee Info */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Employee Information</h2>
              <p className="text-sm text-muted-foreground">Enter details about the employee and select a workflow template</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{workflowType === 'Onboarding' ? 'Start Date *' : 'End Date *'}</Label>
                <Input
                  type="date"
                  value={employeeDate}
                  onChange={(e) => setEmployeeDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Employee Name *</Label>
                <Input
                  placeholder="Enter full name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>

              {/* Email field - only for Offboarding */}
              {workflowType === 'Offboarding' && (
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="employee@company.com"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Position *</Label>
                <Input
                  placeholder="Enter job title"
                  value={employeePosition}
                  onChange={(e) => setEmployeePosition(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Workflow Template *</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to apply" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableTemplates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No templates available. <a href="/templates/create" className="text-accent hover:underline">Create one first</a>.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Next: Assign Tasks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Assign Tasks */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Assign Tasks</h2>
                <p className="text-sm text-muted-foreground">Assign team members to each task</p>
              </div>

              <div className="space-y-4">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div className="bg-muted/50 p-4">
                      <h4 className="font-medium text-foreground">{stage.name}</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.taskId}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                        >
                          <span className="flex-1 text-sm text-foreground">{task.taskName}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium border',
                            task.department === 'HR' && 'bg-purple-100 text-purple-700 border-purple-200',
                            task.department === 'IT' && 'bg-blue-100 text-blue-700 border-blue-200',
                            task.department === 'Finance' && 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          )}>
                            {task.department}
                          </span>
                          <Select
                            value={task.assignedToId}
                            onValueChange={(v) => updateTaskAssignment(stage.id, task.taskId, v)}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter((u) => u.department === task.department)
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Review
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Review {workflowType}</h2>

              {/* Employee Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{employeeName}</p>
                    <p className="text-sm text-muted-foreground">{employeePosition}</p>
                    {workflowType === 'Offboarding' && employeeEmail && (
                      <p className="text-sm text-muted-foreground">{employeeEmail}</p>
                    )}
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground">
                      {clients.find((c) => c.id === clientId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {workflowType === 'Onboarding' ? 'Starts' : 'Ends'}:{' '}
                      {new Date(employeeDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stages Summary */}
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div key={stage.id} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3">{stage.name}</h4>
                    <div className="space-y-2">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.taskId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{task.taskName}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-muted">
                              {task.department}
                            </span>
                            <span className="text-muted-foreground">
                              {users.find((u) => u.id === task.assignedToId)?.name || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                Start {workflowType}
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
