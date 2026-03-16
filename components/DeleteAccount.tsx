'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DeleteAccount() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setLoading(true);
    const supabase = createClient();
  
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("User not found:", error);
        setLoading(false);
        return;
      }
  
      // Update user in 'users' table to mark as deleted
      const { error: updateError } = await supabase
        .from('users')
        .update({ deleted: true })
        .eq('email', user.email);
  
      if (updateError) {
        console.error("Error marking user as deleted:", updateError);
        setLoading(false);
        return;
      }
      
      // Delete user from auth server
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to delete account');
  
      // Sign out the user
      await supabase.auth.signOut();
  
      // Clear local storage
      localStorage.clear();
  
      // Redirect to login page
      router.push('/login');
     
    } catch (error) {
      console.error("Error during account deletion:", error);
      setLoading(false);
    }
  };
  
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Delete Account</h2>
      <p className="text-muted-foreground mb-4">
        Once you delete your account, there is no going back. Please be certain.
      </p>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete My Account</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleDeleteAccount();
                setOpen(false);
              }}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}