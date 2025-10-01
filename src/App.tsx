import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AgentStatusProvider } from "@/contexts/AgentStatusContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DailySummary from "./pages/DailySummary";
import CallLogs from "./pages/CallLogs";
import AgentManagement from "./pages/AgentManagement";
import AgentOverview from "./pages/AgentOverview";
import TestAgent from "./pages/TestAgent";
import Profile from "./pages/Profile";
import { Invite } from "./pages/Invite";
import { SignUpForm } from "@/components/auth/SignUpForm";
import MagicLinkHandler from "@/components/auth/MagicLinkHandler";
import BusinessIntro from "./pages/onboarding/BusinessIntro";
import BusinessName from "./pages/onboarding/BusinessName";
import { BusinessType } from "./pages/onboarding/BusinessType";
import { BusinessServices } from "./pages/onboarding/BusinessServices";
import BusinessLocation from "./pages/onboarding/BusinessLocation";
import ContactNumber from "./pages/onboarding/ContactNumber";
import CalendarIntegration from "./pages/onboarding/CalendarIntegration";
import { PersonalityIntro } from "./pages/onboarding/PersonalityIntro";
import { VoiceStyle } from "./pages/onboarding/VoiceStyle";
import { Greetings } from "./pages/onboarding/Greetings";
import AssistantName from "./pages/onboarding/AssistantName";
import AnswerTime from "./pages/onboarding/AnswerTime";
import BookingIntro from "./pages/onboarding/BookingIntro";

import BusinessDays from "./pages/onboarding/BusinessDays";
import BusinessHours from "./pages/onboarding/BusinessHours";

import Schedule from "./pages/onboarding/Schedule";
import FAQIntro from "./pages/onboarding/FAQIntro";
import FAQQuestions from "./pages/onboarding/FAQQuestions";
import Integrations from "./pages/onboarding/Integrations";
import QuestionHandling from "./pages/onboarding/QuestionHandling";
import Summaries from "./pages/onboarding/Summaries";
import Confirmations from "./pages/onboarding/Confirmations";
import Reminders from "./pages/onboarding/Reminders";
import Completion from "./pages/onboarding/Completion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectProvider>
        <AgentStatusProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/signup" element={<SignUpForm />} />
            <Route path="/auth/complete-signup" element={<MagicLinkHandler />} />
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
            <Route path="/onboarding/business-services" element={
              <ProtectedRoute>
                <BusinessServices />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-location" element={
              <ProtectedRoute>
                <BusinessLocation />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/contact-number" element={
              <ProtectedRoute>
                <ContactNumber />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/calendar-integration" element={
              <ProtectedRoute>
                <CalendarIntegration />
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
            <Route path="/onboarding/answer-time" element={
              <ProtectedRoute>
                <AnswerTime />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/booking-intro" element={
              <ProtectedRoute>
                <BookingIntro />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-days" element={
              <ProtectedRoute>
                <BusinessDays />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/business-hours" element={
              <ProtectedRoute>
                <BusinessHours />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/schedule" element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/faq-intro" element={
              <ProtectedRoute>
                <FAQIntro />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/faq-questions" element={
              <ProtectedRoute>
                <FAQQuestions />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/integrations" element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/question-handling" element={
              <ProtectedRoute>
                <QuestionHandling />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/summaries" element={
              <ProtectedRoute>
                <Summaries />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/confirmations" element={
              <ProtectedRoute>
                <Confirmations />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/reminders" element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/completion" element={
              <ProtectedRoute>
                <Completion />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/daily-summary" element={
              <ProtectedRoute>
                <DailySummary />
              </ProtectedRoute>
            } />
            <Route path="/call-logs" element={
              <ProtectedRoute>
                <CallLogs />
              </ProtectedRoute>
            } />
            <Route path="/agents" element={
              <ProtectedRoute>
                <AgentOverview />
              </ProtectedRoute>
            } />
            <Route path="/agent-management" element={
              <ProtectedRoute>
                <AgentManagement />
              </ProtectedRoute>
            } />
            <Route path="/test-agent" element={
              <ProtectedRoute>
                <TestAgent />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/invite" element={<Invite />} />
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AgentStatusProvider>
      </ProjectProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
