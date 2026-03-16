"use client";
import Header from '@/components/Header';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';
import { ForgotPasswordLinkErrorHandler } from '@/lib/error-handler';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .refine((email) => email.endsWith('.edu'), {
    message: 'Please use your college email address',
  });

const formSchema = z.object({
    email: emailSchema,
});

export default function ForgotPasswordLinkPage() { 
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const errorHandler = new ForgotPasswordLinkErrorHandler();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        }
    });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      try {
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          });
    
          const data = await response.json();
    
          if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset link');
          }
          setSuccess(true);
          router.push('/forgot-password-link/success');
          form.reset();
        } 
        catch (error) {
          setSuccess(false);
          setError(errorHandler.handleError(error));
        } 
        finally {
          setIsLoading(false);
        }
  };
  


  return (
        <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold text-center">Forgot your password</CardTitle>
                <CardDescription className="text-center">
                  Please enter your email address to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription> {error}</AlertDescription>
            </Alert>
          )}
          </CardContent>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Email" {...field} 
                                    disabled={isLoading}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit" disabled={isLoading}>Request reset link</Button>

                    
                    </form>
                </Form>
                <div className="text-center mt-4">
                    <Link href="/login" className="text-sm text-blue-600">Back to login</Link>
                </div>
            </CardContent>
        </Card>
        </div>
        
        </>
    )
}