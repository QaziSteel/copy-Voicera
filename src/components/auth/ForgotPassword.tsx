import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
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
    
    // Show countdown regardless of error (security best practice)
    setShowCountdown(true);
    setLoading(false);
    
    // Start countdown
    let timeLeft = 30;
    const timer = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        setShowCountdown(false);
        setCountdown(30);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Voicera AI</h1>
        </div>

        {/* Forgot Password Card */}
        <div className="border border-border rounded-3xl p-8 space-y-6 bg-card">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Forgot Password?</h2>
            <p className="text-auth-subtle">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

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
        </div>
      </div>

      {/* Countdown Dialog */}
      <Dialog open={showCountdown} onOpenChange={setShowCountdown}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check Your Email</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the link to reset your password.
              </p>
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold text-primary">{countdown}</div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This popup will close automatically
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForgotPassword;
