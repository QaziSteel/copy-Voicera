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
import BusinessIntro from "./pages/onboarding/BusinessIntro";
import BusinessName from "./pages/onboarding/BusinessName";
import { BusinessType } from "./pages/onboarding/BusinessType";
import BusinessLocation from "./pages/onboarding/BusinessLocation";
import { PersonalityIntro } from "./pages/onboarding/PersonalityIntro";
import { VoiceStyle } from "./pages/onboarding/VoiceStyle";
import { Greetings } from "./pages/onboarding/Greetings";
import AssistantName from "./pages/onboarding/AssistantName";
import OnboardingStep9 from "./pages/onboarding/OnboardingStep9";
import OnboardingStep10 from "./pages/onboarding/OnboardingStep10";
import OnboardingStep11 from "./pages/onboarding/OnboardingStep11";
import OnboardingStep12 from "./pages/onboarding/OnboardingStep12";
import OnboardingStep13 from "./pages/onboarding/OnboardingStep13";
import OnboardingStep14 from "./pages/onboarding/OnboardingStep14";
import OnboardingStep15 from "./pages/onboarding/OnboardingStep15";
import OnboardingStep16 from "./pages/onboarding/OnboardingStep16";
import OnboardingStep17 from "./pages/onboarding/OnboardingStep17";
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
            <Route path="/onboarding/business-intro" element={
              <ProtectedRoute>
                <BusinessIntro />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-name" element={
              <ProtectedRoute>
                <BusinessName />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-type" element={
              <ProtectedRoute>
                <BusinessType />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-location" element={
              <ProtectedRoute>
                <BusinessLocation />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/personality-intro" element={
              <ProtectedRoute>
                <PersonalityIntro />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/voice-style" element={
              <ProtectedRoute>
                <VoiceStyle />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/greetings" element={
              <ProtectedRoute>
                <Greetings />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/assistant-name" element={
              <ProtectedRoute>
                <AssistantName />
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
            <Route path="/onboarding/step14" element={
              <ProtectedRoute>
                <OnboardingStep14 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step15" element={
              <ProtectedRoute>
                <OnboardingStep15 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/step16" element={
              <ProtectedRoute>
                <OnboardingStep16 />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/faqs" element={
              <ProtectedRoute>
                <OnboardingStep17 />
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
