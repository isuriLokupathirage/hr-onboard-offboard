import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Globe, FileText, ChevronLeft, Save, 
  Calendar, CreditCard, Users, Plus, Trash2, Upload, File, Eye, Download
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeAccounts, updateEmployeeAccount } from "@/lib/storage";
import { EmployeeAccount, FamilyMember } from "@/types/workflow";
import { clients, users } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, Key, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCreating = !id;

  const [formData, setFormData] = useState<Partial<EmployeeAccount>>({
      status: 'Active',

      employmentType: 'Full-time',
      familyMembers: []
  });

  useEffect(() => {
    if (id) {
      const accounts = getEmployeeAccounts();
      const employee = accounts.find(a => a.id === id);
      if (employee) {
        setFormData(employee);
      } else {
        toast({
          title: "Error",
          description: "Employee not found",
          variant: "destructive"
        });
        navigate("/admin/directory");
      }
    }
  }, [id, navigate, toast]);


  const handleChange = (key: keyof EmployeeAccount, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleBankChange = (key: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        bankDetails: {
            ...prev.bankDetails,
            [key]: value
        } as any
    }));
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
        ...prev,
        familyMembers: [
            ...(prev.familyMembers || []),
            { id: crypto.randomUUID(), name: '', relationship: 'Child' }
        ]
    }));
  };

  const updateFamilyMember = (index: number, key: keyof FamilyMember, value: any) => {
    const updated = [...(formData.familyMembers || [])];
    updated[index] = { ...updated[index], [key]: value };
    setFormData(prev => ({ ...prev, familyMembers: updated }));
  };

  const removeFamilyMember = (index: number) => {
    const updated = [...(formData.familyMembers || [])];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, familyMembers: updated }));
  };

  const handleSave = () => {
    // Basic verification
    if (!formData.name || !formData.email) {
        toast({ title: "Validation Error", description: "Name and Email are required", variant: "destructive" });
        return;
    }

    const accountToSave: EmployeeAccount = {
        ...formData,
        id: formData.id || crypto.randomUUID(),
        onboardedAt: formData.onboardedAt || new Date().toISOString()
    } as EmployeeAccount;

    updateEmployeeAccount(accountToSave);

    if (formData.password) {
        toast({
            title: "Account Created & Invited",
            description: `Invitation email sent to ${formData.email}. Access enabled.`
        });
    } else {
        toast({
            title: "Success",
            description: `Employee ${isCreating ? 'created' : 'updated'} successfully.`
        });
    }
    navigate("/admin/directory");
  };

  const calculateCompleteness = () => {
    let score = 0;
    let total = 0;

    const check = (val: any) => {
        total++;
        if (val && val.length > 0) score++;
    };

    // Personal (5 fields)
    check(formData.name);
    check(formData.email);
    check(formData.phone);
    check(formData.address);
    check(formData.nic);

    // Employment (4 fields)
    check(formData.employeeId);
    check(formData.department);
    check(formData.position);
    check(formData.joinedDate);

    // Banking (2 fields)
    check(formData.bankDetails?.bankName);
    check(formData.bankDetails?.accountNumber);

    // Family (1 field - at least one member)
    total++;
    if (formData.familyMembers && formData.familyMembers.length > 0) score++;

    // CV & Documents (2 fields)
    check(formData.bio);
    if (formData.documents && formData.documents.length > 0) score++;

    return Math.round((score / total) * 100);
  };

  const completeness = calculateCompleteness();

  const getSectionStatus = (section: string) => {
      switch(section) {
          case 'personal':
              return (formData.name && formData.email && formData.phone) ? 'complete' : 'pending';
          case 'employment':
              return (formData.employeeId && formData.department && formData.position) ? 'complete' : 'pending';
          case 'banking':
             return (formData.bankDetails?.bankName && formData.bankDetails?.accountNumber) ? 'complete' : 'pending';
          case 'family':
              return (formData.familyMembers && formData.familyMembers.length > 0) ? 'complete' : 'pending';
          case 'documents':
              return (formData.bio && formData.documents && formData.documents.length > 0) ? 'complete' : 'pending';
          default: return 'pending';
      }
  };

  const SectionIndicator = ({ title, status }: { title: string, status: string }) => (
      <div className="flex items-center justify-between text-sm py-2 border-b last:border-0">
          <span className="text-muted-foreground">{title}</span>
          {status === 'complete' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
              <Circle className="w-4 h-4 text-muted-foreground/30" />
          )}
      </div>
  );

  return (
    <AppLayout 
      title={isCreating ? "Create New Employee" : "Edit Employee"} 
      subtitle={isCreating ? "Add a new employee to the system" : `Managing details for ${formData.name}`}
    >
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={() => navigate("/admin/directory")}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
             </Button>
             <div className="flex-1"></div>
             <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Employee
             </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9 order-2 lg:order-1">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="family">Family</TabsTrigger>
                    <TabsTrigger value="documents">Docs & CV</TabsTrigger>
                    <TabsTrigger value="banking">Banking & Other</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: PERSONAL */}
                  <TabsContent value="personal" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Basic identity and contact details</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormField label="Title" value={formData.title} onChange={v => handleChange('title', v)} placeholder="Mr/Ms/Dr" />
                            <FormField label="Full Name" value={formData.name} onChange={v => handleChange('name', v)} required />
                            <FormField label="Display Name" value={formData.displayName} onChange={v => handleChange('displayName', v)} />
                            
                            <FormField label="Name with Initials" value={formData.nameWithInitials} onChange={v => handleChange('nameWithInitials', v)} />
                            <FormField label="Initials" value={formData.initials} onChange={v => handleChange('initials', v)} />
                            <FormField label="Surname" value={formData.surname} onChange={v => handleChange('surname', v)} />
                            
                            <FormField label="Gender" value={formData.gender} onChange={v => handleChange('gender', v)} />
                            <FormField label="Date of Birth" value={formData.dateOfBirth} onChange={v => handleChange('dateOfBirth', v)} type="date" />
                            <FormField label="NIC No" value={formData.nic} onChange={v => handleChange('nic', v)} />
                            
                            <FormField label="Civil Status" value={formData.civilStatus} onChange={v => handleChange('civilStatus', v)} />
                            <FormField label="Nationality" value={formData.nationality} onChange={v => handleChange('nationality', v)} />
                            <FormField label="Race" value={formData.race} onChange={v => handleChange('race', v)} />
                            <FormField label="Religion" value={formData.religion} onChange={v => handleChange('religion', v)} />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Personal Email" value={formData.personalEmail} onChange={v => handleChange('personalEmail', v)} type="email" />
                            <FormField label="Personal Mobile" value={formData.phone} onChange={v => handleChange('phone', v)} />
                            <FormField label="Home Number" value={formData.homePhone} onChange={v => handleChange('homePhone', v)} />
                            <div className="md:col-span-2">
                                 <FormField label="Permanent Address" value={formData.address} onChange={v => handleChange('address', v)} />
                            </div>
                             <div className="md:col-span-2">
                                 <FormField label="Temporary Address" value={formData.temporaryAddress} onChange={v => handleChange('temporaryAddress', v)} />
                            </div>
                        </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 2: EMPLOYMENT */}
                  <TabsContent value="employment" className="mt-6 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Work Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormField label="Employee ID" value={formData.employeeId} onChange={v => handleChange('employeeId', v)} />
                            <FormField label="EPF No" value={formData.epfNo} onChange={v => handleChange('epfNo', v)} />
                            <FormField label="Legal Entity" value={formData.legalEntity} onChange={v => handleChange('legalEntity', v)} />
                            
                            <FormField label="Position (Designation)" value={formData.position} onChange={v => handleChange('position', v)} />
                            <FormField label="Department" value={formData.department} onChange={v => handleChange('department', v)} />
                            <FormField label="Sub Department" value={formData.subDepartment} onChange={v => handleChange('subDepartment', v)} />
                            
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select value={formData.client?.id} onValueChange={(val) => {
                                     const c = clients.find(cl => cl.id === val);
                                     if(c) handleChange('client', c);
                                }}>
                                     <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                                     <SelectContent>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                     </SelectContent>
                                </Select>
                            </div>

                            <FormField label="Client Designation" value={formData.clientDesignation} onChange={v => handleChange('clientDesignation', v)} />
                            <FormField label="Project/Retainer" value={formData.project} onChange={v => handleChange('project', v)} />

                            <div className="space-y-2">
                                <Label>Leave Policy</Label>
                                <Select value={formData.leavePolicy} onValueChange={v => handleChange('leavePolicy', v)}>
                                     <SelectTrigger><SelectValue placeholder="Select Policy" /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Executive">Executive</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Comprehensive Policy</Label>
                                <Select value={formData.comprehensivePolicy} onValueChange={v => handleChange('comprehensivePolicy', v)}>
                                     <SelectTrigger><SelectValue placeholder="Select Policy" /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Premium">Premium</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Employment Type</Label>
                                <Select value={formData.employmentType} onValueChange={v => handleChange('employmentType', v)}>
                                     <SelectTrigger><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Intern">Intern</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>



                             <FormField label="Office Email" value={formData.email} onChange={v => handleChange('email', v)} type="email" required />

                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Hierarchy</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField label="Reporting Manager (Internal)" value={formData.supervisor?.name} onChange={() => {}} placeholder="Select User (Mock)" />
                             <FormField label="Client Supervisor" value={formData.clientSupervisor} onChange={v => handleChange('clientSupervisor', v)} />
                             <FormField label="Client HOD" value={formData.clientHod} onChange={v => handleChange('clientHod', v)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Key Dates</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormField label="Date Joined" value={formData.joinedDate} onChange={v => handleChange('joinedDate', v)} type="date" />
                            <FormField label="Confirmed Date" value={formData.confirmedDate} onChange={v => handleChange('confirmedDate', v)} type="date" />
                            <FormField label="Date Absorb to Permanent" value={formData.permanentDate} onChange={v => handleChange('permanentDate', v)} type="date" />
                            <FormField label="Mid Probation Due" value={formData.midProbationDate} onChange={v => handleChange('midProbationDate', v)} type="date" />
                            <FormField label="Probation/Contract Due" value={formData.contractEndDate} onChange={v => handleChange('contractEndDate', v)} type="date" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Access</CardTitle>
                            <CardDescription>Manage user account and access privileges</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable System Access</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow this employee to log in to the portal.
                                    </p>
                                </div>
                                <Switch
                                    checked={!!formData.password}
                                    onCheckedChange={(checked) => handleChange('password', checked ? 'Welcome@123' : '')}
                                />
                            </div>
                            
                            {formData.password && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border p-4 rounded-lg bg-muted/20">
                                    <div className="space-y-2">
                                        <Label>Temporary Password</Label>
                                        <div className="relative">
                                            <Input 
                                                value={formData.password} 
                                                onChange={(e) => handleChange('password', e.target.value)}
                                                className="pr-10"
                                            />
                                            <Key className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Share this with the employee for first-time login.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => {
                                                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                                                let pass = "";
                                                for(let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                                handleChange('password', pass);
                                            }}
                                        >
                                            Generate Random
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => {
                                                if (!formData.email) {
                                                    toast({ title: "Error", description: "Please enter an email address first.", variant: "destructive" });
                                                    return;
                                                }
                                                toast({
                                                    title: "Invitation Sent",
                                                    description: `Access details sent to ${formData.email}`
                                                });
                                            }}
                                        >
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Email
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 3: FAMILY */}
                  <TabsContent value="family" className="mt-6 space-y-6">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Dependents & Family</CardTitle>
                                <Button size="sm" onClick={addFamilyMember}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Member
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(!formData.familyMembers || formData.familyMembers.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">No family members added.</div>
                            )}
                            {formData.familyMembers?.map((member, index) => (
                                <div key={member.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-muted/20">
                                     <div className="md:col-span-4">
                                        <FormField label="Name" value={member.name} onChange={v => updateFamilyMember(index, 'name', v)} />
                                     </div>
                                     <div className="md:col-span-3">
                                         <Label className="text-xs mb-1.5 block">Relationship</Label>
                                         <Select value={member.relationship} onValueChange={v => updateFamilyMember(index, 'relationship', v)}>
                                             <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                             <SelectContent>
                                                <SelectItem value="Spouse">Spouse</SelectItem>
                                                <SelectItem value="Child">Child</SelectItem>
                                                <SelectItem value="Father">Father</SelectItem>
                                                <SelectItem value="Mother">Mother</SelectItem>
                                             </SelectContent>
                                         </Select>
                                     </div>
                                     <div className="md:col-span-3">
                                        <FormField label="Date of Birth" value={member.dateOfBirth} onChange={v => updateFamilyMember(index, 'dateOfBirth', v)} type="date" />
                                     </div>
                                     <div className="md:col-span-2 flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => removeFamilyMember(index)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                     </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 4: DOCUMENTS & CV */}
                  <TabsContent value="documents" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile & Bio</CardTitle>
                        <CardDescription>Public profile information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                          {/* Profile Picture */}
                          <div className="space-y-4">
                            <Label>Profile Picture</Label>
                            <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer">
                              {formData.profilePicture ? (
                                <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-12 h-12 text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      handleChange('profilePicture', reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground w-32 text-center">
                              Safe for a welcome post on social media
                            </p>
                          </div>

                          {/* Bio */}
                          <div className="flex-1 space-y-2 w-full">
                            <Label>Brief Description</Label>
                            <textarea
                              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tell us a bit about yourself..."
                              value={formData.bio || ''}
                              onChange={(e) => handleChange('bio', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              A short bio for internal introductions.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Documents</CardTitle>
                        <CardDescription>Manage essential documents</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'nic', label: 'NIC / Passport Copy' },
                            { id: 'birth_cert', label: 'Birth Certificate' },
                            { id: 'service_letters', label: 'Service Letters' },
                            { id: 'education', label: 'Highest Education Qualification' }
                          ].map((docType) => {
                             const existingDoc = formData.documents?.find(d => d.type === docType.id);
                             return (
                              <div key={docType.id} className="border p-4 rounded-lg bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-background flex items-center justify-center border">
                                    <File className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{docType.label}</p>
                                    {existingDoc ? (
                                      <div className="flex flex-col">
                                        <a href={existingDoc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[200px]">
                                          {existingDoc.name}
                                        </a>
                                        <span className="text-[10px] text-muted-foreground">
                                          {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                                    )}
                                  </div>
                                </div>
                                
                                {existingDoc ? (
                                   <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={() => window.open(existingDoc.url, '_blank')}>
                                       <Eye className="w-4 h-4" />
                                     </Button>
                                     <Button variant="outline" size="sm" onClick={() => {
                                        const newDocs = formData.documents?.filter(d => d.type !== docType.id) || [];
                                        handleChange('documents', newDocs);
                                     }}>
                                       <Trash2 className="w-4 h-4 text-destructive" />
                                     </Button>
                                   </div>
                                ) : (
                                  <div className="relative">
                                     <Button variant="secondary" size="sm" className="pointer-events-none">
                                       <Upload className="w-4 h-4 mr-2" />
                                       Upload
                                     </Button>
                                     <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if(file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const newDoc = {
                                                  name: file.name,
                                                  url: reader.result as string, // Base64
                                                  uploadedAt: new Date().toISOString(),
                                                  type: docType.id
                                                };
                                                const currentDocs = formData.documents || [];
                                                // replace if exists
                                                const otherDocs = currentDocs.filter(d => d.type !== docType.id);
                                                handleChange('documents', [...otherDocs, newDoc]);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                  </div>
                                )}
                              </div>
                             );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 4: BANKING & OTHER */}
                  <TabsContent value="banking" className="mt-6 space-y-6">
                      <Card>
                        <CardHeader>
                            <CardTitle>Financial Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             <FormField label="Bank Name" value={formData.bankDetails?.bankName} onChange={v => handleBankChange('bankName', v)} />
                             <FormField label="Branch Name" value={formData.bankDetails?.branchName} onChange={v => handleBankChange('branchName', v)} />
                             <FormField label="Account Name" value={formData.bankDetails?.accountName} onChange={v => handleBankChange('accountName', v)} />
                             <FormField label="Account Number" value={formData.bankDetails?.accountNumber} onChange={v => handleBankChange('accountNumber', v)} />
                             <FormField label="Account Type" value={formData.bankDetails?.accountType} onChange={v => handleBankChange('accountType', v)} />
                             <FormField label="Currency" value={formData.bankDetails?.currency} onChange={v => handleBankChange('currency', v)} />
                             <FormField label="TIN" value={formData.tin} onChange={v => handleChange('tin', v)} />
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle>Other Preferences</CardTitle>
                        </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label>T-Shirt Size</Label>
                                <Select value={formData.tShirtSize} onValueChange={v => handleChange('tShirtSize', v)}>
                                     <SelectTrigger><SelectValue placeholder="Select Size" /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Small">Small</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Large">Large</SelectItem>
                                        <SelectItem value="Extra Large">Extra Large</SelectItem>
                                        <SelectItem value="Extra Extra Large">Extra Extra Large</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-2">
                                <Label>Meal Preference</Label>
                                <Select value={formData.mealPreference} onValueChange={v => handleChange('mealPreference', v)}>
                                     <SelectTrigger><SelectValue placeholder="Select Preference" /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Veg">Veg</SelectItem>
                                        <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-2">
                                <Label>Liquor Preference</Label>
                                <Select value={formData.liquorPreference} onValueChange={v => handleChange('liquorPreference', v)}>
                                     <SelectTrigger><SelectValue placeholder="Select Option" /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                     </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
            </div>

            {/* SIDEBAR: PROGRESS */}
            <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
                <Card className="sticky top-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile Completeness</CardTitle>
                        <div className="flex items-end gap-2 mt-2">
                             <span className="text-3xl font-bold">{completeness}%</span>
                             <span className="text-sm text-muted-foreground mb-1">completed</span>
                        </div>
                        <Progress value={completeness} className="h-2 mt-2" />
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 space-y-1">
                        <SectionIndicator title="Personal Details" status={getSectionStatus('personal')} />
                        <SectionIndicator title="Employment Info" status={getSectionStatus('employment')} />
                        <SectionIndicator title="Family & Dependents" status={getSectionStatus('family')} />
                        <SectionIndicator title="Documents & CV" status={getSectionStatus('documents')} />
                        <SectionIndicator title="Banking Details" status={getSectionStatus('banking')} />
                    </CardContent>
                </Card>
                

            </div>
        </div>
      </div>
    </AppLayout>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", required = false }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Input 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder={placeholder}
                type={type}
                className="h-9"
            />
        </div>
    );
}
