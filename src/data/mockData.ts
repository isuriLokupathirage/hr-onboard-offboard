import { Client, User, Workflow, Notification, Stage, Task, WorkflowTemplate } from '@/types/workflow';

export const clients: Client[] = [
  { id: '1', name: 'Inet Solutions' },
  { id: '2', name: 'PickMe' },
  { id: '3', name: 'Internal Projects' },
];

export const users: User[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', department: 'HR' },
  { id: '2', name: 'Michael Chen', email: 'michael@company.com', department: 'IT' },
  { id: '3', name: 'Emily Davis', email: 'emily@company.com', department: 'Finance' },
  { id: '4', name: 'James Wilson', email: 'james@company.com', department: 'HR' },
  { id: '5', name: 'Anna Martinez', email: 'anna@company.com', department: 'IT' },
];

export const onboardingStageTemplates: Omit<Stage, 'id' | 'tasks'>[] = [
  { name: 'At Offer Stage', order: 1 },
  { name: 'Week Before DOJ', order: 2 },
  { name: 'By DOJ', order: 3 },
];

export const offboardingStageTemplates: Omit<Stage, 'id' | 'tasks'>[] = [
  { name: 'Initiation', order: 1 },
  { name: 'Access Revocation', order: 2 },
  { name: 'Asset Return and Closure', order: 3 },
];

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'template-1',
    name: 'Standard IT Onboarding',
    type: 'Onboarding',
    stages: [
      {
        id: 'ts1',
        name: 'At Offer Stage',
        order: 1,
        tasks: [
          { id: 'tt1', name: 'Send offer letter', department: 'HR' },
          { id: 'tt2', name: 'Collect signed documents', department: 'HR' },
          { id: 'tt3', name: 'Background verification', department: 'HR' },
        ],
      },
      {
        id: 'ts2',
        name: 'Week Before DOJ',
        order: 2,
        tasks: [
          { id: 'tt4', name: 'Create email account', department: 'IT' },
          { id: 'tt5', name: 'Setup workstation', department: 'IT' },
          { id: 'tt6', name: 'Prepare payroll entry', department: 'Finance' },
        ],
      },
      {
        id: 'ts3',
        name: 'By DOJ',
        order: 3,
        tasks: [
          { id: 'tt7', name: 'Conduct orientation', department: 'HR' },
          { id: 'tt8', name: 'Assign access cards', department: 'IT' },
          { id: 'tt9', name: 'Complete joining formalities', department: 'HR' },
        ],
      },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Standard Offboarding',
    type: 'Offboarding',
    stages: [
      {
        id: 'ts4',
        name: 'Initiation',
        order: 1,
        tasks: [
          { id: 'tt10', name: 'Receive resignation letter', department: 'HR' },
          { id: 'tt11', name: 'Schedule exit interview', department: 'HR' },
        ],
      },
      {
        id: 'ts5',
        name: 'Access Revocation',
        order: 2,
        tasks: [
          { id: 'tt12', name: 'Revoke system access', department: 'IT' },
          { id: 'tt13', name: 'Disable email account', department: 'IT' },
        ],
      },
      {
        id: 'ts6',
        name: 'Asset Return and Closure',
        order: 3,
        tasks: [
          { id: 'tt14', name: 'Collect company assets', department: 'IT' },
          { id: 'tt15', name: 'Process final settlement', department: 'Finance' },
          { id: 'tt16', name: 'Issue experience letter', department: 'HR' },
        ],
      },
    ],
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z',
  },
  {
    id: 'template-3',
    name: 'Executive Onboarding',
    type: 'Onboarding',
    stages: [
      {
        id: 'ts7',
        name: 'At Offer Stage',
        order: 1,
        tasks: [
          { id: 'tt17', name: 'Send executive offer package', department: 'HR' },
          { id: 'tt18', name: 'Arrange relocation assistance', department: 'HR' },
          { id: 'tt19', name: 'Executive background check', department: 'HR' },
        ],
      },
      {
        id: 'ts8',
        name: 'Week Before DOJ',
        order: 2,
        tasks: [
          { id: 'tt20', name: 'Setup executive office', department: 'IT' },
          { id: 'tt21', name: 'Configure premium devices', department: 'IT' },
          { id: 'tt22', name: 'Arrange executive benefits', department: 'Finance' },
        ],
      },
      {
        id: 'ts9',
        name: 'By DOJ',
        order: 3,
        tasks: [
          { id: 'tt23', name: 'Executive welcome meeting', department: 'HR' },
          { id: 'tt24', name: 'Leadership team introduction', department: 'HR' },
        ],
      },
    ],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: '1',
    type: 'Onboarding',
    client: clients[0],
    employee: {
      name: 'Alex Thompson',
      email: 'alex.t@inet.com',
      position: 'Senior Software Engineer',
      startDate: '2024-02-01',
    },
    stages: [
      {
        id: 's1',
        name: 'At Offer Stage',
        order: 1,
        tasks: [
          { id: 't1', name: 'Send offer letter', assignedTo: users[0], department: 'HR', status: 'Done' },
          { id: 't2', name: 'Collect signed documents', assignedTo: users[0], department: 'HR', status: 'Done' },
          { id: 't3', name: 'Background verification', assignedTo: users[3], department: 'HR', status: 'Pending' },
        ],
      },
      {
        id: 's2',
        name: 'Week Before DOJ',
        order: 2,
        tasks: [
          { id: 't4', name: 'Create email account', assignedTo: users[1], department: 'IT', status: 'Pending' },
          { id: 't5', name: 'Setup workstation', assignedTo: users[4], department: 'IT', status: 'Pending' },
          { id: 't6', name: 'Prepare payroll entry', assignedTo: users[2], department: 'Finance', status: 'Pending' },
        ],
      },
      {
        id: 's3',
        name: 'By DOJ',
        order: 3,
        tasks: [
          { id: 't7', name: 'Conduct orientation', assignedTo: users[0], department: 'HR', status: 'Pending' },
          { id: 't8', name: 'Assign access cards', assignedTo: users[1], department: 'IT', status: 'Pending' },
          { id: 't9', name: 'Complete joining formalities', assignedTo: users[3], department: 'HR', status: 'Pending' },
        ],
      },
    ],
    status: 'In Progress',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    type: 'Offboarding',
    client: clients[1],
    employee: {
      name: 'Rachel Green',
      email: 'rachel.g@pickme.com',
      position: 'Product Manager',
      endDate: '2024-02-15',
    },
    stages: [
      {
        id: 's4',
        name: 'Initiation',
        order: 1,
        tasks: [
          { id: 't10', name: 'Receive resignation letter', assignedTo: users[0], department: 'HR', status: 'Done' },
          { id: 't11', name: 'Schedule exit interview', assignedTo: users[3], department: 'HR', status: 'Done' },
        ],
      },
      {
        id: 's5',
        name: 'Access Revocation',
        order: 2,
        tasks: [
          { id: 't12', name: 'Revoke system access', assignedTo: users[1], department: 'IT', status: 'Pending' },
          { id: 't13', name: 'Disable email account', assignedTo: users[4], department: 'IT', status: 'Pending' },
        ],
      },
      {
        id: 's6',
        name: 'Asset Return and Closure',
        order: 3,
        tasks: [
          { id: 't14', name: 'Collect company assets', assignedTo: users[1], department: 'IT', status: 'Pending' },
          { id: 't15', name: 'Process final settlement', assignedTo: users[2], department: 'Finance', status: 'Pending' },
          { id: 't16', name: 'Issue experience letter', assignedTo: users[0], department: 'HR', status: 'Pending' },
        ],
      },
    ],
    status: 'In Progress',
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
  },
  {
    id: '3',
    type: 'Onboarding',
    client: clients[2],
    employee: {
      name: 'David Kim',
      email: 'david.k@internal.com',
      position: 'Data Analyst',
      startDate: '2024-01-20',
    },
    stages: [
      {
        id: 's7',
        name: 'At Offer Stage',
        order: 1,
        tasks: [
          { id: 't17', name: 'Send offer letter', assignedTo: users[0], department: 'HR', status: 'Done' },
          { id: 't18', name: 'Collect documents', assignedTo: users[3], department: 'HR', status: 'Done' },
        ],
      },
      {
        id: 's8',
        name: 'Week Before DOJ',
        order: 2,
        tasks: [
          { id: 't19', name: 'Setup accounts', assignedTo: users[1], department: 'IT', status: 'Done' },
          { id: 't20', name: 'Prepare workstation', assignedTo: users[4], department: 'IT', status: 'Done' },
        ],
      },
      {
        id: 's9',
        name: 'By DOJ',
        order: 3,
        tasks: [
          { id: 't21', name: 'Orientation complete', assignedTo: users[0], department: 'HR', status: 'Done' },
          { id: 't22', name: 'All access granted', assignedTo: users[1], department: 'IT', status: 'Done' },
        ],
      },
    ],
    status: 'Completed',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'task_assigned',
    message: 'You have been assigned "Create email account" for Alex Thompson',
    workflowId: '1',
    taskId: 't4',
    read: false,
    createdAt: '2024-01-22T10:00:00Z',
  },
  {
    id: 'n2',
    type: 'task_completed',
    message: 'Sarah Johnson completed "Send offer letter"',
    workflowId: '1',
    taskId: 't1',
    read: false,
    createdAt: '2024-01-21T15:30:00Z',
  },
  {
    id: 'n3',
    type: 'task_assigned',
    message: 'You have been assigned "Revoke system access" for Rachel Green',
    workflowId: '2',
    taskId: 't12',
    read: true,
    createdAt: '2024-01-20T09:00:00Z',
  },
  {
    id: 'n4',
    type: 'workflow_completed',
    message: 'Onboarding workflow for David Kim has been completed',
    workflowId: '3',
    read: true,
    createdAt: '2024-01-20T16:00:00Z',
  },
];

export const currentUser: User = users[1]; // Michael Chen - IT
