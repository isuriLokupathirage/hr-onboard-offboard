import {
  workflowTemplates as initialTemplates, 
  mockWorkflows as initialWorkflows,
  mockNotifications as initialNotifications,
  mockEmployeeAccounts
} from '@/data/mockData';
import { 
  WorkflowTemplate, 
  Workflow, 
  Notification, 
  EmployeeAccount, 
  AccountStatus,
  TemplateStage,
  TemplateTask,
  Comment,
  CommentAuthor,
  TaskStatus 
} from '@/types/workflow';

const TEMPLATES_KEY = 'hr_workflow_templates_v7';
const WORKFLOWS_KEY = 'hr_active_workflows_v7';
const NOTIFICATIONS_KEY = 'hr_notifications_v7';
const ACCOUNTS_KEY = 'hr_employee_accounts_v7';

// Custom event for workflow updates
const WORKFLOWS_UPDATED_EVENT = 'workflowsUpdated';

const dispatchWorkflowsUpdated = () => {
  window.dispatchEvent(new CustomEvent(WORKFLOWS_UPDATED_EVENT));
};

// Templates
export const getTemplates = (): WorkflowTemplate[] => {
  const stored = localStorage.getItem(TEMPLATES_KEY);
  if (!stored) {
    saveTemplates(initialTemplates);
    return initialTemplates;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing templates:', error);
    return [];
  }
};

export const saveTemplates = (templates: WorkflowTemplate[]) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  const templates = getTemplates();
  return templates.find((t) => t.id === id);
};

// Add this function
export const createTemplate = (templateData: Omit<WorkflowTemplate, 'createdAt' | 'updatedAt'>): WorkflowTemplate => {
  const templates = getTemplates();
  const now = new Date().toISOString();
  
  const newTemplate: WorkflowTemplate = {
    ...templateData,
    createdAt: now,
    updatedAt: now
  };
  
  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
};

// Update this function to handle both creation and updates
export const updateTemplate = (templateData: Omit<WorkflowTemplate, 'createdAt' | 'updatedAt'>): WorkflowTemplate => {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === templateData.id);
  
  const now = new Date().toISOString();
  
  if (index !== -1) {
    // Update existing template
    const updatedTemplate: WorkflowTemplate = {
      ...templateData,
      createdAt: templates[index].createdAt,
      updatedAt: now
    };
    templates[index] = updatedTemplate;
    saveTemplates(templates);
    return updatedTemplate;
  } else {
    // Create new template
    return createTemplate(templateData);
  }
};

export const deleteTemplate = (id: string) => {
  const templates = getTemplates().filter((t) => t.id !== id);
  saveTemplates(templates);
};

// Workflows
export const getWorkflows = (): Workflow[] => {
  const stored = localStorage.getItem(WORKFLOWS_KEY);
  if (!stored) {
    saveWorkflows(initialWorkflows);
    return initialWorkflows;
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error parsing workflows:', error);
    return [];
  }
};

export const saveWorkflows = (workflows: Workflow[]) => {
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  dispatchWorkflowsUpdated();
};

export const getWorkflowById = (id: string): Workflow | undefined => {
  const workflows = getWorkflows();
  return workflows.find((w) => w.id === id);
};

export const updateWorkflow = (workflow: Workflow) => {
  const workflows = getWorkflows();
  const index = workflows.findIndex((w) => w.id === workflow.id);
  if (index !== -1) {
    workflows[index] = { ...workflow, updatedAt: new Date().toISOString() };
  } else {
    workflows.push({ ...workflow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveWorkflows(workflows);
};

export const deleteWorkflow = (id: string) => {
  const workflows = getWorkflows().filter((w) => w.id !== id);
  saveWorkflows(workflows);
  // Event dispatched by saveWorkflows
};

// Notifications
export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!stored) {
    saveNotifications(initialNotifications);
    return initialNotifications;
  }
  return JSON.parse(stored);
};

export const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
};

export const markNotificationAsRead = (id: string) => {
  const notifications = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(notifications);
};

export const markAllNotificationsAsRead = () => {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(notifications);
};

export const deleteNotification = (id: string) => {
  const notifications = getNotifications().filter((n) => n.id !== id);
  saveNotifications(notifications);
};

// Employee Accounts
export const getEmployeeAccounts = (): EmployeeAccount[] => {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) {
    saveEmployeeAccounts(mockEmployeeAccounts);
    return mockEmployeeAccounts;
  }
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    saveEmployeeAccounts(mockEmployeeAccounts);
    return mockEmployeeAccounts;
  }
  return parsed;
};

export const saveEmployeeAccounts = (accounts: EmployeeAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const updateEmployeeAccount = (account: EmployeeAccount) => {
  const accounts = getEmployeeAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  if (index !== -1) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }
  saveEmployeeAccounts(accounts);
};

export const deactivateEmployeeAccount = (email: string) => {
  const accounts = getEmployeeAccounts();
  const updated = accounts.map(a => 
    a.email === email ? { ...a, status: 'Inactive' as AccountStatus, offboardedAt: new Date().toISOString() } : a
  );
  saveEmployeeAccounts(updated);
};

// Sequential Logic
export const getFlattenedTasks = (workflow: Workflow) => {
  return [...workflow.stages]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) => s.tasks);
};

export const isTaskAvailable = (workflow: Workflow, taskId: string): boolean => {
  // Find the target task
  const allTasks = getFlattenedTasks(workflow);
  const targetTask = allTasks.find(t => t.id === taskId);
  
  if (!targetTask) return false;
  
  // If no dependencies, it's available
  if (!targetTask.dependentOn || targetTask.dependentOn.length === 0) {
    return true;
  }
  
  // Check if all dependent tasks are Done
  return targetTask.dependentOn.every(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status === 'Done';
  });
};

export const getNextTask = (workflow: Workflow, currentTaskId: string) => {
  const tasks = getFlattenedTasks(workflow);
  const currentIndex = tasks.findIndex((t) => t.id === currentTaskId);
  if (currentIndex !== -1 && currentIndex < tasks.length - 1) {
    return tasks[currentIndex + 1];
  }
  return null;
};

// Comment Management
const findCommentById = (comments: Comment[], commentId: string): Comment | null => {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const found = findCommentById(comment.replies, commentId);
    if (found) return found;
  }
  return null;
};

export const addCommentToTask = (
  workflowId: string,
  taskId: string,
  text: string,
  author: CommentAuthor
): void => {
  const workflows = getWorkflows();
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return;

  const task = workflow.stages
    .flatMap((s) => s.tasks)
    .find((t) => t.id === taskId);
  
  if (!task) return;

  const newComment: Comment = {
    id: crypto.randomUUID(),
    text,
    author,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  if (!task.comments) {
    task.comments = [];
  }
  task.comments.push(newComment);

  updateWorkflow(workflow);
};

export const addReplyToComment = (
  workflowId: string,
  taskId: string,
  commentId: string,
  text: string,
  author: CommentAuthor
): void => {
  const workflows = getWorkflows();
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return;

  const task = workflow.stages
    .flatMap((s) => s.tasks)
    .find((t) => t.id === taskId);
  
  if (!task || !task.comments) return;

  const parentComment = findCommentById(task.comments, commentId);
  if (!parentComment) return;

  const newReply: Comment = {
    id: crypto.randomUUID(),
    text,
    author,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  parentComment.replies.push(newReply);
  updateWorkflow(workflow);
};

// Update this utility function to handle the type issues
export const ensureTemplateCompatibility = (template: Partial<WorkflowTemplate>): WorkflowTemplate => {
  const now = new Date().toISOString();
  
  // Ensure all stages have proper structure
  const stages: TemplateStage[] = (template.stages || []).map((stage: any, index: number) => ({
    id: stage.id || `stage-${Date.now()}-${index}`,
    name: stage.name || `Stage ${index + 1}`,
    order: stage.order || index + 1,
    tasks: (stage.tasks || []).map((task: any, taskIndex: number) => ({
      id: task.id || `task-${Date.now()}-${index}-${taskIndex}`,
      name: task.name || `Task ${taskIndex + 1}`,
      department: task.department || 'HR',
      assignedToId: task.assignedToId || 'unassigned',
      actionType: task.actionType,
      status: (task.status as TaskStatus) || 'Open',
      dueDate: task.dueDate || null,
      completedAt: task.completedAt || null,
      comments: task.comments || [],
      dependentOn: task.dependentOn || [],
      indent: task.indent || 0,
    }))
  }));
  
  return {
    id: template.id || `template-${Date.now()}`,
    name: template.name || 'Unnamed Template',
    type: template.type || 'Onboarding',
    client: template.client || { id: 'default', name: 'Default Client' },
    stages,
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  };
};

// Helper function to create a proper template from form data
export const createTemplateFromFormData = (formData: {
  id?: string;
  name: string;
  type: string;
  client: any;
  stages: any[];
}): WorkflowTemplate => {
  const now = new Date().toISOString();
  
  const stages: TemplateStage[] = formData.stages.map((stage, index) => ({
    id: stage.id || `stage-${Date.now()}-${index}`,
    name: stage.name,
    order: index + 1,
    tasks: stage.tasks.map((task: any, taskIndex: number) => ({
      id: task.id || `task-${stage.id}-${taskIndex}`,
      name: task.name,
      department: task.department,
      assignedToId: task.assignedToId || 'unassigned',
      actionType: task.actionType,
      status: 'Open' as TaskStatus,
      dueDate: null,
      completedAt: null,
      comments: [],
      dependentOn: task.dependentOn || [],
      indent: task.indent || 0,
    }))
  }));
  
  return {
    id: formData.id || `template-${Date.now()}`,
    name: formData.name,
    type: formData.type as any,
    client: formData.client,
    stages,
    createdAt: now,
    updatedAt: now,
  };
};

// Workflow Completion Logic
export const completeWorkflow = (workflow: Workflow): void => {
  const updatedWorkflow: Workflow = {
    ...workflow,
    status: 'Completed',
    updatedAt: new Date().toISOString(),
  };

  updateWorkflow(updatedWorkflow);

  // Handle Offboarding Persistence
  if (workflow.type === 'Offboarding') {
    const existingAccounts = getEmployeeAccounts();
    const existingAccount = existingAccounts.find(
      (a) => a.email === workflow.employee.email
    );

    if (existingAccount) {
      // Collect documents from workflow tasks
      const allDocuments = workflow.stages.flatMap(stage => 
        stage.tasks.flatMap(task => task.outputValue?.documents || [])
      ).map(doc => doc.url || doc.name); // Store as string paths/names for simplicity in EmployeeAccount

      const updatedAccount: EmployeeAccount = {
        ...existingAccount,
        status: 'Inactive',
        offboardedAt: new Date().toISOString(),
        offboardingType: workflow.offboardingDetails?.type,
        exitReason: workflow.offboardingDetails?.exitReason,
        lastWorkingDay: workflow.offboardingDetails?.lastWorkingDay,
        offboardingDocuments: allDocuments,
      };

      updateEmployeeAccount(updatedAccount);
    }
  } else if (workflow.type === 'Onboarding') {
      // Handle Onboarding Completion (existing logic refactored here optionally, or left in WorkflowDetail)
      // For now, we will focus on Offboarding persistence as requested.
      // But we can ensure Onboarding also creates/activates the user here if we want to unify everything.
  }
  
  addNotification({
    type: 'workflow_completed',
    message: `${workflow.type} workflow for ${workflow.employee.name} has been completed!`,
    workflowId: workflow.id,
  });
};