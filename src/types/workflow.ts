export type Department = 'HR' | 'IT' | 'Finance' | 'Marketing' | 'Legal';
export type WorkflowType = 'Onboarding' | 'Offboarding';
export type WorkflowStatus = 'In Progress' | 'Completed' | 'Cancelled';
export type TaskStatus = 'Open' | 'In Progress' | 'Need Info' | 'Done';

export type AccountStatus = 'Active' | 'Inactive';
export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time' | 'Intern';
export type Priority = 'High' | 'Medium' | 'Low';
export type WorkflowAction = 
  | 'CREATE_CREDENTIALS' 
  | 'COLLECT_DOCUMENTS' 
  | 'ASSIGN_ASSETS' 
  | 'RETURN_ASSETS' 
  | 'SEND_DOCUMENTS' 
  | 'DEACTIVATE_ACCOUNT'
  | 'SYSTEM_UPDATE'
  | 'EXTERNAL_COMMUNICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  department: Department;
  avatar?: string;
  isAdmin?: boolean;
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
}

export interface WorkflowComment {
  id: string;
  text: string;
  author: CommentAuthor;
  createdAt: string;
  replies: WorkflowComment[];
}

export interface Task {
  id: string;
  name: string;
  assignedTo: User | null;
  department: Department;
  status: TaskStatus;
  priority?: Priority;
  requiredDate?: string;
  dueDate?: string;
  notes?: string;
  description?: string;
  actionType?: WorkflowAction;
  outputValue?: {
    email?: string;
    password?: string;
    documents?: Array<{
      name: string;
      url?: string;
      uploadedAt: string;
    }>;
  };
  comments?: WorkflowComment[];
  dependentOn?: string[]; // Array of Task IDs this task depends on
  indent?: number; // Visual indentation level (0-3)
  attachments?: string[]; // Array of file names or URLs
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Spouse' | 'Father' | 'Mother' | 'Child';
  dateOfBirth?: string;
  phone?: string;
}

export interface BankDetails {
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
}

export interface EmployeeDocument {
  name: string;
  url?: string;
  uploadedAt: string;
  type?: string; // e.g., 'NIC', 'BirthCertificate'
}

export interface EmployeeAccount {
  id: string;
  employeeId?: string; // Emp No
  epfNo?: string;     // EPF No
  
  // Personal - Identity & Name
  title?: string;
  displayName?: string; // Display Name
  name: string; // Full Name
  nameWithInitials?: string;
  initials?: string;
  surname?: string; // or Last Name
  gender?: string;
  dateOfBirth?: string;
  nic?: string;
  civilStatus?: string;
  nationality?: string;
  race?: string;
  religion?: string;
  
  // Contact & Address
  email: string; // Office Email
  personalEmail?: string;
  phone?: string; // Personal Mobile 1
  countryCode?: string;
  homePhone?: string; // Home Number
  address?: string; // Permanent Address
  temporaryAddress?: string;

  // Employment
  position: string; // Xeynergy Designation
  clientDesignation?: string;
  department: Department;
  subDepartment?: string;
  client: Client;

  // workWeek?: string; // e.g. Mon-Fri
  employmentType: EmploymentType;
  supervisor?: User; // HOD / RM
  clientSupervisor?: string; // Name of Client Supervisor
  clientHod?: string; // Name of Client HOD
  project?: string; // Project/ Retainer/ Expediter
  
  leavePolicy?: string;
  comprehensivePolicy?: string;

  // Dates
  joinedDate?: string; // Date Joined
  confirmedDate?: string;
  contractEndDate?: string; // Prob/ Contract Due Date
  midProbationDate?: string; // Mid Probation Due
  permanentDate?: string; // Date absorb to Permanent Cadre
  
  // Legal & Financial
  tin?: string;
  legalEntity?: string;
  bankDetails?: BankDetails;
  
  // Other
  tShirtSize?: string;
  mealPreference?: string;
  liquorPreference?: string; // Liquor Preferance
  
  // CV & Profile
  bio?: string;
  profilePicture?: string;

  // System
  password?: string;
  status: AccountStatus;
  onboardedAt?: string;
  offboardedAt?: string;
  familyMembers?: FamilyMember[];
  documents?: EmployeeDocument[];
  
  
  // Offboarding Persistence
  offboardingType?: OffboardingType;
  exitReason?: ExitReason;
  resignationEffectiveDate?: string;
  noticePeriodStartDate?: string;
  payrollCutoffDate?: string;
  actualTerminationDate?: string;
  lastWorkingDay?: string;
  offboardingDocuments?: string[]; // URLs or paths to documents
  
  // holidayCalendar?: string;
}

export type OffboardingType = 'Voluntary' | 'Involuntary' | 'Mutual';

export type ExitReason = 
  | 'Career Growth / Opportunity'
  | 'Work–Life Balance'
  | 'Job Satisfaction'
  | 'Compensation & Benefits'
  | 'Relocation or Life Changes'
  | 'Health Reasons'
  | 'End of Internship'
  | 'End of Contract'
  | 'Client / Project Termination'
  | 'Performance-Related Issues'
  | 'Misconduct / Policy Violations'
  | 'Organizational Restructuring'
  | 'Mutual Agreement'
  | 'Other';

export interface OffboardingDetails {
  type: OffboardingType;
  exitReason: ExitReason;
  resignationEffectiveDate?: string;
  noticePeriodStartDate?: string;
  payrollCutoffDate?: string;
  actualTerminationDate?: string;
  lastWorkingDay: string;
  documents: string[];
}

export interface Workflow {
  id: string;
  templateId?: string;
  type: WorkflowType;
  client: Client;
  employee: {
    id: string;
    name: string;
    title?: string;
    email?: string;
    position: string;
    dateOfBirth?: string;
    department: Department;

    employmentType: EmploymentType;
    supervisorId?: string;
    startDate?: string;
    endDate?: string;
    gender?: string;
    phone?: string;
    countryCode?: string;
    address?: string;
  };
  offboardingDetails?: OffboardingDetails;
  stages: Stage[];
  status: WorkflowStatus;
  cancellationReason?: string;
  cancelledBy?: User;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTask {
  id: string;
  name: string;
  description?: string;
  department: Department;
  priority?: Priority;
  requiredDate?: string;
  dueDateConfig?: DueDateConfig;
  notificationConfig?: string;
  actionType?: WorkflowAction;
  dependentOn?: string[];
  indent?: number;
  attachments?: string[];
}

export interface TemplateStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: TemplateTask[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  type: WorkflowType;
  client: Client;
  stages: TemplateStage[];
  createdAt: string;
  updatedAt: string;
}

export type AssigneeType = 'Employee' | 'Manager' | 'HR' | 'IT' | 'Finance' | 'Legal';

export type TaskCategory = 'HR Tasks' | 'Miscellaneous' | 'IT Setup' | 'Manager Tasks' | 'New Employee Paperwork';

export type ReferenceDate = 
  | 'hire-date'
  | 'last-working-day'
  | 'payroll-cutoff'
  | 'termination-date'
  | 'notice-period-start';

export const REFERENCE_DATE_LABELS: Record<ReferenceDate, string> = {
  'hire-date': 'Hire Date',
  'last-working-day': 'Last Working Day',
  'payroll-cutoff': 'Payroll Cutoff Date',
  'termination-date': 'Termination Date',
  'notice-period-start': 'Notice Period Start',
};

export const ONBOARDING_REFERENCE_DATES: ReferenceDate[] = ['hire-date'];
export const OFFBOARDING_REFERENCE_DATES: ReferenceDate[] = [
  'last-working-day',
  'payroll-cutoff',
  'termination-date',
  'notice-period-start',
];

export interface DueDateConfig {
  type: 'none' | 'on-date' | 'relative';
  days?: number;
  unit?: 'days' | 'weeks' | 'months';
  direction?: 'before' | 'after';
  referenceDate?: ReferenceDate;
}

export interface LibraryTask {
  id: string;
  name: string;
  department: Department;
  priority?: Priority;
  category?: TaskCategory | string;
  allowFileUpload?: boolean;
  dueDateConfig: DueDateConfig;
  notificationConfig: string;
  description: string;
  attachments: string[]; // URLs or file names
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'workflow_completed';
  message: string;
  workflowId: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}


