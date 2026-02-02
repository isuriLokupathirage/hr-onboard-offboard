import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, X, GripVertical, User, Check } from 'lucide-react';
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
import { clients, users, onboardingStageTemplates, offboardingStageTemplates } from '@/data/mockData';
import { WorkflowType, Department, Stage, Task } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface NewTask {
  id: string;
  name: string;
  department: Department;
  assignedToId: string;
  actionType?: 'CREATE_CREDENTIALS';
}

interface NewStage {
  id: string;
  name: string;
  order: number;
  tasks: NewTask[];
}

export default function CreateWorkflow() {
  const { type } = useParams<{ type: 'onboarding' | 'offboarding' }>();
  const navigate = useNavigate();
  const workflowType: WorkflowType = type === 'offboarding' ? 'Offboarding' : 'Onboarding';

  const templates = workflowType === 'Onboarding' ? onboardingStageTemplates : offboardingStageTemplates;

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePosition, setEmployeePosition] = useState('');
  const [employeeDate, setEmployeeDate] = useState('');

  const [stages, setStages] = useState<NewStage[]>(
    templates.map((t, i) => ({
      id: `stage-${i}`,
      name: t.name,
      order: t.order,
      tasks: [],
    }))
  );

  const addTask = (stageId: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: [
                ...stage.tasks,
                {
                  id: `task-${Date.now()}`,
                  name: '',
                  department: 'HR' as Department,
                  assignedToId: '',
                },
              ],
            }
          : stage
      )
    );
  };

  const updateTask = (stageId: string, taskId: string, updates: Partial<NewTask>) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: stage.tasks.map((task) =>
                task.id === taskId ? { ...task, ...updates } : task
              ),
            }
          : stage
      )
    );
  };

  const removeTask = (stageId: string, taskId: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? { ...stage, tasks: stage.tasks.filter((t) => t.id !== taskId) }
          : stage
      )
    );
  };

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      {
        id: `stage-${Date.now()}`,
        name: '',
        order: prev.length + 1,
        tasks: [],
      },
    ]);
  };

  const removeStage = (stageId: string) => {
    setStages((prev) => prev.filter((s) => s.id !== stageId));
  };

  const updateStageName = (stageId: string, name: string) => {
    setStages((prev) =>
      prev.map((stage) => (stage.id === stageId ? { ...stage, name } : stage))
    );
  };

  const canProceedStep1 = clientId && employeeName && employeeEmail && employeePosition && employeeDate;
  const canProceedStep2 = stages.every((s) => s.name) && stages.some((s) => s.tasks.length > 0);

  const handleSubmit = () => {
    toast({
      title: 'Workflow Created',
      description: `${workflowType} workflow for ${employeeName} has been created successfully.`,
    });
    navigate('/workflows');
  };

  return (
    <AppLayout
      title={`Create ${workflowType} Workflow`}
      subtitle="Set up a new workflow with stages and tasks"
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
                {s === 1 ? 'Employee Info' : s === 2 ? 'Define Stages' : 'Review'}
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
              <p className="text-sm text-muted-foreground">Enter details about the employee</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client</Label>
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
                <Label>{workflowType === 'Onboarding' ? 'Start Date' : 'End Date'}</Label>
                <Input
                  type="date"
                  value={employeeDate}
                  onChange={(e) => setEmployeeDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Employee Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="employee@company.com"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Position</Label>
                <Input
                  placeholder="Enter job title"
                  value={employeePosition}
                  onChange={(e) => setEmployeePosition(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Next: Define Stages
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Define Stages */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Define Stages & Tasks</h2>
                  <p className="text-sm text-muted-foreground">Add tasks to each stage of the workflow</p>
                </div>
                <Button variant="outline" size="sm" onClick={addStage} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Stage
                </Button>
              </div>

              <div className="space-y-4">
                {stages.map((stage, stageIndex) => (
                  <div
                    key={stage.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Stage Header */}
                    <div className="bg-muted/50 p-4 flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {stageIndex + 1}.
                      </span>
                      <Input
                        placeholder="Stage name"
                        value={stage.name}
                        onChange={(e) => updateStageName(stage.id, e.target.value)}
                        className="flex-1 bg-background"
                      />
                      {stages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStage(stage.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Tasks */}
                    <div className="p-4 space-y-3">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
                        >
                          <Input
                            placeholder="Task name"
                            value={task.name}
                            onChange={(e) =>
                              updateTask(stage.id, task.id, { name: e.target.value })
                            }
                            className="flex-1"
                          />
                          <Select
                            value={task.department}
                            onValueChange={(v) =>
                              updateTask(stage.id, task.id, { department: v as Department })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={task.actionType || 'none'}
                            onValueChange={(v) =>
                              updateTask(stage.id, task.id, { actionType: v === 'none' ? undefined : v as any })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Action</SelectItem>
                              <SelectItem value="CREATE_CREDENTIALS">Create Credentials</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={task.assignedToId}
                            onValueChange={(v) =>
                              updateTask(stage.id, task.id, { assignedToId: v })
                            }
                          >
                            <SelectTrigger className="w-40">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTask(stage.id, task.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(stage.id)}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
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
                Review Workflow
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Review Workflow</h2>

              {/* Employee Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{employeeName}</p>
                    <p className="text-sm text-muted-foreground">{employeePosition}</p>
                    <p className="text-sm text-muted-foreground">{employeeEmail}</p>
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
                          key={task.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{task.name}</span>
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
                Create Workflow
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
