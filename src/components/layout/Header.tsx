import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        {/* Search - Removed */}
        <div className="hidden md:block w-64"></div>

        {/* Notifications */}
        <NotificationCenter />
      </div>
    </header>
  );
}
