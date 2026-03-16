'use client'

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { NotificationProvider as ContextProvider } from '@/contexts/NotificationContext';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const supabase = createClient();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user.email)
        .single();

      if (userError || !userData) return;
      setCurrentUserId(userData.user_id);
    };

    getCurrentUser();
  }, []);

  // Fetch notifications when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      
      // Count unread notifications
      const unread = data?.filter(n => n.status === 'Sent').length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'Read' })
        .eq('user_id', currentUserId)
        .eq('status', 'Sent');

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: notification.status === 'Sent' ? 'Read' : notification.status
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'Deleted' })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // If it was unread, update the count
      const wasUnread = notifications.find(n => n.id === id)?.status === 'Sent';
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  return (
    <ContextProvider
      value={{
        notifications,
        setNotifications,
        isNotificationPopoverOpen,
        setIsNotificationPopoverOpen,
        unreadCount,
        setUnreadCount,
        fetchNotifications,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </ContextProvider>
  );
} 