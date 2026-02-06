import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, Calendar, FileText, CreditCard, UserMinus, Download, ExternalLink } from 'lucide-react';
import { getEmployeeAccounts } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeDocument } from '@/types/workflow';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);
  const accounts = getEmployeeAccounts();
  const employee = accounts.find(a => a.id === id);

  if (!employee) {
    return (
      <AppLayout title="Employee Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <h2 className="text-2xl font-semibold">Employee not found</h2>
          <Button onClick={() => navigate('/admin/directory')}>
            Back to Directory
          </Button>
        </div>
      </AppLayout>
    );
  }

  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <AppLayout title="Employee Details" subtitle={`View details for ${employee.name}`}>
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/admin/directory')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Button>

        {/* Header Profile */}
        <div className="flex items-start gap-6 p-6 bg-card border rounded-xl shadow-sm">
          <Avatar className="w-24 h-24">
            <AvatarImage src={employee.profilePicture} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {employee.position} at {employee.client.name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {employee.email}
              </span>
            </div>
            <div className="pt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                ${employee.status === 'Active' 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-muted text-muted-foreground border-border"}`}>
                {employee.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {employee.status === 'Active' && (
              <Button 
                variant="destructive"
                onClick={() => navigate(`/start/offboarding?employeeId=${employee.id}`)}
                className="gap-2"
              >
                <UserMinus className="w-4 h-4" />
                Offboard Employee
              </Button>
            )}
            <Button onClick={() => navigate(`/admin/directory/${employee.id}/edit`)}>
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Financial & Legal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Work Email</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Work Phone</p>
                      <p className="text-sm text-muted-foreground">{employee.phone || 'N/A'}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Work Location</p>
                      <p className="text-sm text-muted-foreground">{employee.client.name} Office</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                     <div>
                      <p className="text-sm font-medium">Employment Type</p>
                      <p className="text-sm text-muted-foreground">{employee.employmentType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Joined Date</p>
                      <p className="text-sm text-muted-foreground">{employee.joinedDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supervisor</p>
                      <p className="text-sm text-muted-foreground">{employee.supervisor?.name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Private personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm font-medium mb-1">Full Name</p>
                        <p className="text-sm text-muted-foreground">{employee.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Name with Initials</p>
                        <p className="text-sm text-muted-foreground">{employee.nameWithInitials || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Gender</p>
                        <p className="text-sm text-muted-foreground">{employee.gender || '-'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">Date of Birth</p>
                        <p className="text-sm text-muted-foreground">{employee.dateOfBirth || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">NIC / ID</p>
                        <p className="text-sm text-muted-foreground">{employee.nic || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Civil Status</p>
                        <p className="text-sm text-muted-foreground">{employee.civilStatus || '-'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">Nationality</p>
                        <p className="text-sm text-muted-foreground">{employee.nationality || '-'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">Religion</p>
                        <p className="text-sm text-muted-foreground">{employee.religion || '-'}</p>
                    </div>
                 </div>

                 <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4 text-sm">Contact & Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <p className="text-sm font-medium mb-1">Personal Email</p>
                             <p className="text-sm text-muted-foreground">{employee.personalEmail || '-'}</p>
                        </div>
                         <div>
                             <p className="text-sm font-medium mb-1">Mobile Number</p>
                             <p className="text-sm text-muted-foreground">{employee.phone || '-'}</p>
                        </div>
                          <div>
                             <p className="text-sm font-medium mb-1">Permanent Address</p>
                             <p className="text-sm text-muted-foreground">{employee.address || '-'}</p>
                        </div>
                          <div>
                             <p className="text-sm font-medium mb-1">Temporary Address</p>
                             <p className="text-sm text-muted-foreground">{employee.temporaryAddress || '-'}</p>
                        </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm font-medium mb-1">Employee ID</p>
                        <p className="text-sm text-muted-foreground">{employee.employeeId || '-'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">EPF No</p>
                        <p className="text-sm text-muted-foreground">{employee.epfNo || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Designation</p>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Department</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">Client</p>
                        <p className="text-sm text-muted-foreground">{employee.client.name}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium mb-1">Project</p>
                        <p className="text-sm text-muted-foreground">{employee.project || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                     <h3 className="font-semibold mb-4 text-sm">Key Dates</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm font-medium mb-1">Joined Date</p>
                            <p className="text-sm text-muted-foreground">{employee.joinedDate || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Confirmed Date</p>
                            <p className="text-sm text-muted-foreground">{employee.confirmedDate || '-'}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium mb-1">Contract End Date</p>
                            <p className="text-sm text-muted-foreground">{employee.contractEndDate || '-'}</p>
                        </div>
                     </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial & Legal</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <p className="text-sm font-medium mb-1">Bank Name</p>
                            <p className="text-sm text-muted-foreground">{employee.bankDetails?.bankName || '-'}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium mb-1">Branch</p>
                            <p className="text-sm text-muted-foreground">{employee.bankDetails?.branchName || '-'}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium mb-1">Account Number</p>
                            <p className="text-sm text-muted-foreground">{employee.bankDetails?.accountNumber || '-'}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium mb-1">Account Name</p>
                            <p className="text-sm text-muted-foreground">{employee.bankDetails?.accountName || '-'}</p>
                        </div>
                    </div>
                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <p className="text-sm font-medium mb-1">TIN</p>
                             <p className="text-sm text-muted-foreground">{employee.tin || '-'}</p>
                        </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="documents">
             <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Uploaded documents and files</CardDescription>
                </CardHeader>
                <CardContent>
                    {employee.documents && employee.documents.length > 0 ? (
                        <div className="space-y-4">
                            {employee.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(doc)}>
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No documents uploaded yet</p>
                         </div>
                    )}
                </CardContent>
             </Card>
           </TabsContent>
        </Tabs>

        {/* Document Viewer Modal */}
        <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{selectedDocument?.name}</DialogTitle>
                    <DialogDescription>
                        Uploaded on {selectedDocument?.uploadedAt ? new Date(selectedDocument.uploadedAt).toLocaleDateString() : '-'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 bg-muted/20 w-full rounded-md border text-center flex flex-col items-center justify-center p-4 overflow-hidden">
                    {selectedDocument?.url ? (
                        <iframe 
                            src={selectedDocument.url} 
                            className="w-full h-full bg-white rounded-md"
                            title={selectedDocument.name}
                        />
                    ) : (
                        <div className="text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Preview not available for this file type.</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t flex-shrink-0">
                    <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                        Close
                    </Button>
                    {selectedDocument?.url && (
                        <Button asChild>
                            <a href={selectedDocument.url} download={selectedDocument.name} target="_blank" rel="noopener noreferrer" className="gap-2">
                                <Download className="w-4 h-4" /> Download
                            </a>
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
