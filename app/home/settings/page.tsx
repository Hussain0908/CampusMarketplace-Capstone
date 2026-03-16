'use client';

import ChangePassword from '@/components/ChangePassword';
import DeleteAccount from '@/components/DeleteAccount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Navbar() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Settings</CardTitle>
          <CardDescription className="text-center">
            Customize Your Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
                <ChangePassword />
            <div>
              <DeleteAccount/>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}