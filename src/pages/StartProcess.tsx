import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { clients, users } from '@/data/mockData';
import { getEmployeeAccounts } from '@/lib/storage';
import { WorkflowType, Department, Workflow, EmploymentType } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getTemplates, updateWorkflow } from '@/lib/storage';
import { Flag, Calendar } from 'lucide-react';

interface TaskAssignment {
  taskId: string;
  taskName: string;
  department: Department;
  assignedToId: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: string;
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
  const location = useLocation();
  const workflowType: WorkflowType = type === 'offboarding' ? 'Offboarding' : 'Onboarding';

  const templates = useMemo(() => getTemplates(), []);
  const availableTemplates = templates.filter((t) => t.type === workflowType);

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [employeeId, setEmployeeId] = useState(''); // Acts as employee Name for Onboarding
  const [employeePosition, setEmployeePosition] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeDate, setEmployeeDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [stages, setStages] = useState<StageWithAssignments[]>([]);
  const employeeAccounts = useMemo(() => getEmployeeAccounts(), []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const idFromUrl = searchParams.get('employeeId');
    if (idFromUrl && workflowType === 'Offboarding') {
      setEmployeeId(idFromUrl);
    }
  }, [location.search, workflowType]);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        // Safety check for client
        if (template.client?.id) {
          setClientId(template.client.id);
        }
        
        // Safety check for stages and tasks
        const templateStages = template.stages || [];
        setStages(
          templateStages.map((s) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            tasks: (s.tasks || []).map((t) => ({
              taskId: t.id,
              taskName: t.name,
              department: t.department,
              assignedToId: '',
              priority: t.priority || 'Medium',
              dueDate: '',
            })),
          }))
        );
      }
    }
  }, [selectedTemplateId, templates]);

  const updateTaskAssignment = (stageId: string, taskId: string, field: keyof TaskAssignment, value: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: stage.tasks.map((task) =>
                task.taskId === taskId ? { ...task, [field]: value } : task
              ),
            }
          : stage
      )
    );
  };

  // For Offboarding: only require employeeId, endDate, template
  const canProceedStep1 = workflowType === 'Onboarding'
    ? clientId && employeeId && employeeDate && selectedTemplateId && employeePosition // Require position for onboarding
    : employeeId && employeeDate && selectedTemplateId;

  const canProceedStep2 = stages.length > 0;

  // Derived variables for display and submission
  const selectedEmployee = employeeAccounts.find(e => e.id === employeeId);
  
  const employeeName = workflowType === 'Onboarding' ? employeeId : selectedEmployee?.name || '';
  const currentPosition = workflowType === 'Onboarding' ? employeePosition : selectedEmployee?.position || '';
  const currentEmail = workflowType === 'Onboarding' ? employeeEmail : selectedEmployee?.email || '';
  // Defaulting Department and Employment Type for Onboarding as they are not in the form yet
  const currentDepartment = workflowType === 'Onboarding' ? 'IT' : selectedEmployee?.department || 'IT'; 
  const currentEmploymentType = workflowType === 'Onboarding' ? 'Full-time' : selectedEmployee?.employmentType || 'Full-time';

  const handleSubmit = () => {
    let selectedEmployee;
    if (workflowType === 'Offboarding') {
      selectedEmployee = employeeAccounts.find(e => e.id === employeeId);
    }
    const selectedClient = workflowType === 'Onboarding'
      ? clients.find(c => c.id === clientId)!
      : selectedEmployee?.client;

    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      type: workflowType,
      client: selectedClient!,
      employee: workflowType === 'Onboarding'
        ? {
            name: employeeName,
            email: currentEmail,
            position: currentPosition,
            department: currentDepartment as Department,

            employmentType: currentEmploymentType as EmploymentType,
            supervisorId: undefined,
            startDate: undefined,
            endDate: undefined,
          }
        : {
            name: employeeName,
            email: currentEmail,
            position: currentPosition,
            department: currentDepartment as Department,

            employmentType: currentEmploymentType as EmploymentType,
            supervisorId: undefined,
            startDate: undefined,
            endDate: employeeDate,
          },
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: stages.map(s => {
        const template = templates.find(t => t.id === selectedTemplateId);
        const templateStage = template?.stages.find(ts => ts.name === s.name);
        return {
          id: s.id,
          name: s.name,
          order: s.order,
          tasks: s.tasks.map(t => {
            const assignedUser = users.find(u => u.id === t.assignedToId);
            const templateTask = templateStage?.tasks.find(tt => tt.name === t.taskName);
            return {
              id: crypto.randomUUID(),
              name: t.taskName,
              department: t.department,
              status: 'Not Started', // Start as Not Started
              assignedTo: assignedUser || null,
              actionType: templateTask?.actionType as any,
              priority: t.priority,
              dueDate: t.dueDate || undefined,
              requiredDate: templateTask?.requiredDate,
              comments: [], // Initialize comments array
            };
          })
        };
      })
    };

    updateWorkflow(newWorkflow);

    toast({
      title: `${workflowType} Started`,
      description: `${workflowType} process for ${selectedEmployee?.name || ''} has been initiated.`,
    });
    navigate('/admin/monitoring');
  };

  return (
    <AppLayout
      title={`Start ${workflowType}`}
      subtitle={`Begin ${workflowType.toLowerCase()} process for an employee`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
        </div>
            
        {/* Tabs */}
        <div className="flex justify-center mb-8">
            <div className="flex bg-muted p-1 rounded-lg w-full">
                <button
                    onClick={() => navigate('/start/onboarding')}
                    className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                        workflowType === 'Onboarding' 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Onboarding
                </button>
                <button
                    onClick={() => navigate('/start/offboarding')}
                    className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                        workflowType === 'Offboarding' 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Offboarding
                </button>
            </div>
        </div>

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
              {workflowType === 'Onboarding' ? (
                <>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter full name"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      value={employeeDate}
                      onChange={(e) => setEmployeeDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Office Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="employee@company.com"
                      value={employeeEmail}
                      onChange={(e) => setEmployeeEmail(e.target.value)}
                    />
                  </div>

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
                  <div className="space-y-2">
                    <Label>Local Reporting Manager</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select local manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Client Reporting Manager</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Employee *</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeAccounts.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.position}, {emp.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={employeeDate}
                      onChange={(e) => setEmployeeDate(e.target.value)}
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
                </>
              )}
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
                          className="p-3 bg-muted/30 rounded-md space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex-1 text-sm text-foreground font-medium">{task.taskName}</span>
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium border',
                              task.department === 'HR' && 'bg-purple-100 text-purple-700 border-purple-200',
                              task.department === 'IT' && 'bg-blue-100 text-blue-700 border-blue-200',
                              task.department === 'Finance' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                              task.department === 'Marketing' && 'bg-orange-100 text-orange-700 border-orange-200'
                            )}>
                              {task.department}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Assignee */}
                            <Select
                              value={task.assignedToId}
                              onValueChange={(v) => updateTaskAssignment(stage.id, task.taskId, 'assignedToId', v)}
                            >
                              <SelectTrigger>
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

                            {/* Priority */}
                            <Select
                              value={task.priority}
                              onValueChange={(v: any) => updateTaskAssignment(stage.id, task.taskId, 'priority', v)}
                            >
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                  <Flag className={cn(
                                    "w-3 h-3",
                                    task.priority === 'High' ? "text-red-500 fill-red-500" :
                                    task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                    "text-blue-500 fill-blue-500"
                                  )} />
                                  <SelectValue placeholder="Priority" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Due Date */}
                            <div className="relative">
                                <Input 
                                    type="date" 
                                    value={task.dueDate} 
                                    onChange={(e) => updateTaskAssignment(stage.id, task.taskId, 'dueDate', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                          </div>
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
            {( !employeeName || !employeeDate || !stages || stages.length === 0 ) ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center py-12">
                <h2 className="text-xl font-bold mb-2">Missing or Invalid Data</h2>
                <p className="text-muted-foreground mb-4">Some required information is missing or invalid. Please go back and check all fields.</p>
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              </div>
            ) : (
              <>
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
                        <p className="text-sm text-muted-foreground">{currentPosition}</p>
                        {workflowType === 'Offboarding' && currentEmail && (
                          <p className="text-sm text-muted-foreground">{currentEmail}</p>
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
                        <p className="text-sm text-muted-foreground">
                          {currentEmploymentType} | {currentDepartment}
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
                                {task.priority && (
                                    <div className="flex items-center gap-1">
                                        <Flag className={cn(
                                            "w-3 h-3",
                                            task.priority === 'High' ? "text-red-500 fill-red-500" :
                                            task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                            "text-blue-500 fill-blue-500"
                                        )} />
                                        <span className="text-xs text-muted-foreground">{task.priority}</span>
                                    </div>
                                )}
                                {task.dueDate && (
                                    <span className="px-1.5 py-0.5 rounded border bg-muted flex items-center gap-1 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                                <span className="text-muted-foreground text-xs">
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
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
