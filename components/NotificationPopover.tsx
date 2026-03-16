'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNotification } from '@/contexts/NotificationContext';

interface Props {
  currentUserId: number;
}

export default function NotificationPopover({ currentUserId }: Props) {
  const { 
    notifications, 
    setNotifications, 
    isNotificationPopoverOpen, 
    setIsNotificationPopoverOpen,
    unreadCount,
    setUnreadCount
  } = useNotification();
  
  const supabase = createClient();

  // Fetch notifications when component mounts or currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  // Mark notifications as read when popover opens
  useEffect(() => {
    if (isNotificationPopoverOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isNotificationPopoverOpen, unreadCount]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` },
        async (payload) => {
          if (payload.new) {
            const newNotification = payload.new as any;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notification
            toast.info(newNotification.content, {
              duration: 4000,
              action: {
                label: "View",
                onClick: () => setIsNotificationPopoverOpen(true),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, setNotifications, setUnreadCount, setIsNotificationPopoverOpen]);

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Popover open={isNotificationPopoverOpen} onOpenChange={setIsNotificationPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex flex-col h-[400px]">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border-b last:border-b-0 relative ${
                      notification.status === 'Sent' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="pr-6 mb-1">{notification.content}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
} 