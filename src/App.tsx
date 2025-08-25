import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { SignUpForm } from "@/components/auth/SignUpForm";
import OnboardingStep1 from "./pages/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "./pages/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "./pages/onboarding/OnboardingStep3";
import OnboardingStep4 from "./pages/onboarding/OnboardingStep4";
import { OnboardingStep5 } from "./pages/onboarding/OnboardingStep5";
import { OnboardingStep6 } from "./pages/onboarding/OnboardingStep6";
import { OnboardingStep7 } from "./pages/onboarding/OnboardingStep7";
import OnboardingStep8 from "./pages/onboarding/OnboardingStep8";
import OnboardingStep9 from "./pages/onboarding/OnboardingStep9";
import OnboardingStep10 from "./pages/onboarding/OnboardingStep10";
import OnboardingStep11 from "./pages/onboarding/OnboardingStep11";
import OnboardingStep12 from "./pages/onboarding/OnboardingStep12";
import OnboardingStep13 from "./pages/onboarding/OnboardingStep13";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/signup" element={<SignUpForm />} />
            <Route path="/onboarding/step1" element={
              <ProtectedRoute>
                <OnboardingStep1 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step2" element={
              <ProtectedRoute>
                <OnboardingStep2 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step3" element={
              <ProtectedRoute>
                <OnboardingStep3 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step4" element={
              <ProtectedRoute>
                <OnboardingStep4 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step5" element={
              <ProtectedRoute>
                <OnboardingStep5 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step6" element={
              <ProtectedRoute>
                <OnboardingStep6 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step7" element={
              <ProtectedRoute>
                <OnboardingStep7 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step8" element={
              <ProtectedRoute>
                <OnboardingStep8 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step9" element={
              <ProtectedRoute>
                <OnboardingStep9 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step10" element={
              <ProtectedRoute>
                <OnboardingStep10 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step11" element={
              <ProtectedRoute>
                <OnboardingStep11 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step12" element={
              <ProtectedRoute>
                <OnboardingStep12 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step13" element={
              <ProtectedRoute>
                <OnboardingStep13 />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
