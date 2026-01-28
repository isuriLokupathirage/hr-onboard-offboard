export type Department = 'HR' | 'IT' | 'Finance';
export type TaskStatus = 'Pending' | 'Done' | 'Need Information';
export type WorkflowType = 'Onboarding' | 'Offboarding';
export type WorkflowStatus = 'In Progress' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  department: Department;
  avatar?: string;
}

export interface Task {
  id: string;
  name: string;
  assignedTo: User | null;
  department: Department;
  status: TaskStatus;
  dueDate?: string;
  notes?: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  client: Client;
  employee: {
    name: string;
    email: string;
    position: string;
    startDate?: string;
    endDate?: string;
  };
  stages: Stage[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTask {
  id: string;
  name: string;
  department: Department;
}

export interface TemplateStage {
  id: string;
  name: string;
  order: number;
  tasks: TemplateTask[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  type: WorkflowType;
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
