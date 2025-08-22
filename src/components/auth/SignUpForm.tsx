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
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Email, 3: Password
  const [countdown, setCountdown] = useState(30);

  const {
    signUp
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
  const handleNext = () => {
    if (step === 1 && (!formData.firstName || !formData.lastName)) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive"
      });
      return;
    }
    if (step === 2 && !formData.email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    if (step === 1) {
      setCountdown(30); // Reset countdown when moving to step 2
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
      const {
        error
      } = await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
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
          <Label htmlFor="firstName">Full name</Label>
          <Input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="Enter your full name" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="lastName">Business email</Label>
          <Input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} placeholder="Enter you business email" className="mt-1" />
        </div>
      </div>
      <Button onClick={handleNext} className="w-full" disabled={!formData.firstName || !formData.lastName}>
        Continue
      </Button>
    </>;
  const renderStep2 = () => <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Enter Code</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter the 6 digit code" className="mt-1" />
          <p className="text-sm text-auth-subtle mt-2">
            Didn't receive the code? Resend in <span className="font-bold">{countdown}s</span>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleNext} className="flex-1" disabled={!formData.email}>
          Continue
        </Button>
      </div>
    </>;
  const renderStep3 = () => <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Create a password" className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showPassword ? <EyeOff className="h-4 w-4 text-auth-subtle" /> : <Eye className="h-4 w-4 text-auth-subtle" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative mt-1">
            <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="pr-10" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showConfirmPassword ? <EyeOff className="h-4 w-4 text-auth-subtle" /> : <Eye className="h-4 w-4 text-auth-subtle" />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setStep(2)} variant="outline" className="flex-1" type="button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading || !formData.password || !formData.confirmPassword}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>
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
                {step === 3 && "Create a password"}
              </h2>
              <p className="text-sm text-auth-subtle mt-1">
                {step === 1 && "Get started with your Voicera AI dashboard in minutes"}
                {step === 2 && `We've sent a 6-digit verification code to ${formData.lastName}. Enter it below to verify your identity`}
                {step === 3 && "Create a secure password for your account"}
              </p>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="text-center">
              <p className="text-sm text-auth-subtle">
                Already have an account?{' '}
                <Link to="/auth" className="text-auth-link hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};