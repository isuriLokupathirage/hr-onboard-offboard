import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Globe, Briefcase, ShieldCheck, UserCheck, Edit2, Save, X, Lock, Plus, FileText, Upload, Trash2, Download } from 'lucide-react';
import { EmployeeAccount, Workflow } from '@/types/workflow';
import { getWorkflows } from '@/lib/storage';
import { users } from '@/data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { toast } from '@/hooks/use-toast';

interface EmployeeDetailModalProps {
  employee: EmployeeAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updated: EmployeeAccount) => void;
  isCreating?: boolean;
}

export function EmployeeDetailModal({ employee, open, onOpenChange, onSave, isCreating = false }: EmployeeDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [formData, setFormData] = useState<Partial<EmployeeAccount>>({});
  
  // Creation specific state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Documents state
  const [documents, setDocuments] = useState<Array<{ name: string; url?: string; uploadedAt: string }>>([]);

  // Workflow copy state
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (isCreating) {
        setIsEditing(true);
        setFormData({
            status: 'Active',
            // Default values for dropdowns to avoid controlled/uncontrolled warnings if needed, 
            // but simplified here.
        } as Partial<EmployeeAccount>);
        setPassword('');
        setConfirmPassword('');
        setDocuments([]);
        
        // Fetch active onboarding workflows
        try {
          const workflows = getWorkflows();
          const onboardings = workflows.filter(w => w.type === 'Onboarding' && w.status === 'In Progress');
          setActiveWorkflows(onboardings);
        } catch (error) {
           console.error("Failed to load active workflows", error);
           setActiveWorkflows([]);
        }
        setSelectedWorkflowId('');
      } else if (employee) {
        setFormData({ ...employee });
        setIsEditing(false);
        setDocuments(employee.documents || []);
      }
    }
  }, [employee, open, isCreating]);

  const handleCopyFromWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    if (!workflowId) return;

    const workflow = activeWorkflows.find(w => w.id === workflowId);
    if (workflow) {
      // Find supervisor from imported users
      const supervisor = users.find((u: any) => u.id === workflow.employee.supervisorId);

      setFormData(prev => ({
        ...prev,
        name: workflow.employee.name,
        email: workflow.employee.email || prev.email,
        position: workflow.employee.position,
        department: workflow.employee.department,

        employmentType: workflow.employee.employmentType,
        client: workflow.client,
        supervisor: supervisor,
      }));

      // Also copy documents if any?
      const workflowDocs = workflow.stages.flatMap(s => s.tasks.flatMap(t => t.outputValue?.documents || []));
      if (workflowDocs.length > 0) {
        // Only add if not already present
        const newDocs = workflowDocs.filter(wd => !documents.some(d => d.name === wd.name));
        setDocuments(prev => [...prev, ...newDocs]);
      }
      
      toast({
        title: "Details Copied",
        description: `Filled details from ${workflow.employee.name}'s onboarding process.`,
      });
    }
  };

  if (!employee && !isCreating) return null;

  const handleSave = () => {
    if (onSave) {
        if (isCreating) {
            if (password !== confirmPassword) {
                // Ideally show error toast
                return; 
            }
            // Add password to formData for creation
            onSave({ 
                ...formData, 
                id: crypto.randomUUID(),
                password: password,
                // Ensure required fields are present or defaults
                client: formData.client || { id: '1', name: 'Unknown' }, // Mock default

                employmentType: formData.employmentType || 'Full-time',
                documents: documents,
            } as EmployeeAccount);
        } else if (formData && employee) {
            onSave({ ...employee, ...formData, documents } as EmployeeAccount);
        }
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (isCreating) {
        onOpenChange(false);
    } else {
        setIsEditing(false);
        if (employee) setFormData({ ...employee });
    }
  };

  const renderField = (Icon: any, label: string, key: keyof EmployeeAccount, placeholder?: string) => {
    const value = formData[key] as string;
    
    if (isEditing) {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
               <span className="text-muted-foreground"><Icon className="w-4 h-4" /></span> 
            </div>
            <Input 
              value={value || ''} 
              onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="h-9"
            />
          </div>
        </div>
      );
    }

    // View Mode
    return (
      <DetailItem 
        icon={Icon} 
        label={label} 
        value={(formData[key] as string) || (employee ? (employee[key] as string) : '') || 'Not specified'} 
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setIsEditing(false);
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                {isCreating ? <Plus className="w-8 h-8 text-primary" /> : <UserIcon className="w-8 h-8 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                    {isCreating ? 'Create New Employee' : (isEditing ? 'Edit Employee' : employee?.name)}
                </DialogTitle>
                
                {!isCreating && employee && (
                    <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{employee.employeeId || 'No ID'}</Badge>
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                        {employee.status}
                    </Badge>
                    </div>
                )}
              </div>
            </div>
            
            {onSave && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isCreating && (!formData.email || !password || !confirmPassword || !formData.name)}>
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? 'Create' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-8 animate-fade-in">
          
          {/* Copy from Workflow Section */}
          {isCreating && activeWorkflows.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-primary" />
                <Label className="font-medium">Copy details from Active Onboarding</Label>
              </div>
              <Select value={selectedWorkflowId} onValueChange={handleCopyFromWorkflow}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select an onboarding process..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeWorkflows.map(w => (
                     <SelectItem key={w.id} value={w.id}>
                       {w.employee?.name || 'Unknown'} - {w.employee?.position || 'Unknown'} ({w.client?.name || 'Unknown'})
                     </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Work Information */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isCreating && (
                    <div className="md:col-span-2">
                         {renderField(UserIcon, "Full Name", "name", "e.g. Kasun Perera")}
                    </div>
                )}

              {renderField(Briefcase, "Position", "position")}
              {renderField(ShieldCheck, "Department", "department")}
              
              {/* Client simplified for creating */}
              {isEditing ? (
                 <div className="space-y-1.5">
                   <Label className="text-xs text-muted-foreground">Client Name</Label>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Input 
                            value={formData.client?.name || ''} 
                            // For simplicity, just text input, but ideally select from client list
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                client: { id: '1', name: e.target.value } 
                            }))} 
                            placeholder="Client Name"
                            className="h-9"
                        /> 
                   </div>
                 </div>
              ) : (
                 <DetailItem icon={Globe} label="Client" value={employee?.client?.name || '-'} />
              )}
              

              {renderField(UserCheck, "Employment Type", "employmentType")}
              
            </div>
          </section>

          <Separator />

          {/* Account & Security (New Section for Creation) */}
          {isCreating && (
            <>
                <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Account Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField(Mail, "Work Email", "email", "kasun.p@company.lk")}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Temp Password</Label>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <Input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-9"
                                    placeholder="Temporary Password"
                                />
                            </div>
                        </div>
                         <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Confirm Password</Label>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <Input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-9"
                                    placeholder="Confirm Password"
                                />
                            </div>
                        </div>
                    </div>
                </section>
                <Separator />
            </>
          )}


          {/* Personal Information */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField(Calendar, "Date of Birth", "dateOfBirth")}
              {renderField(UserIcon, "Gender", "gender")}
              {renderField(Globe, "Nationality", "nationality")}
              {renderField(MapPin, "Address", "address")}
            </div>
          </section>

          <Separator />

          {/* Contact Information */}
          {!isCreating && (
             <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Contact & Emergency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField(Mail, "Work Email", "email")}
                {renderField(Mail, "Personal Email", "personalEmail")}
                {renderField(Phone, "Phone Number", "phone")}
                </div>
            </section>
          )}
          
             {/* Simple contact fields for creating */}
             {isCreating && (
                <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Additional Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {renderField(Mail, "Personal Email", "personalEmail")}
                         {renderField(Phone, "Phone Number", "phone")}
                    </div>
                </section>
             )}

            <Separator />

             {/* Documents Section */}
             <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents</h3>
                  {isEditing && (
                    <div className="relative">
                      <Input 
                        type="file" 
                        id="emp-doc-upload" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const newDoc = {
                              name: file.name,
                              url: URL.createObjectURL(file),
                              uploadedAt: new Date().toISOString()
                            };
                            setDocuments([...documents, newDoc]);
                            e.target.value = ''; // Reset
                          }
                        }}
                      />
                      <Label htmlFor="emp-doc-upload" className="cursor-pointer">
                        <Button size="sm" variant="outline" className="h-8 gap-2 pointer-events-none">
                          <Upload className="w-3.5 h-3.5" />
                          Add Document
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed text-muted-foreground text-sm">
                    No documents attached
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {isEditing && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ icon: Icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
