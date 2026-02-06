export type Department = 'HR' | 'IT' | 'Finance' | 'Marketing';
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

export interface Comment {
  id: string;
  text: string;
  author: CommentAuthor;
  createdAt: string;
  replies: Comment[];
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
  comments?: Comment[];
  dependentOn?: string[]; // Array of Task IDs this task depends on
  indent?: number; // Visual indentation level (0-3)
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
  lastWorkingDay: string;
  documents: string[];
}

export interface Workflow {
  id: string;
  templateId?: string;
  type: WorkflowType;
  client: Client;
  employee: {
    name: string;
    email?: string;
    position: string;
    department: Department;

    employmentType: EmploymentType;
    supervisorId?: string;
    startDate?: string;
    endDate?: string;
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
  actionType?: WorkflowAction;
  dependentOn?: string[];
  indent?: number;
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

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'workflow_completed';
  message: string;
  workflowId: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}


