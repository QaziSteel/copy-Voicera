import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import voiceraLogo from '@/assets/voicera-logo-full.png';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const step1Schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
});

const step3Schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step3FormData = z.infer<typeof step3Schema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}
export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onLoginClick
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Verification, 3: Password
  const [countdown, setCountdown] = useState(30);
  const [emailForSignup, setEmailForSignup] = useState('');
  const [fullNameForSignup, setFullNameForSignup] = useState('');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  const step3Form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const {
    signUp,
    sendMagicLink,
    checkEmailExists
  } = useAuth();
  const {
    toast
  } = useToast();

  const sendVerificationEmail = async (email: string, fullName: string) => {
    setLoading(true);
    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      
      if (emailExists) {
        step1Form.setError("email", {
          type: "manual",
          message: "The account is already registered"
        });
        setLoading(false);
        return false;
      }

      const { error } = await sendMagicLink(email, fullName);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return false;
      }
      
      setVerificationMessage(email);
      setShowVerificationDialog(true);
      setLoading(false);
      return true;
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to send verification email",
        variant: "destructive"
      });
      setLoading(false);
      return false;
    }
  };

  const onStep1Submit = async (data: Step1FormData) => {
    setEmailForSignup(data.email);
    setFullNameForSignup(data.fullName);
    const success = await sendVerificationEmail(data.email, data.fullName);
    if (success) {
      setCountdown(30);
      setStep(2);
    }
  };

  const handleResend = async () => {
    const success = await sendVerificationEmail(emailForSignup, fullNameForSignup);
    if (success) {
      setCountdown(30);
    }
  };

  // Countdown timer for step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);
  const onStep3Submit = async (data: Step3FormData) => {
    setLoading(true);
    try {
      const {
        error
      } = await signUp(emailForSignup, data.password, fullNameForSignup);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Please check your email to verify your account"
        });
        // Navigation will be handled by AuthContext after email verification
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const renderStep1 = () => (
    <Form {...step1Form}>
      <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={step1Form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={step1Form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your business email" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Verification Email"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => onLoginClick ? onLoginClick() : navigate('/auth')}
            className="font-bold text-foreground hover:underline"
          >
            Login
          </button>
        </p>
      </form>
    </Form>
  );
  const renderStep2 = () => <>
      <div className="space-y-4 text-center">
        <div className="mt-4">
          {countdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Resend in <span className="font-bold text-foreground">{countdown}s</span>
            </p>
          ) : (
            <Button 
              onClick={handleResend} 
              variant="link" 
              className="text-sm p-0 h-auto"
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend verification email"}
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
          Back
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <button 
          type="button"
          onClick={() => onLoginClick ? onLoginClick() : navigate('/auth')}
          className="font-bold text-foreground hover:underline"
        >
          Login
        </button>
      </p>
    </>;
  const renderStep3 = () => (
    <Form {...step3Form}>
      <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={step3Form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Create your password" 
                      className="pr-10"
                      {...field} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <Eye className="h-4 w-4 text-auth-subtle" /> : <EyeOff className="h-4 w-4 text-auth-subtle" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={step3Form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      className="pr-10"
                      {...field} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <Eye className="h-4 w-4 text-auth-subtle" /> : <EyeOff className="h-4 w-4 text-auth-subtle" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => onLoginClick ? onLoginClick() : navigate('/auth')}
            className="font-bold text-foreground hover:underline"
          >
            Login
          </button>
        </p>
      </form>
    </Form>
  );
  return <>
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <img 
              src={voiceraLogo} 
              alt="Voicera AI Logo" 
              className="h-18 object-contain"
            />
          </div>
        </div>

        <Card className="p-8 rounded-3xl border-2">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {step === 1 && "Create an Account"}
                {step === 2 && "Verify Your Email"}
                {step === 3 && "Create your password"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1 && "Get started with your Voicera AI dashboard in minutes"}
                {step === 2 && (
                  <>
                    A magic link will be sent to <span className="font-bold">{emailForSignup}</span>.
                    <br />
                    Click on the link to verify your identity
                  </>
                )}
                {step === 3 && "Secure your account with a strong password to keep your information safe."}
              </p>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="text-center">
            </div>
          </div>
        </Card>
      </div>
    </div>

    <Dialog open={showVerificationDialog} onOpenChange={(open) => {
      setShowVerificationDialog(open);
      if (!open && verificationMessage) {
        setStep(2);
        setCountdown(30);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verification Email Sent</DialogTitle>
          <DialogDescription className="pt-4">
            Please check your email at <span className="font-semibold text-foreground">{verificationMessage}</span> to verify your account.
          </DialogDescription>
        </DialogHeader>
        <Button 
          onClick={() => {
            setShowVerificationDialog(false);
            setStep(2);
            setCountdown(30);
          }}
          className="w-full"
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  </>;
};