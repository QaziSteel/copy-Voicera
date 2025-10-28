import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import voiceraIcon from '@/assets/voicera-icon.svg';
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSignUpClick?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSignUpClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        // Check if it's an invalid credentials error
        if (error.message.toLowerCase().includes("invalid") || 
            error.message.toLowerCase().includes("credentials")) {
          form.setError("password", {
            type: "manual",
            message: "Invalid email or password",
          });
        } else {
          // For other errors, show a toast
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      // Navigation is now handled by AuthContext
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img 
              src={voiceraIcon} 
              alt="Voicera AI Logo" 
              className="h-10 object-contain rounded-lg"
            />
            <span className="text-2xl font-bold text-foreground">Voicera AI</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="border border-border rounded-3xl p-8 space-y-6 bg-card">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Welcome to Voicera AI</h2>
            <p className="text-auth-subtle">Please enter your details to sign in</p>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-subtle hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Forgot Password */}
              <div className="text-right">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-auth-link hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center">
                <span className="text-auth-subtle text-sm">Don't have an account? </span>
                {onSignUpClick ? (
                  <button
                    type="button"
                    onClick={onSignUpClick}
                    className="text-sm text-auth-link hover:underline font-medium"
                  >
                    Sign up
                  </button>
                ) : (
                  <Link to="/auth/signup" className="text-sm text-auth-link hover:underline font-medium">
                    Sign up
                  </Link>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};