import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Copy, Trash2, Edit, User, MoreVertical, Flag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkflowTypeBadge } from '@/components/ui/status-badge';
import { WorkflowType, WorkflowTemplate, Workflow, LibraryTask } from '@/types/workflow';
import { toast } from '@/hooks/use-toast';
import { 
  getTemplates, 
  deleteTemplate, 
  getWorkflows, 
  getLibraryTasks, 
  createLibraryTask, 
  updateLibraryTask, 
  deleteLibraryTask 
} from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { LibraryTaskModal } from '@/components/templates/LibraryTaskModal';
import { LibraryTaskViewModal } from '@/components/templates/LibraryTaskViewModal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Templates() {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [libraryTasks, setLibraryTasks] = useState<LibraryTask[]>([]);
  const [activeTab, setActiveTab] = useState('checklists');
  
  // Library Modal State
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLibraryTask, setEditingLibraryTask] = useState<LibraryTask | undefined>();
  const [viewingLibraryTask, setViewingLibraryTask] = useState<LibraryTask | undefined>();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Initialize type filter from URL param if present
  const initialType = type ? (type.charAt(0).toUpperCase() + type.slice(1)) as WorkflowType : 'all';
  const [typeFilter, setTypeFilter] = useState<WorkflowType | 'all'>(initialType);

  const loadData = () => {
    setTemplates(getTemplates());
    setWorkflows(getWorkflows());
    setLibraryTasks(getLibraryTasks());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update filter if URL param changes
  useEffect(() => {
    if (type) {
      setTypeFilter((type.charAt(0).toUpperCase() + type.slice(1)) as WorkflowType);
    } else {
      setTypeFilter('all');
    }
  }, [type]);

  const pageTitle = typeFilter === 'all' 
    ? (activeTab === 'checklists' ? 'Check List Templates' : 'Task Library')
    : (activeTab === 'checklists' ? `${typeFilter} Checklists` : `${typeFilter} Tasks`);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredLibraryTasks = libraryTasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(search.toLowerCase()) || 
                         task.description.toLowerCase().includes(search.toLowerCase());
    // We don't have a rigid type on library tasks yet, but we can filter by category or just keep it simple
    return matchesSearch;
  });

  const handleDuplicate = (templateId: string) => {
    navigate(`/templates/create?duplicate=${templateId}`);
  };

  const handleDelete = (templateId: string) => {
    deleteTemplate(templateId);
    loadData();
    toast({
      title: 'Template Deleted',
      description: 'The template has been removed.',
    });
  };

  const handleSaveLibraryTask = (taskData: any) => {
    if (taskData.id) {
      updateLibraryTask(taskData);
      toast({ title: 'Task Updated', description: 'The library task has been updated successfully.' });
    } else {
      createLibraryTask(taskData);
      toast({ title: 'Task Created', description: 'New task has been added to the library.' });
    }
    loadData();
  };

  const handleEditLibraryTask = (task: LibraryTask) => {
    setEditingLibraryTask(task);
    setIsLibraryModalOpen(true);
  };

  const handleViewTask = (task: LibraryTask) => {
    setViewingLibraryTask(task);
    setIsViewModalOpen(true);
  };

  const handleDeleteLibraryTask = (taskId: string) => {
    deleteLibraryTask(taskId);
    loadData();
    toast({
      title: 'Task Removed',
      description: 'The task has been deleted from the library.',
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    const next = new Set(selectedTaskIds);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setSelectedTaskIds(next);
  };

  const handleCreateTemplateFromSelection = () => {
    if (selectedTaskIds.size === 0) return;
    const selectedTasks = libraryTasks.filter(t => selectedTaskIds.has(t.id));
    // Redirect to creation with pre-filled tasks
    // For now we'll pass via state or query, but state is better for complex objects
    navigate('/templates/create', { state: { importedTasks: selectedTasks, type: typeFilter !== 'all' ? typeFilter : 'Onboarding' } });
  };

  return (
    <AppLayout title={pageTitle} subtitle="Manage reusable checklists and tasks">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'checklists' ? "Search templates..." : "Search tasks..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'checklists' ? (
              <Button 
                onClick={() => navigate('/templates/create', { 
                  state: { type: typeFilter !== 'all' ? typeFilter : undefined } 
                })} 
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {selectedTaskIds.size > 0 && (
                   <Button 
                    onClick={handleCreateTemplateFromSelection}
                    variant="outline"
                    className="gap-2 border-accent text-accent hover:bg-accent/10"
                  >
                    Create Template ({selectedTaskIds.size})
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    setEditingLibraryTask(undefined);
                    setIsLibraryModalOpen(true);
                  }} 
                  className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="checklists" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              Tasks
              <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                {filteredLibraryTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              Checklists
              <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                {filteredTemplates.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLibraryTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No tasks found in the library. Create one to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLibraryTasks.map((task) => {
                      return (
                        <TableRow 
                          key={task.id} 
                          className={cn(
                            "cursor-pointer select-none transition-colors",
                            selectedTaskIds.has(task.id) ? 'bg-accent/5' : 'hover:bg-muted/30'
                          )}
                          onDoubleClick={() => handleViewTask(task)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedTaskIds.has(task.id)}
                              onCheckedChange={() => toggleTaskSelection(task.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{task.name}</span>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                            )}
                          </TableCell>
                          <TableCell>{task.department}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Flag className={cn(
                                "w-3.5 h-3.5",
                                task.priority === 'High' ? "text-red-500 fill-red-500" :
                                task.priority === 'Medium' ? "text-yellow-500 fill-yellow-500" :
                                "text-blue-500 fill-blue-500"
                              )} />
                              <span className="text-sm">{task.priority || 'Medium'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              {task.dueDateConfig.type === 'none' && <span className="text-muted-foreground">None</span>}
                              {task.dueDateConfig.type === 'on-hire' && <span>On Hire Date</span>}
                              {task.dueDateConfig.type === 'relative' && (
                                <span className="text-sm">
                                  {task.dueDateConfig.days} {task.dueDateConfig.unit} {task.dueDateConfig.direction} hire
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem 
                                  onClick={() => handleEditLibraryTask(task)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLibraryTask(task.id)}
                                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="checklists" className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Stages</TableHead>
                    <TableHead>Total Tasks</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => {
                      const totalTasks = template.stages.reduce((acc, s) => acc + s.tasks.length, 0);
                      return (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium">{template.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <WorkflowTypeBadge type={template.type} />
                          </TableCell>
                          <TableCell>{template.stages.length}</TableCell>
                          <TableCell>{totalTasks}</TableCell>
                          <TableCell>{new Date(template.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                {(() => {
                                  const isActive = workflows.some(w => w.templateId === template.id && w.status === 'In Progress');
                                  return (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <DropdownMenuItem 
                                          onClick={() => navigate(`/templates/${template.id}/edit`)}
                                          disabled={isActive}
                                          className="gap-2 cursor-pointer"
                                        >
                                          <Edit className="w-4 h-4" />
                                          {isActive ? "Locked (In Use)" : "Edit Template"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDuplicate(template.id)}
                                          className="gap-2 cursor-pointer"
                                        >
                                          <Copy className="w-4 h-4" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(template.id)}
                                          disabled={isActive}
                                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete Template
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  );
                                })()}
                              </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LibraryTaskModal 
        isOpen={isLibraryModalOpen}
        task={editingLibraryTask}
        onClose={() => setIsLibraryModalOpen(false)}
        onSave={handleSaveLibraryTask}
      />

      <LibraryTaskViewModal
        task={viewingLibraryTask || null}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </AppLayout>
  );
}
