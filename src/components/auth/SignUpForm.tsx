import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
  const [sentVerificationCode, setSentVerificationCode] = useState('');

  const {
    signUp,
    sendMagicLink
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { error } = await sendMagicLink(formData.email, formData.fullName);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return false;
      }
      
      toast({
        title: "Verification email sent",
        description: `We've sent a verification link to ${formData.email}`
      });
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

  const handleNext = async () => {
    if (step === 1 && (!formData.fullName || !formData.email)) {
      toast({
        title: "Error",
        description: "Please enter your name and email",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 1) {
      // Send verification email when moving to step 2
      const success = await sendVerificationEmail();
      if (success) {
        setCountdown(30);
        setStep(2);
      }
    } else if (step === 2) {
      // Move to password creation step
      setStep(3);
    }
  };

  const handleResend = async () => {
    const success = await sendVerificationEmail();
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
      const {
        error
      } = await signUp(formData.email, formData.password, formData.fullName);
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
        {loading ? "Sending..." : "Send Verification Email"}
      </Button>
    </>;
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
                {step === 2 && "Verify Your Email"}
                {step === 3 && "Create your password"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1 && "Get started with your Voicera AI dashboard in minutes"}
                {step === 2 && `A magic link will be sent to ${formData.email}. Click on the link to verify your identity`}
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