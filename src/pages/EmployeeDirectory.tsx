import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, User, Mail, Building2, Clock, Filter, MoreHorizontal, Edit, Eye, UserMinus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AccountStatus, EmployeeAccount, Workflow } from '@/types/workflow';
import { clients } from '@/data/mockData';
import { getEmployeeAccounts, updateEmployeeAccount, saveEmployeeAccounts, getWorkflows } from '@/lib/storage';
import { mockEmployeeAccounts } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function EmployeeDirectory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const [accounts, setAccounts] = useState<EmployeeAccount[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Always reload employees when page is shown (including after navigation)
  useEffect(() => {
    const load = () => {
      let employees = getEmployeeAccounts();
      if (!Array.isArray(employees) || employees.length === 0) {
        // Always reseed if empty or corrupted
        saveEmployeeAccounts(mockEmployeeAccounts);
        employees = getEmployeeAccounts();
      }
      setAccounts(employees);
      setWorkflows(getWorkflows());
    };
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  // Manual reset handler
  const handleResetEmployees = () => {
    saveEmployeeAccounts(mockEmployeeAccounts);
    setAccounts(getEmployeeAccounts());
  };


  const activeAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.email.toLowerCase().includes(search.toLowerCase()) ||
        account.position.toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === 'all' || account.client.id === clientFilter;
      return matchesSearch && matchesClient && account.status === 'Active';
    });
  }, [accounts, search, clientFilter]);

  const inactiveAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.email.toLowerCase().includes(search.toLowerCase()) ||
        account.position.toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === 'all' || account.client.id === clientFilter;
      return matchesSearch && matchesClient && account.status === 'Inactive';
    });
  }, [accounts, search, clientFilter]);

  const EmployeeTable = ({ data }: { data: EmployeeAccount[] }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Emp ID</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Onboarded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No employees found matching your filters
              </TableCell>
            </TableRow>
          ) : (
            data.map((account) => {
              const isOffboarding = workflows.some(w => 
                w.type === 'Offboarding' && 
                w.status === 'In Progress' && 
                w.employee.email === account.email
              );

              return (
                <TableRow 
                  key={account.id}
                  className={cn(isOffboarding && "bg-destructive/5 hover:bg-destructive/10")}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {account.employeeId || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isOffboarding ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {account.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{account.position}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {account.client.name}
                      </div>

                    </div>
                  </TableCell>
                  <TableCell>
                    {account.supervisor ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                          {account.supervisor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="text-sm">
                          <p className="text-foreground">{account.supervisor.name}</p>
                          <p className="text-[10px] text-muted-foreground">{account.supervisor.department}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {account.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      account.status === 'Active' 
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {account.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.onboardedAt ? new Date(account.onboardedAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => navigate(`/admin/directory/${account.id}`)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/directory/${account.id}/edit`)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AppLayout 
      title="Employee Management" 
      subtitle="View and manage all employee accounts across your organization"
    >
      <div className="space-y-6">

        <Tabs defaultValue="active" className="w-full">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => navigate('/admin/directory/new')}>
                <User className="w-4 h-4 mr-2" />
                Create Employee
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
             <TabsList>
              <TabsTrigger value="active" className="flex items-center gap-2">
                Active
                <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {activeAccounts.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                Inactive
                <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {inactiveAccounts.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active">
            <EmployeeTable data={activeAccounts} />
          </TabsContent>
          
          <TabsContent value="inactive">
             <EmployeeTable data={inactiveAccounts} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
