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
import { getTemplates, updateWorkflow, updateEmployeeAccount, getWorkflowById } from '@/lib/storage';
import { Flag, Calendar, Upload, File, X, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { OffboardingType, ExitReason } from '@/types/workflow';

interface TaskAssignment {
  taskId: string;
  taskName: string;
  department: Department;
  assignedToId: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  dependentOn?: string[];
  indent?: number;
  description?: string;
}

interface StageWithAssignments {
  id: string;
  name: string;
  order: number;
  description?: string;
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

  // Offboarding State
  const [offboardingType, setOffboardingType] = useState<OffboardingType>('Voluntary');
  const [exitReason, setExitReason] = useState<ExitReason | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [otherReason, setOtherReason] = useState('');

  const editWorkflowId = new URLSearchParams(location.search).get('edit');

  useEffect(() => {
    if (editWorkflowId) {
      const startWorkflow = getWorkflowById(editWorkflowId);
      if (startWorkflow) {
        if (startWorkflow.type !== workflowType) {
          // If types mismatch (e.g. trying to edit an onboarding as offboarding), warn or redirect?
          // For now, we assume the admin clicked the right edit button. 
          // But strict safety would check strict types.
        }

        setClientId(startWorkflow.client.id);
        
        // Employee Info
        if (workflowType === 'Onboarding') {
          setEmployeeId(startWorkflow.employee.name);
          setEmployeeEmail(startWorkflow.employee.email || '');
          setEmployeePosition(startWorkflow.employee.position);
          setEmployeeDate(startWorkflow.employee.startDate || '');
        } else {
            // Reverse lookup for Offboarding to find the distinct Employee ID if possible
            const accounts = getEmployeeAccounts();
            const account = accounts.find(a => a.email === startWorkflow.employee.email);
            if (account) setEmployeeId(account.id);
            setEmployeeDate(startWorkflow.employee.endDate || startWorkflow.offboardingDetails?.lastWorkingDay || '');
            
            if (startWorkflow.offboardingDetails) {
                 setOffboardingType(startWorkflow.offboardingDetails.type);
                 setExitReason(startWorkflow.offboardingDetails.exitReason);
            }
        }

        // Stages & Tasks
        const loadedStages: StageWithAssignments[] = startWorkflow.stages.map(s => ({
            id: s.id,
            name: s.name,
            order: s.order,
            description: s.description,
            tasks: s.tasks.map(t => ({
                taskId: t.id,
                taskName: t.name,
                department: t.department,
                assignedToId: t.assignedTo?.id || '',
                priority: t.priority || 'Medium',
                dueDate: t.dueDate || '',
                dependentOn: t.dependentOn,
                indent: t.indent,
                description: t.description
            }))
        }));
        setStages(loadedStages);
        
        // We won't set selectedTemplateId because we loaded custom data
        // But we need to ensure validation passes.
      }
    }
  }, [editWorkflowId, workflowType]);

  useEffect(() => {
    // Only load from template if we are NOT in edit mode OR if the user explicitly changes the template
    // If we are editing, loading a template would overwrite the existing work.
    // However, if the user *changes* the dropdown in edit mode, they probably DO want to overwrite.
    // The issue is distinguishing "init" vs "change".
    // Simple fix: If stages are empty, allowing loading. If stages are full, only load if selectedTemplateId changes (which it does via state).
    // BUT, the initial load of edit mode sets stages.
    // So we need to make sure this effect doesn't run *after* the edit mode effect and wipe it.
    // We can rely on selectedTemplateId being empty initially in edit mode.
    
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
            description: s.description,
            order: s.order,
            tasks: (s.tasks || []).map((t) => ({
              taskId: t.id,
              taskName: t.name,
              description: t.description,
              department: t.department,
              assignedToId: '',
              priority: t.priority || 'Medium',
              dueDate: '',
              dependentOn: t.dependentOn || [],
              indent: t.indent || 0,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const EXIT_REASONS_BY_TYPE: Record<OffboardingType, ExitReason[]> = {
    Voluntary: [
      'Career Growth / Opportunity',
      'Work–Life Balance',
      'Job Satisfaction',
      'Compensation & Benefits',
      'Relocation or Life Changes',
      'Health Reasons',
      'Other'
    ],
    Involuntary: [
      'Performance-Related Issues',
      'Misconduct / Policy Violations',
      'Client / Project Termination',
      'Organizational Restructuring',
      'Other'
    ],
    Mutual: [
      'End of Internship',
      'End of Contract',
      'Mutual Agreement',
      'Other'
    ]
  };

  const currentExitReasons = EXIT_REASONS_BY_TYPE[offboardingType];


  // Validation
  // Allow proceeding if editing (editWorkflowId present) regardless of selectedTemplateId
  const canProceedStep1 = workflowType === 'Onboarding'
    ? clientId && employeeId && employeeDate && (selectedTemplateId || editWorkflowId) && employeePosition
    : employeeId && employeeDate && (selectedTemplateId || editWorkflowId) && exitReason && (uploadedFiles.length > 0 || editWorkflowId); // Relax file upload for edit

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

    // Save documents to Employee Profile if Offboarding
    if (workflowType === 'Offboarding' && selectedEmployee && uploadedFiles.length > 0) {
      const newDocuments = uploadedFiles.map(file => ({
        name: file.name,
        // In a real app, this would be the uploaded URL. For prototype, we create a temporary URL
        url: URL.createObjectURL(file), // Note: This URL will only work in the current session. 
        // For persistent prototype, we could arguably just not set URL or set a dummy URL if files aren't actually uploaded to a server/storage
        uploadedAt: new Date().toISOString(),
        type: 'Offboarding Document'
      }));

      const updatedEmployee = {
        ...selectedEmployee,
        documents: [
          ...(selectedEmployee.documents || []),
          ...newDocuments
        ]
      };

      updateEmployeeAccount(updatedEmployee);
    }
    
    // Check if we are updating an existing workflow
    const existingWorkflow = editWorkflowId ? getWorkflowById(editWorkflowId) : null;

    const newWorkflow: Workflow = {
      id: existingWorkflow ? existingWorkflow.id : crypto.randomUUID(),
      templateId: selectedTemplateId || existingWorkflow?.templateId,
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
            // Preserve other fields if updating
            ...(existingWorkflow?.employee || {})
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
             // Preserve other fields if updating
            ...(existingWorkflow?.employee || {})
          },
      offboardingDetails: workflowType === 'Offboarding' ? {
        type: offboardingType,
        exitReason: exitReason as ExitReason,
        lastWorkingDay: employeeDate,
        // Merge existing documents with new ones if needed, currently we just overwrite names from uploadedFiles
        // If editing, we might lose previous file names if we don't handle them.
        documents: uploadedFiles.length > 0 
            ? uploadedFiles.map(f => f.name) 
            : (existingWorkflow?.offboardingDetails?.documents || []),
      } : undefined,
      status: existingWorkflow ? existingWorkflow.status : 'In Progress',
      createdAt: existingWorkflow ? existingWorkflow.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: (() => {
        // If editing, we might want to preserve IDs for existing tasks to avoid breaking comments/history
        // But re-mapping logic here is complex. 
        // For now, simpler approach: regeneration of IDs is risky.
        // We should try to preserve IDs if assignment ID matches existing task ID.
        
        return stages.map(s => {
          return {
            id: s.id, 
            name: s.name,
            order: s.order,
            description: s.description,
            tasks: s.tasks.map(t => {
              const assignedUser = users.find(u => u.id === t.assignedToId);
              
              // Try to find existing task to preserve status/comments
              let existingTask = null;
              if (existingWorkflow) {
                  const flatTasks = existingWorkflow.stages.flatMap(st => st.tasks);
                  existingTask = flatTasks.find(et => et.id === t.taskId);
              }

              return {
                id: t.taskId, // Use the taskId from state (which comes from loaded workflow or template)
                name: t.taskName,
                description: t.description,
                department: t.department,
                status: existingTask ? existingTask.status : 'Open',
                assignedTo: assignedUser || null,
                actionType: existingTask?.actionType, // Should come from template really, but...
                priority: t.priority,
                dueDate: t.dueDate || undefined,
                requiredDate: existingTask?.requiredDate,
                comments: existingTask?.comments || [], 
                dependentOn: t.dependentOn,
                indent: t.indent || 0,
              };
            })
          };
        });
      })()
    };

    updateWorkflow(newWorkflow);

    toast({
      title: editWorkflowId ? `${workflowType} Updated` : `${workflowType} Started`,
      description: `${workflowType} process for ${selectedEmployee?.name || employeeName} has been ${editWorkflowId ? 'updated' : 'initiated'}.`,
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
              <p className="text-sm text-muted-foreground">Enter details about the employee and select a check list template</p>
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
                    <Label>Check List Template *</Label>
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
                  {/* Employee Details (Read Only / Selection) */}
                  <div className="space-y-4">
                     <h3 className="font-medium text-foreground border-b pb-2">1. Employee Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {selectedEmployee && (
                             <div className="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Employee ID</span>
                                    <p className="text-sm font-medium">{selectedEmployee.employeeId || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Job Title</span>
                                    <p className="text-sm font-medium" title={selectedEmployee.position}>{selectedEmployee.position}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Department</span>
                                    <p className="text-sm font-medium">{selectedEmployee.department}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Employ. Type</span>
                                    <p className="text-sm font-medium">{selectedEmployee.employmentType}</p>
                                </div>
                             </div>
                        )}
                     </div>
                  </div>

                  {/* Offboarding Details */}
                  <div className="space-y-4 pt-0">
                     <h3 className="font-medium text-foreground border-b pb-2">2. Offboarding Details</h3>
                     
                     <div className="space-y-3">
                        <Label>Offboarding Type *</Label>
                        <RadioGroup 
                            value={offboardingType} 
                            onValueChange={(v) => {
                                setOffboardingType(v as OffboardingType);
                                setExitReason('' as ExitReason); // Reset exit reason when type changes
                                setOtherReason('');
                            }} 
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Voluntary" id="voluntary" />
                                <Label htmlFor="voluntary" className="font-normal cursor-pointer">Voluntary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Involuntary" id="involuntary" />
                                <Label htmlFor="involuntary" className="font-normal cursor-pointer">Involuntary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Mutual" id="mutual" />
                                <Label htmlFor="mutual" className="font-normal cursor-pointer">Mutual</Label>
                            </div>
                        </RadioGroup>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Exit Reason *</Label>
                            <Select value={exitReason} onValueChange={(v) => {
                                setExitReason(v as ExitReason);
                                if (v === 'Other') setOtherReason('');
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select exit reason" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {currentExitReasons.map((r) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {exitReason === 'Other' && (
                                <Input 
                                    placeholder="Specify other reason" 
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    className="mt-2"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Last Working Day *</Label>
                            <Input
                            type="date"
                            value={employeeDate}
                            onChange={(e) => setEmployeeDate(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Offboarding Start Date will be set to Today</p>
                        </div>
                     </div>
                  </div>

                  {/* Mandatory Documents */}
                  <div className="space-y-4 pt-4 md:col-span-2">
                     <h3 className="font-medium text-foreground border-b pb-2 flex justify-between items-center">
                        <span>3. Mandatory Documents</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">At least one required</span>
                     </h3>
                     
                     <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
                        <Input 
                            type="file" 
                            id="file-upload" 
                            multiple 
                            className="hidden" 
                            accept=".pdf,.eml,.msg"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="font-medium">Click to upload documents</p>
                            <p className="text-xs text-muted-foreground">Supported formats: .eml, .msg, .pdf</p>
                        </label>
                     </div>
                     
                     {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Uploaded Files:</p>
                            <div className="grid gap-2">
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-card border border-border rounded-md text-sm">
                                        <div className="flex items-center gap-2">
                                            <File className="w-4 h-4 text-primary" />
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                     )}
                  </div>

                  <div className="space-y-2 pt-4 border-t md:col-span-2">
                    <Label>Check List Template *</Label>
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
                      {stage.description && (
                        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {stage.tasks.map((task) => (
                        <div
                          key={task.taskId}
                          className="p-3 bg-muted/30 rounded-md space-y-3"
                        >
                          <div className="flex flex-col gap-1">
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
                            {task.description && (
                                <p className="text-xs text-muted-foreground ml-1">{task.description}</p>
                            )}
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
                        <h4 className="font-medium text-foreground">{stage.name}</h4>
                        {stage.description && (
                            <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
                        )}
                        <div className="space-y-2">
                          {stage.tasks.map((task) => (
                            <div
                              key={task.taskId}
                              className="flex flex-col gap-1 py-1"
                            >
                            <div className="flex items-center justify-between text-sm">
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
                                {task.description && (
                                    <p className="text-xs text-muted-foreground ml-2 border-l-2 pl-2 border-border">{task.description}</p>
                                )}
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
