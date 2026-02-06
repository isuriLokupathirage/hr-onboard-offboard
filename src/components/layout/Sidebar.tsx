import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const navSections: NavSection[] = [
    {
      title: 'General',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ClipboardList, label: 'My Tasks', path: '/my-tasks', badge: 4 },
      ]
    },
    {
      title: 'Transitions',
      items: [
        { icon: UserPlus, label: 'Start Process', path: '/start/onboarding' },
      ]
    },
    {
      title: 'Organization',
      items: [
        { icon: Eye, label: 'Task Monitoring', path: '/admin/monitoring' },
        { icon: FileText, label: 'Check List Templates', path: '/templates' },
      ]
    },
    {
      title: 'Employee Management',
      items: [
        { icon: Users, label: 'All Employees', path: '/admin/directory' },
      ]
    }
  ];

  // Filter sections based on role
  const filteredSections = role === 'employee' 
    ? [{
        title: 'General',
        items: [{ icon: ClipboardList, label: 'My Tasks', path: '/my-tasks', badge: 4 }]
      }]
    : navSections;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'h-full bg-sidebar flex flex-col transition-all duration-300 border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">WorkflowHR</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'nav-item w-full',
                    isActive && 'nav-item-active'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      <span className="truncate text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      {!collapsed && user && (
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sm font-medium text-sidebar-primary-foreground">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-muted truncate">{user.department}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
      
      {collapsed && (
          <div className="p-2 border-t border-sidebar-border">
            <Button 
                variant="ghost" 
                size="icon"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                title="Sign Out"
            >
                <LogOut className="w-4 h-4" />
            </Button>
          </div>
      )}
    </aside>
  );
}
