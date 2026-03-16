'use client'

import { createContext, useContext, useState } from 'react'

interface Notification {
  id: number;
  content: string;
  status: 'Sent' | 'Read' | 'Deleted';
  created_at: string;
  user_id: number;
}

interface NotificationContextType {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  isNotificationPopoverOpen: boolean;
  setIsNotificationPopoverOpen: (open: boolean) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

//This is gonna follow a somiliar pattern to the Message Provider, since they are both listening realtime on supabase tables
// that are related to their functionality
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      setNotifications,
      isNotificationPopoverOpen,
      setIsNotificationPopoverOpen,
      unreadCount,
      setUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 