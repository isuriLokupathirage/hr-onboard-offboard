import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle, AlertCircle, UserPlus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Notification } from '@/types/workflow';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '@/lib/storage';

const notificationIcons: Record<Notification['type'], React.ElementType> = {
  task_assigned: UserPlus,
  task_completed: CheckCircle,
  workflow_completed: CheckCircle,
};

const notificationColors: Record<Notification['type'], string> = {
  task_assigned: 'text-accent',
  task_completed: 'text-success',
  workflow_completed: 'text-success',
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    loadNotifications();
    // Refresh every 10 seconds for "live" feel in this local demo
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    loadNotifications();
    
    if (notification.taskId || notification.type === 'task_assigned') {
      navigate('/my-tasks');
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
    loadNotifications();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const iconColor = notificationColors[notification.type] || 'text-muted-foreground';

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer group',
                    !notification.read && 'bg-accent/5'
                  )}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div className={cn('mt-0.5', iconColor)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm text-foreground',
                        !notification.read && 'font-medium'
                      )}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDismiss(e, notification.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
