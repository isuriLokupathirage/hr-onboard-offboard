
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: 'admin' | 'employee') => {
    login(role);
    if (role === 'employee') {
      navigate('/my-tasks');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">WorkflowHR Demo</CardTitle>
          <CardDescription>Select a role to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-24 text-lg flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
            onClick={() => handleLogin('admin')}
          >
            <ShieldCheck className="w-8 h-8 mb-1" />
            <span>Admin Login</span>
            <span className="text-xs text-muted-foreground font-normal">Full access to all features</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-24 text-lg flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
            onClick={() => handleLogin('employee')}
          >
            <Users className="w-8 h-8 mb-1" />
            <span>Employee Login</span>
            <span className="text-xs text-muted-foreground font-normal">Restricted access (My Tasks only)</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
