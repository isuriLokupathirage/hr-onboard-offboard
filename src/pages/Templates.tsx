import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Copy, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { WorkflowType, WorkflowTemplate } from '@/types/workflow';
import { toast } from '@/hooks/use-toast';
import { getTemplates, deleteTemplate, getWorkflows } from '@/lib/storage';

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkflowType | 'all'>('all');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDuplicate = (templateId: string) => {
    navigate(`/templates/create?duplicate=${templateId}`);
  };

  const handleDelete = (templateId: string) => {
    deleteTemplate(templateId);
    setTemplates(getTemplates());
    toast({
      title: 'Template Deleted',
      description: 'The template has been removed.',
    });
  };

  return (
    <AppLayout title="Check List Templates" subtitle="Manage reusable checklists">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as WorkflowType | 'all')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Offboarding">Offboarding</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => navigate('/templates/create')} 
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>
        </div>

        {/* Templates Table */}
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
                          <div className="flex items-center justify-end gap-1">
                            {(() => {
                              const activeTemplateIds = new Set(
                                getWorkflows()
                                  .filter(w => w.status === 'In Progress' && w.templateId)
                                  .map(w => w.templateId)
                              );
                              const isActive = activeTemplateIds.has(template.id);
                              
                              return (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                                    disabled={isActive}
                                    title={isActive ? "Cannot edit template currently used in active workflows" : "Edit Template"}
                                    className={isActive ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDuplicate(template.id)}
                                    title="Duplicate Template"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(template.id)}
                                    disabled={isActive}
                                    className={isActive ? "opacity-50 cursor-not-allowed" : "text-destructive hover:text-destructive"}
                                    title={isActive ? "Cannot delete template currently used in active workflows" : "Delete Template"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
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
      </div>
    </AppLayout>
  );
}
