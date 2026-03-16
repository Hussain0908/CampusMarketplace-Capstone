'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
            )
          `)
          .eq('email', user.email)
          .single();
          
        if (data) {
          setUserProfile(data);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!imageFile || !userProfile) return;
  
    setUploading(true);
  
    try {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `profile_pictures/${userProfile.email}.${fileExt}`;
  
      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage.from("Campus Marketplace").upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: true,
      });
  
      if (error) {
        alert(`Upload failed: ${error.message}`);
        return;
      }
  
      // Get the public URL
      const { data: publicUrlData, error: urlError } = await supabase.storage
        .from("Campus Marketplace")
        .getPublicUrl(filePath);
  
        if (urlError) {
          alert(`Failed to get image URL: ${urlError.message}`);
          return;
        }
  
      // Update user's profile picture in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture: publicUrlData.publicUrl })
        .eq("email", userProfile.email);
  
        if (updateError) {
          alert(`Database update failed: ${updateError.message}`);
          return;
        }
  
      // Reload the page after successful upload
       window.location.reload();
    } catch (error) {
      alert("An unexpected error occurred. Check the console.");
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteProfilePicture = async () => {
    if (!userProfile) return;

    const confirmDelete = window.confirm("Are you sure you want to delete your profile picture?");
    
    if (!confirmDelete) return;

    try {
      // Remove profile picture from database
      const { error } = await supabase
        .from("users")
        .update({ profile_picture: null })
        .eq("email", userProfile.email);

      if (error) {
        alert(`Failed to delete profile picture: ${error.message}`);
        return;
      }

      window.location.reload();
    } catch (error) {
      alert("An unexpected error occurred. Check the console.");
    }
  };

  const getInitials = () => {
    if (!userProfile) return '';
    const { first_name, last_name } = userProfile;
    return `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`.toUpperCase();
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Profile</CardTitle>
          <CardDescription className="text-center">
            Check out your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
          <div className="relative flex flex-col items-center space-y-2">
            
            
            {/* Clickable Profile Picture with Hover Effect */}
            <label htmlFor="fileUpload" className="relative cursor-pointer group">
              <Avatar className="w-24 h-24">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Profile Preview" />
                ) : userProfile?.profile_picture ? (
                  <AvatarImage src={userProfile.profile_picture} alt="Profile Picture" />
                ) : (
                  <AvatarFallback className="text-2xl font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                <span className="text-white text-sm md:font-bold">Edit Picture</span>
              </div>
            </label>

            {/* Hidden File Input */}
  <input 
    id="fileUpload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileChange}
  />

      {imageFile && <p className="text-sm text-gray-600">{imageFile.name}</p>}

        {/* Upload & Delete Buttons */}
        <div className="flex gap-4 mt-2">
        {imageFile && (
       <Button onClick={handleUpload} disabled={uploading}>
         {uploading ? "Uploading..." : "Save Changes"}
        </Button>
        )}
     {userProfile?.profile_picture && !imageFile && (
        <Button onClick={handleDeleteProfilePicture} variant="destructive">
        Delete Picture
       </Button>
  )}
        </div>
      </div>


            
            
            {/* Firstname Section */}
            <div>
              <h3 className="text-lg font-medium">First Name</h3>
              <p className="mt-2">{userProfile?.first_name}</p>
            </div>

            {/* Lastname Section */}
            <div>
              <h3 className="text-lg font-medium">Last Name</h3>
              <p className="mt-2">{userProfile?.last_name}</p>
            </div>

            {/* School Email */}
            <div>
              <h3 className="text-lg font-medium">Student Email</h3>
              <p className="mt-2">{userProfile?.email}</p>
            </div>

            {/* University Section */}
            <div>
              <h3 className="text-lg font-medium">Attending University</h3>
              <p className="mt-2">{userProfile?.universities.name}</p>
            </div>

            {/* Save Button */}
           
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
