import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { sendPasswordResetLink } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await sendPasswordResetLink(email);
    
    if (error) {
      console.error('Error sending reset link:', error);
    }
    
    // Show dialog regardless of error (security best practice)
    setShowDialog(true);
    setLoading(false);
  };

  const handleContinue = () => {
    setShowDialog(false);
    setStep(2);
    setCountdown(30);
  };

  useEffect(() => {
    if (step === 2) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  const renderStep1 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Business Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email..."
          className="mt-1"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Verification Email"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Go back to{' '}
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="font-bold text-foreground hover:underline"
        >
          Login
        </button>
      </p>
    </form>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <p className="text-auth-subtle">
          We've sent a password reset link to
        </p>
        <p className="font-semibold text-foreground">{email}</p>
        
        <p className="text-sm text-muted-foreground">
          Please check your inbox and click the link to reset your password.
        </p>

        {countdown > 0 && (
          <div className="flex items-center justify-center mt-6">
            <div className="text-4xl font-bold text-primary">{countdown}</div>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setStep(1)}
        className="w-full h-12"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Voicera AI</h1>
        </div>

        {/* Forgot Password Card */}
        <Card className="border-2 border-border rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {step === 1 ? 'Forgot Password?' : 'Check Your Email'}
            </h2>
            {step === 1 && (
              <p className="text-auth-subtle">
                Enter your email address and we'll send you a link to reset your password
              </p>
            )}
          </div>

          {step === 1 ? renderStep1() : renderStep2()}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Sent!</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the link to reset your password.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={handleContinue}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForgotPassword;
