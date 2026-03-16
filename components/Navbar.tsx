'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Bell, MessageSquare, User, Settings, LogOut, Package } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MessagePopover from "@/components/MessagePopover";
import { useMessage } from "@/contexts/MessageContext";
import NotificationPopover from '@/components/NotificationPopover';

interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  universities: {
    name: string;
    city: string;
    state: string;
  };
}

export default function Navbar() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { selectedUserId, setSelectedUserId } = useMessage();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('users')
          .select(`
            first_name,
            last_name,
            email,
            profile_picture,
            universities (
              name,
              city,
              state
            ),
            user_id
          `)
          .eq('email', user.email)
          .single();
          
        if (data) {
          setUserProfile(data);
        }
      }
    };

    fetchUserProfile();
    const subscription = supabase
    .channel('profile-updates')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
      setUserProfile((prev) => ({
        ...prev!,
        profile_picture: payload.new.profile_picture,
      }));
    })
    .subscribe();


    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-10 h-16 border-b bg-background">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/home">
            <Image
              src="/campus-marketplacelogo.png"
              alt="Logo"
              width={70}
              height={70}
              
            />

          </Link>
        </div>

        <div className="flex items-center space-x-6">
          {userProfile?.user_id && (
            <>
              <NotificationPopover currentUserId={userProfile.user_id} />
              <MessagePopover currentUserId={userProfile.user_id} />
            </>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage 
                    src={userProfile?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.first_name} ${userProfile?.last_name}`} 
                    alt="Profile picture"
                  />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-80 p-4" align="end">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={userProfile?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.first_name} ${userProfile?.last_name}`} 
                    alt="Profile picture"
                  />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-semibold">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground break-all">
                    {userProfile?.email}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-1">
                <p className="text-sm font-medium">{userProfile?.universities.name}</p>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.universities.city}, {userProfile?.universities.state}
                </p>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link href="/home/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/home/trade-requests">
                    <Package className="mr-2 h-4 w-4" />
                    Trades
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/home/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}


