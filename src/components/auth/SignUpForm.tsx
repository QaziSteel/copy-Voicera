import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface SignUpFormProps {
  onSuccess?: () => void;
}
export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Verification, 3: Password
  const [countdown, setCountdown] = useState(30);

  const { toast } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Verification code sent",
        description: `Code sent to ${formData.email}. Check your email.`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && (!formData.fullName || !formData.email)) {
      toast({
        title: "Error",
        description: "Please enter your name and email",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 2 && !formData.verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 1) {
      // Send verification code when moving to step 2
      const success = await sendVerificationCode();
      if (!success) return;
      setCountdown(30);
    }
    
    if (step === 2) {
      // Verify the OTP code
      setLoading(true);
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: formData.verificationCode,
          type: 'signup'
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message || "Invalid verification code",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Success",
          description: "Email verified successfully!"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify code",
          variant: "destructive"
        });
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    
    setStep(prev => prev + 1);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Set password for the already verified user
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully!"
        });
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
  const renderStep1 = () => <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="email">Business email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your business email" className="mt-1" />
        </div>
      </div>
      <Button onClick={handleNext} className="w-full" disabled={loading || !formData.fullName || !formData.email}>
        {loading ? "Sending..." : "Continue"}
      </Button>
    </>;
  const renderStep2 = () => <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="verificationCode">Enter Code</Label>
          <Input 
            id="verificationCode" 
            name="verificationCode" 
            type="text" 
            value={formData.verificationCode} 
            onChange={handleChange} 
            placeholder="Enter the 6 digit code" 
            className="mt-1"
            maxLength={6}
          />
          <p className="text-sm text-auth-subtle mt-2 text-center">
            Didn't receive the code? Resend in <span className="font-bold text-foreground">{countdown}s</span>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleNext} className="flex-1" disabled={loading || !formData.verificationCode}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>
      </div>
    </>;
  const renderStep3 = () => <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Create your password" className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showPassword ? <Eye className="h-4 w-4 text-auth-subtle" /> : <EyeOff className="h-4 w-4 text-auth-subtle" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative mt-1">
            <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="pr-10" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showConfirmPassword ? <Eye className="h-4 w-4 text-auth-subtle" /> : <EyeOff className="h-4 w-4 text-auth-subtle" />}
            </button>
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !formData.password || !formData.confirmPassword}>
        {loading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>;
  return <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Voicera AI</h1>
        </div>

        <Card className="p-8 rounded-3xl border-2">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {step === 1 && "Create an Account"}
                {step === 2 && "Verify your identity"}
                {step === 3 && "Create your password"}
              </h2>
              <p className="text-sm text-auth-subtle mt-1">
                {step === 1 && "Get started with your Voicera AI dashboard in minutes"}
                {step === 2 && `We've sent a 6-digit verification code to ${formData.email}. Enter it below to verify your identity`}
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
    </div>;
};