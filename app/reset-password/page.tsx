"use client";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Lock , Circle, CheckCircle2} from 'lucide-react';
import { ForgotPasswordErrorHandler } from '@/lib/error-handler';
import { Form, FormField } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormItem, FormControl, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const formSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
});
export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });

    const router = useRouter();
    const errorHandler= new ForgotPasswordErrorHandler();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
        },
    });

    const validatePassword = (password: string) => {
        setPasswordChecks({
          length: password.length >= 8,
          uppercase: /[A-Z]/.test(password),
          lowercase: /[a-z]/.test(password),
          number: /[0-9]/.test(password),
          special: /[^A-Za-z0-9]/.test(password),
        });
      };
    const onSubmmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                router.push('/login');
            }
            else {
                setSuccess(false);
                throw new Error(data.error || 'Failed to Rest Pssword');
            }
        } catch (error) {
            setSuccess(false);
            setError(errorHandler.handleError(error));
            console.error('Failed to reset password:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription> {error} </AlertDescription>
                    </Alert>
                  )}
                    {success && (
                      <Alert className="mb-6">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>You have successfully reset your password</AlertDescription>
                      </Alert>
                    )}    
                </CardContent>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="password">New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                name="password"
                                                className="pl-10"
                                                placeholder="••••••••"
                                                required
                                                type={showPassword ? 'text' : 'password'}
                                                disabled={isLoading}
                                                onChange={(e)=> {field.onChange(e); validatePassword(e.target.value);}}
                                            />
                                            <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2 h-5 w-5"
                                            onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                                <ul className="text-sm mt-1.5">
                      <li className="flex items-center gap-1.5">
                        {passwordChecks.length ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={passwordChecks.length ? 'text-foreground' : 'text-muted-foreground'}>
                          Minimum 8 characters
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        {passwordChecks.uppercase ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={passwordChecks.uppercase ? 'text-foreground' : 'text-muted-foreground'}>
                          Minimum 1 uppercase letter
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        {passwordChecks.lowercase ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={passwordChecks.lowercase ? 'text-foreground' : 'text-muted-foreground'}>
                          Minimum 1 lowercase letter
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        {passwordChecks.number ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={passwordChecks.number ? 'text-foreground' : 'text-muted-foreground'}>
                          Minimum 1 number
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        {passwordChecks.special ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={passwordChecks.special ? 'text-foreground' : 'text-muted-foreground'}>
                          Minimum 1 special character
                        </span>
                      </li>
                    </ul>                       
                        </FormItem>
                    )} />

                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}