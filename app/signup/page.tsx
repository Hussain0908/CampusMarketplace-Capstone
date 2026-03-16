'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle2, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from "lucide-react";
import { SignUpErrorHandler } from '@/lib/error-handler';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import Image from 'next/image';


const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .refine((email) => email.endsWith('.edu'), {
    message: 'Please use your college email address',
  });

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'), 
})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const router = useRouter();
  const errorHandler = new SignUpErrorHandler();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const validateEmail = (email: string) => {
    setEmailValid(email.endsWith('.edu'));
  }; 

  const validatePassword = (password: string) => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  };
 
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }
      setSuccess(true);
      router.push('/confirm');
      form.reset();
    } 
    catch (error) {
      setSuccess(false);
      setError(errorHandler.handleError(error));
    } 
    finally {
      setIsLoading(false);
    }
  }

  return (
    <>
    
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      <div className="mb-4">
        <Image
          src="/campus-marketplacelogo.png"
          alt="Logo"
          width={150}
          height={150}



        />
      </div>
      <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription> {error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Thank you!</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardContent>
          <Form {...form}>
            <form name="signup" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="test-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            disabled={isLoading}
                            maxLength={50}
                            placeholder="John"
                            type="text"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="test-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            className="pl-10" 
                            disabled={isLoading} 
                            maxLength={50} 
                            placeholder="Doe"
                            type="text"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="test-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="john.doe@university.edu"
                          type="email"
                          className="pl-10"
                          autoComplete="email"
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => { field.onChange(e); validateEmail(e.target.value); }}
                        />
                      </div>
                    </FormControl>
                    <ul className="text-sm mt-1.5">
                      <li className="flex items-center gap-1.5">
                        {emailValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={emailValid ? 'text-foreground' : 'text-muted-foreground'}>
                          Please use your .edu email address
                        </span>
                      </li>
                    </ul>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password <span className="test-red-600 !important">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          autoComplete="new-password"
                          className="pl-10"
                          disabled={isLoading}
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          {...field}
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
                )}
              />

             

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password <span className="test-red-600 !important">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          autoComplete="new-password"
                          className="pl-10"
                          disabled={isLoading}
                          placeholder="••••••••"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-5 w-5"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <p className="text-sm text-balck-600">Disclosures:</p>
              <p className="text-sm text-red-600">Campus Marketplace may disclose only the user name, state, 
                and the university you study at and provide consumers with electronic messaging where consumers can contact you. 
                We are not responsible for any loss during the purchase and delivery of a product. We do not handle the transaction 
                phase of purchases.</p>


              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ?(<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
              <div className="text-center text-sm text-red-600">
                * = required
              </div>
              
            </form>
          </Form>
          <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-sm text-gray-600 hover:underline">
                  Log in
                </Link>
              </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}