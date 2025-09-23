import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { useAgentStatus } from "@/contexts/AgentStatusContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, ArrowLeft, RotateCcw } from "lucide-react";
import { AgentToggle } from "@/components/ui/agent-toggle";
import { useToast } from "@/hooks/use-toast";
import { useGoogleIntegration } from "@/hooks/useGoogleIntegration";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingData } from "@/lib/onboarding";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { Header } from "@/components/shared/Header";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// Type guards for handling Supabase Json data
const isStringArray = (value: any): value is string[] => 
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isBusinessHours = (value: any): value is { from: string; to: string } =>
  typeof value === 'object' && value !== null && 
  typeof value.from === 'string' && typeof value.to === 'string';

// Convert onboarding FAQ format to Agent Management format
const convertOnboardingFAQs = (faqData: any): { enabled: boolean; questions: FAQ[] } => {
  if (!faqData || typeof faqData !== 'object') {
    return { enabled: false, questions: [] };
  }

  // Handle Agent Management format (already converted)
  if (Array.isArray(faqData.questions) && faqData.questions.every((q: any) => q.id && q.question && q.answer)) {
    return { enabled: faqData.enabled || false, questions: faqData.questions };
  }

  // Handle onboarding format (separate questions and answers arrays)
  if (Array.isArray(faqData.questions) && Array.isArray(faqData.answers)) {
    const convertedQuestions: FAQ[] = faqData.questions.map((question: string, index: number) => ({
      id: `faq-${index + 1}`,
      question: question,
      answer: faqData.answers[index] || ''
    }));
    return { enabled: faqData.enabled || false, questions: convertedQuestions };
  }

  return { enabled: false, questions: [] };
};

const isFAQData = (value: any): value is { enabled: boolean; questions: FAQ[] } =>
  typeof value === 'object' && value !== null &&
  typeof value.enabled === 'boolean' && 
  Array.isArray(value.questions);

const AgentManagement = () => {
  // Force rebuild - removed isTestMode references
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { toast } = useToast();
  const { isAgentLive, isTogglingStatus, contactNumber, assistantId, externalId, handleStatusToggle, loadAgentStatus } = useAgentStatus();
  const { notifications, showNotifications, openNotifications, closeNotifications, notificationCount } = useNotifications();
  
  // State for all tabs
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic-info');
  
  // Multi-agent state
  const [userAgents, setUserAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Google Integration - use selected agent ID
  const { integration: googleIntegration, loading: googleLoading, initiateOAuth, disconnectIntegration } = useGoogleIntegration(selectedAgentId);
  
  // Basic Info
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  
  // AI Personality  
  const [aiAssistantName, setAiAssistantName] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('');
  const [greetingStyle, setGreetingStyle] = useState<any>({});
  const [handlingUnknown, setHandlingUnknown] = useState('');
  const [answerTime, setAnswerTime] = useState('');
  
  // Booking
  const [services, setServices] = useState<string[]>([]);
  const [appointmentDuration, setAppointmentDuration] = useState('');
  const [businessDays, setBusinessDays] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState({ from: '8:00am', to: '05:00pm' });
  const [scheduleFullAction, setScheduleFullAction] = useState('');
  
  // FAQs
  const [faqEnabled, setFaqEnabled] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  // Advanced
  const [dailySummary, setDailySummary] = useState(false);
  const [emailConfirmations, setEmailConfirmations] = useState(false);
  const [autoReminders, setAutoReminders] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadUserAgents();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(location.search);
    const oauthStatus = urlParams.get('oauth');
    const userEmail = urlParams.get('email');
    const error = urlParams.get('error');
    const isFromPopup = urlParams.get('popup') === 'true';
    
    if (oauthStatus) {
      // Clean URL by removing OAuth parameters
      const cleanParams = new URLSearchParams(location.search);
      cleanParams.delete('oauth');
      cleanParams.delete('email');
      cleanParams.delete('error');
      cleanParams.delete('popup');
      const cleanUrl = cleanParams.toString() ? `?${cleanParams.toString()}` : location.pathname;
      window.history.replaceState(null, '', cleanUrl);
      
      if (oauthStatus === 'success' && userEmail) {
        toast({
          title: "Success",
          description: `Google Calendar connected successfully for ${userEmail}`,
        });
        
        // If from popup, notify opener and close
        if (isFromPopup) {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              email: userEmail
            }, window.location.origin);
          }
          
          // Close the popup window
          setTimeout(() => {
            window.close();
          }, 1500); // Give time for the success message to be seen
        }
      } else if (oauthStatus === 'error') {
        toast({
          title: "Error",
          description: `Failed to connect Google Calendar: ${error || 'Unknown error'}`,
          variant: "destructive",
        });
        
        // If from popup, notify opener and close
        if (isFromPopup) {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: error || 'Unknown error'
            }, window.location.origin);
          }
          
          // Close the popup window
          setTimeout(() => {
            window.close();
          }, 2500); // Give more time for error message to be read
        }
      }
    }
  }, [location.search]);

  // Extract agentId from URL
  const urlParams = new URLSearchParams(location.search);
  const urlAgentId = urlParams.get('agentId');

  const loadUserAgents = useCallback(async () => {
    try {
      setLoading(true);
      setAgentsLoading(true);
      
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('id, business_name, ai_assistant_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user agents:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserAgents(data);
        
        // Check for URL agentId first, then fall back to most recent
        const urlParams = new URLSearchParams(location.search);
        const urlAgentId = urlParams.get('agentId');
        
        let targetAgent;
        if (urlAgentId && data.find(agent => agent.id === urlAgentId)) {
          targetAgent = data.find(agent => agent.id === urlAgentId);
        } else {
          targetAgent = data[0]; // Most recent agent as fallback
        }
        
        setSelectedAgentId(targetAgent.id);
        await loadAgentSettings(targetAgent.id);
      } else {
        // No agents found, set empty state
        setUserAgents([]);
        setSelectedAgentId(null);
      }
    } catch (error) {
      console.error('Error loading user agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setAgentsLoading(false);
      setLoading(false);
    }
  }, [toast, location]);

  const loadAgentSettings = useCallback(async (agentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading agent settings:', error);
        return;
      }

      if (data) {
        // Basic Info
        setBusinessName(data.business_name || '');
        // Extract type names with duration from business type objects
        const formatBusinessType = (bt: any) => {
          if (typeof bt === 'string') return bt;
          const type = bt.type || '';
          const hours = parseInt(bt.hours || '0');
          const minutes = parseInt(bt.minutes || '0');
          const duration = `${hours} hr ${minutes} min`;
          return `${type} (${duration})`;
        };
        const formattedTypes = Array.isArray(data.business_types) ? 
          data.business_types.map(formatBusinessType).filter(Boolean) : [];
        setBusinessType(formattedTypes.join(', '));
        setBusinessLocation(data.primary_location || '');
        
        // AI Personality
        setAiAssistantName(data.ai_assistant_name || '');
        setVoiceStyle(data.ai_voice_style || '');
        setGreetingStyle(data.ai_greeting_style || {});
        setHandlingUnknown(data.ai_handling_unknown || '');
        setAnswerTime(data.ai_call_schedule || '');
        
        // Booking
        setServices(isStringArray(data.services) ? data.services : []);
        setBusinessDays(isStringArray(data.business_days) ? data.business_days : []);
        setBusinessHours(isBusinessHours(data.business_hours) ? data.business_hours : { from: '', to: '' });
        setScheduleFullAction(data.schedule_full_action || '');
        
        // FAQs - Convert from onboarding format to Agent Management format
        const faqData = convertOnboardingFAQs(data.faq_data);
        setFaqEnabled(faqData.enabled);
        setFaqs(faqData.questions);
        
        // Advanced
        setDailySummary(data.wants_daily_summary || false);
        setEmailConfirmations(data.wants_email_confirmations || false);
        
        // Load agent status data into context
        await loadAgentStatus(agentId);
        
        // Handle reminder settings (jsonb format)
        if (data.reminder_settings && typeof data.reminder_settings === 'object' && !Array.isArray(data.reminder_settings)) {
          const reminderData = data.reminder_settings as { wantsReminders?: boolean };
          setAutoReminders(reminderData.wantsReminders || false);
        } else {
          setAutoReminders(false);
        }
      }
    } catch (error) {
      console.error('Error loading agent settings:', error);
      toast({
        title: "Error",
        description: "Failed to load agent settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveChanges = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const agentData = {
        user_id: user.id,
        business_name: businessName,
        business_type: businessType,
        primary_location: businessLocation,
        contact_number: contactNumber,
        ai_assistant_name: aiAssistantName,
        ai_voice_style: voiceStyle,
        ai_greeting_style: greetingStyle,
        ai_handling_unknown: handlingUnknown,
        ai_call_schedule: answerTime,
        services: services as any,
        appointment_duration: appointmentDuration,
        business_days: businessDays as any,
        business_hours: businessHours as any,
        schedule_full_action: scheduleFullAction,
        faq_data: { enabled: faqEnabled, questions: faqs } as any,
        wants_daily_summary: dailySummary,
        wants_email_confirmations: emailConfirmations,
        reminder_settings: { wantsReminders: autoReminders } as any,
      };

      if (selectedAgentId) {
        // Update existing agent
        const { error } = await supabase
          .from('onboarding_responses')
          .update(agentData)
          .eq('id', selectedAgentId);

        if (error) throw error;
      } else {
        // Create new agent
        const { data, error } = await supabase
          .from('onboarding_responses')
          .insert(agentData)
          .select()
          .single();

        if (error) throw error;
        
        // Update state with new agent
        if (data) {
          setSelectedAgentId(data.id);
          await loadUserAgents(); // Refresh the agents list
        }
      }

      toast({
        title: "Success",
        description: "Agent settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving agent settings:', error);
      toast({
        title: "Error", 
        description: "Failed to save agent settings",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, businessName, businessType, businessLocation, contactNumber, aiAssistantName, voiceStyle, greetingStyle, handlingUnknown, answerTime, services, appointmentDuration, businessDays, businessHours, scheduleFullAction, faqEnabled, faqs, dailySummary, emailConfirmations, autoReminders, toast, loadUserAgents]);

  const handleAgentSelection = useCallback(async (agentId: string) => {
    setSelectedAgentId(agentId);
    await loadAgentSettings(agentId);
    
    // Update URL with selected agentId
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('agentId', agentId);
    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  }, [loadAgentSettings, navigate, location]);

  const addFaq = useCallback(() => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please enter both question and answer",
        variant: "destructive"
      });
      return;
    }
    
    const newFaq: FAQ = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };
    setFaqs(prev => [...prev, newFaq]);
    setNewQuestion('');
    setNewAnswer('');
  }, [newQuestion, newAnswer, toast]);

  const updateFaq = useCallback((id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  }, []);

  const removeFaq = useCallback((id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id));
  }, []);

  // Discard functions for each section
  const discardBasicInfo = useCallback(async () => {
    if (!selectedAgentId) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('business_name, business_types, primary_location')
        .eq('id', selectedAgentId)
        .single();

      if (error) throw error;
      
      if (data) {
        setBusinessName(data.business_name || '');
        // Extract type names with duration from business type objects for discard
        const formatBusinessType = (bt: any) => {
          if (typeof bt === 'string') return bt;
          const type = bt.type || '';
          const hours = parseInt(bt.hours || '0');
          const minutes = parseInt(bt.minutes || '0');
          const duration = `${hours} hr ${minutes} min`;
          return `${type} (${duration})`;
        };
        const formattedTypes = Array.isArray(data.business_types) ? 
          data.business_types.map(formatBusinessType).filter(Boolean) : [];
        setBusinessType(formattedTypes.join(', '));
        setBusinessLocation(data.primary_location || '');
        
        toast({
          title: "Changes Discarded",
          description: "Business information has been reset to saved values",
        });
      }
    } catch (error) {
      console.error('Error discarding basic info:', error);
      toast({
        title: "Error",
        description: "Failed to discard changes",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, toast]);

  const discardPersonality = useCallback(async () => {
    if (!selectedAgentId) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('ai_assistant_name, ai_voice_style, ai_greeting_style, ai_handling_unknown, ai_call_schedule')
        .eq('id', selectedAgentId)
        .single();

      if (error) throw error;
      
      if (data) {
        setAiAssistantName(data.ai_assistant_name || '');
        setVoiceStyle(data.ai_voice_style || '');
        setGreetingStyle(data.ai_greeting_style || {});
        setHandlingUnknown(data.ai_handling_unknown || '');
        setAnswerTime(data.ai_call_schedule || '');
        
        toast({
          title: "Changes Discarded",
          description: "AI personality settings have been reset to saved values",
        });
      }
    } catch (error) {
      console.error('Error discarding personality:', error);
      toast({
        title: "Error",
        description: "Failed to discard changes",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, toast]);

  const discardBooking = useCallback(async () => {
    if (!selectedAgentId) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('services, business_days, business_hours, schedule_full_action')
        .eq('id', selectedAgentId)
        .single();

      if (error) throw error;
      
      if (data) {
        setServices(isStringArray(data.services) ? data.services : []);
        setBusinessDays(isStringArray(data.business_days) ? data.business_days : []);
        setBusinessHours(isBusinessHours(data.business_hours) ? data.business_hours : { from: '', to: '' });
        setScheduleFullAction(data.schedule_full_action || '');
        
        toast({
          title: "Changes Discarded",
          description: "Booking settings have been reset to saved values",
        });
      }
    } catch (error) {
      console.error('Error discarding booking:', error);
      toast({
        title: "Error",
        description: "Failed to discard changes",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, toast]);

  const discardFaqs = useCallback(async () => {
    if (!selectedAgentId) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('faq_data')
        .eq('id', selectedAgentId)
        .single();

      if (error) throw error;
      
      if (data) {
        const faqData = convertOnboardingFAQs(data.faq_data);
        setFaqEnabled(faqData.enabled);
        setFaqs(faqData.questions);
        setNewQuestion('');
        setNewAnswer('');
        
        toast({
          title: "Changes Discarded",
          description: "FAQ settings have been reset to saved values",
        });
      }
    } catch (error) {
      console.error('Error discarding FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to discard changes",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, toast]);

  const discardAdvanced = useCallback(async () => {
    if (!selectedAgentId) return;
    
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('ai_handling_unknown, wants_daily_summary, wants_email_confirmations, reminder_settings')
        .eq('id', selectedAgentId)
        .single();

      if (error) throw error;
      
      if (data) {
        setHandlingUnknown(data.ai_handling_unknown || '');
        setDailySummary(data.wants_daily_summary || false);
        setEmailConfirmations(data.wants_email_confirmations || false);
        
        if (data.reminder_settings && typeof data.reminder_settings === 'object' && !Array.isArray(data.reminder_settings)) {
          const reminderData = data.reminder_settings as { wantsReminders?: boolean };
          setAutoReminders(reminderData.wantsReminders || false);
        } else {
          setAutoReminders(false);
        }
        
        toast({
          title: "Changes Discarded",
          description: "Advanced settings have been reset to saved values",
        });
      }
    } catch (error) {
      console.error('Error discarding advanced:', error);
      toast({
        title: "Error",
        description: "Failed to discard changes",
        variant: "destructive",
      });
    }
  }, [selectedAgentId, toast]);


  const renderBasicInfo = () => (
    <div className="space-y-3 md:space-y-5">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
              <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
              <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
            </svg>
            <h2 className="text-lg md:text-xl font-semibold text-black">Business Information</h2>
          </div>
          <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-500">Basic information about your business that the AI agent will use.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={discardBasicInfo}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium text-black">Discard</span>
          </button>
          <button 
            onClick={saveChanges}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black text-white rounded-xl"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <g clipPath="url(#clip0_60_7)">
                <path d="M16.875 6.50859V16.25C16.875 16.4158 16.8092 16.5747 16.6919 16.6919C16.5747 16.8092 16.4158 16.875 16.25 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V3.75C3.125 3.58424 3.19085 3.42527 3.30806 3.30806C3.42527 3.19085 3.58424 3.125 3.75 3.125H13.4914C13.6569 3.12508 13.8157 3.19082 13.9328 3.30781L16.6922 6.06719C16.8092 6.18431 16.8749 6.34305 16.875 6.50859Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.25 16.875V11.875C6.25 11.7092 6.31585 11.5503 6.43306 11.4331C6.55027 11.3158 6.70924 11.25 6.875 11.25H13.125C13.2908 11.25 13.4497 11.3158 13.5669 11.4331C13.6842 11.5503 13.75 11.7092 13.75 11.875V16.875" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.875 5.625H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_60_7">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <span className="text-base font-medium">Save Changes</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-5">
        <div className="space-y-3 md:space-y-5">
          {/* First Row */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-5">
            <div className="flex-1">
              <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 lg:py-4 border-2 border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">Business Type</label>
              <div className="relative">
                <select 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 lg:py-4 border-2 border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-500 appearance-none bg-white"
                >
                  <option value="">Select business type</option>
                  <option value="Hairdressers">Hairdressers</option>
                  <option value="Nail Salon">Nail Salon</option>
                  <option value="Health Clinic">Health Clinic</option>
                  <option value="Fitness Studio">Fitness Studio</option>
                  <option value="Coaching/Consulting">Coaching/Consulting</option>
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="Chiropractor">Chiropractor</option>
                  {businessType && !["Hairdressers", "Nail Salon", "Health Clinic", "Fitness Studio", "Coaching/Consulting", "Physiotherapy", "Chiropractor"].includes(businessType.split(' (')[0]) && (
                    <option value={businessType}>{businessType}</option>
                  )}
                </select>
                <svg className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-5">
            <div className="flex-1">
              <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">Primary Location</label>
              <input 
                type="text" 
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 lg:py-4 border-2 border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">Contact Number</label>
              <input 
                type="text" 
                value={contactNumber}
                readOnly
                className="w-full px-3 md:px-4 py-2 md:py-3 lg:py-4 border-2 border-gray-100 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-600 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const LoadingSkeleton = useMemo(() => (
    <div className="min-h-screen bg-[#F9FAFB] animate-fade-in">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 md:px-8 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-8">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        
        {/* Agent Toggle Skeleton */}
        <div className="px-4 md:px-8 lg:px-16 py-4 border-t border-gray-100">
          <Skeleton className="h-12 w-80 mx-auto" />
        </div>

        {/* Navigation Skeleton */}
        <div className="px-4 md:px-8 lg:px-16">
          <div className="flex items-center justify-center mt-4">
            <div className="bg-gray-100 rounded-full p-2 flex items-center gap-3">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="px-3 md:px-6 lg:px-12 py-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </main>
    </div>
  ), []);

  if (loading) {
    return LoadingSkeleton;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        .pulse-bar {
          animation: pulse 1s ease-in-out infinite;
        }
        .pulse-bar:nth-child(2) { animation-delay: 0.1s; }
        .pulse-bar:nth-child(3) { animation-delay: 0.2s; }
        .pulse-bar:nth-child(4) { animation-delay: 0.3s; }
        .pulse-bar:nth-child(5) { animation-delay: 0.4s; }
      `}</style>

      <Header currentPage="agent-management" />

      {/* Main Content */}
      <main className="px-2 md:px-4 lg:px-8 xl:px-12 py-4 md:py-6">
        {/* Page Header */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-3 mb-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/agents')}
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-black" />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold text-black">
              {userAgents.find(agent => agent.id === selectedAgentId)?.ai_assistant_name || 
               userAgents.find(agent => agent.id === selectedAgentId)?.business_name || 
               'Agent Management'}
            </h1>
          </div>
          <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-500">Configure your AI agent settings and behavior</p>
        </div>

        {/* Agent Status Section */}
        <div className="mb-3 md:mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
            <div className="flex items-center gap-2 mb-2 lg:mb-0">
              <span className="text-lg md:text-xl font-semibold text-gray-500">Agent status:</span>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ring-2 ${isAgentLive ? 'ring-green-500 bg-green-50' : 'ring-red-500 bg-red-50'}`}>
                <div className={`w-2 h-2 ${isAgentLive ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                <span className={`text-lg md:text-xl font-semibold ${isAgentLive ? 'text-green-600' : 'text-red-600'}`}>
                  {isAgentLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <button 
                onClick={handleStatusToggle}
                disabled={isTogglingStatus || !contactNumber || !assistantId || !externalId}
                className={`px-4 py-2 ${isAgentLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-sm md:text-base lg:text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isTogglingStatus ? 'Updating...' : (isAgentLive ? 'Go Offline' : 'Go Live')}
              </button>
              
              {/* Agent selector removed - using back button for navigation */}
              
              <AgentToggle />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4 md:mt-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4 md:mb-6 bg-gray-100 rounded-full p-1">
              <TabsTrigger value="basic-info" className="rounded-full text-xs md:text-sm">Basic Info</TabsTrigger>
              <TabsTrigger value="personality" className="rounded-full text-xs md:text-sm">AI Personality</TabsTrigger>
              <TabsTrigger value="booking" className="rounded-full text-xs md:text-sm">Booking</TabsTrigger>
              <TabsTrigger value="faqs" className="rounded-full text-xs md:text-sm">FAQs</TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-full text-xs md:text-sm">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="space-y-4">
              {renderBasicInfo()}
            </TabsContent>

            <TabsContent value="personality" className="space-y-4">
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
                        <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
                      </svg>
                      <h2 className="text-lg font-semibold text-black">AI Personality</h2>
                    </div>
                    <p className="text-base font-semibold text-gray-500">Customize how your AI assistant communicates and engages with customers.</p>
                  </div>
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={discardPersonality}
                       className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
                     >
                       <RotateCcw className="w-4 h-4" />
                       <span className="text-sm font-medium text-black">Discard</span>
                     </button>
                    <button 
                      onClick={saveChanges}
                      className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-xl"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_60_7)">
                          <path d="M16.875 6.50859V16.25C16.875 16.4158 16.8092 16.5747 16.6919 16.6919C16.5747 16.8092 16.4158 16.875 16.25 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V3.75C3.125 3.58424 3.19085 3.42527 3.30806 3.30806C3.42527 3.19085 3.58424 3.125 3.75 3.125H13.4914C13.6569 3.12508 13.8157 3.19082 13.9328 3.30781L16.6922 6.06719C16.8092 6.18431 16.8749 6.34305 16.875 6.50859Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.25 16.875V11.875C6.25 11.7092 6.31585 11.5503 6.43306 11.4331C6.55027 11.3158 6.70924 11.25 6.875 11.25H13.125C13.2908 11.25 13.4497 11.3158 13.5669 11.4331C13.6842 11.5503 13.75 11.7092 13.75 11.875V16.875" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.875 5.625H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_60_7">
                            <rect width="20" height="20" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-sm font-medium">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="space-y-4">
                    {/* First Row - AI Voice Style & Assistant Name */}
                    <div className="flex gap-5">
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          AI voice style
                        </label>
                        <div className="relative">
                          <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white">
                            <option>Friendly Female</option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          AI assistant name
                        </label>
                        <div className="relative">
                          <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white">
                            <option>Your [Business Name] Assistant</option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Second Row - Answering Hours & Greeting Style */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-lg font-semibold text-black mb-3">
                          Answering Hours
                        </label>
                        <div className="relative">
                          <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white">
                            <option>During business hours</option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-black mb-3">
                          AI greeting style
                        </label>
                        <div className="relative">
                          <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white">
                            <option>
                              Warm & Reassuring: "Hello, you're through to [Business Name]. I'm here to help, how can I assist?"
                            </option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-6">
              <div className="space-y-5">
                {/* Section Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
                        <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
                      </svg>
                      <h2 className="text-xl font-semibold text-black">Booking</h2>
                    </div>
                    <p className="text-lg font-semibold text-gray-500">Control how your calls and appointments are scheduled and managed.</p>
                  </div>
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={discardBooking}
                       className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
                     >
                       <RotateCcw className="w-5 h-5" />
                       <span className="text-base font-medium text-black">Discard</span>
                     </button>
                    <button 
                      onClick={saveChanges}
                      className="flex items-center gap-3 px-4 py-2 bg-black text-white rounded-xl"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_60_7)">
                          <path d="M16.875 6.50859V16.25C16.875 16.4158 16.8092 16.5747 16.6919 16.6919C16.5747 16.8092 16.4158 16.875 16.25 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V3.75C3.125 3.58424 3.19085 3.42527 3.30806 3.30806C3.42527 3.19085 3.58424 3.125 3.75 3.125H13.4914C13.6569 3.12508 13.8157 3.19082 13.9328 3.30781L16.6922 6.06719C16.8092 6.18431 16.8749 6.34305 16.875 6.50859Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.25 16.875V11.875C6.25 11.7092 6.31585 11.5503 6.43306 11.4331C6.55027 11.3158 6.70924 11.25 6.875 11.25H13.125C13.2908 11.25 13.4497 11.3158 13.5669 11.4331C13.6842 11.5503 13.75 11.7092 13.75 11.875V16.875" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.875 5.625H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_60_7">
                            <rect width="20" height="20" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-base font-medium">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="space-y-5">
                    {/* First Row - Services & Duration */}
                    <div className="flex gap-5">
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          What can customers book?
                        </label>
                        <div className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl bg-gray-50">
                          {services.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {services.map((service, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-lg text-gray-500">No services configured</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          How long is each appointment?
                        </label>
                        <div className="relative">
                          <select 
                            value={appointmentDuration}
                            onChange={(e) => setAppointmentDuration(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white"
                          >
                            <option value="">
                              Select the duration you want each appointment to last
                            </option>
                            <option value="30 minutes">30 minutes</option>
                            <option value="45 minutes">45 minutes</option>
                            <option value="1 hour">1 hour</option>
                            <option value="1.5 hours">1.5 hours</option>
                            <option value="2 hours">2 hours</option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Second Row - Business Days & Hours */}
                    <div className="flex gap-5">
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-6">
                          Select your business days
                        </label>
                        <div className="flex gap-3">
                          {["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map(
                            (day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  if (businessDays.includes(day)) {
                                    setBusinessDays(businessDays.filter(d => d !== day));
                                  } else {
                                    setBusinessDays([...businessDays, day]);
                                  }
                                }}
                                className={`px-4 py-3 border-2 rounded-xl text-lg transition-colors ${
                                  businessDays.includes(day)
                                    ? 'border-black bg-black text-white'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                              >
                                {day}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          Enter your business hours
                        </label>
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="From"
                              value={businessHours.from}
                              onChange={(e) => setBusinessHours({...businessHours, from: e.target.value})}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 placeholder-gray-500"
                            />
                            <svg
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                                stroke="#6B7280"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 6.75V12H17.25"
                                stroke="#6B7280"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="To"
                              value={businessHours.to}
                              onChange={(e) => setBusinessHours({...businessHours, to: e.target.value})}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 placeholder-gray-500"
                            />
                            <svg
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                                stroke="#6B7280"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 6.75V12H17.25"
                                stroke="#6B7280"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Third Row - Schedule Management */}
                    <div>
                      <label className="block text-lg font-semibold text-black mb-4">
                        If your schedule is full, what should the AI do?
                      </label>
                      <div className="relative">
                        <select 
                          value={scheduleFullAction}
                          onChange={(e) => setScheduleFullAction(e.target.value)}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white"
                        >
                          <option value="">Select an option</option>
                          <option value="Offer the next available slot">Offer the next available slot</option>
                          <option value="Take a message for you">Take a message for you</option>
                          <option value="Add the customer to a waitlist">Add the customer to a waitlist</option>
                        </select>
                        <svg
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                            stroke="#141B34"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6">
              <div className="space-y-5">
                {/* Section Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
                        <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
                      </svg>
                      <h2 className="text-xl font-semibold text-black">FAQs</h2>
                    </div>
                    <p className="text-lg font-semibold text-gray-500">Manage the information your AI agent uses to answer questions accurately.</p>
                  </div>
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={discardFaqs}
                       className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
                     >
                       <RotateCcw className="w-5 h-5" />
                       <span className="text-base font-medium text-black">Discard</span>
                     </button>
                    <button 
                      onClick={saveChanges}
                      className="flex items-center gap-3 px-4 py-2 bg-black text-white rounded-xl"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_60_7)">
                          <path d="M16.875 6.50859V16.25C16.875 16.4158 16.8092 16.5747 16.6919 16.6919C16.5747 16.8092 16.4158 16.875 16.25 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V3.75C3.125 3.58424 3.19085 3.42527 3.30806 3.30806C3.42527 3.19085 3.58424 3.125 3.75 3.125H13.4914C13.6569 3.12508 13.8157 3.19082 13.9328 3.30781L16.6922 6.06719C16.8092 6.18431 16.8749 6.34305 16.875 6.50859Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.25 16.875V11.875C6.25 11.7092 6.31585 11.5503 6.43306 11.4331C6.55027 11.3158 6.70924 11.25 6.875 11.25H13.125C13.2908 11.25 13.4497 11.3158 13.5669 11.4331C13.6842 11.5503 13.75 11.7092 13.75 11.875V16.875" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.875 5.625H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_60_7">
                            <rect width="20" height="20" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-base font-medium">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* FAQs Content Container */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="space-y-3">
                    {/* FAQ Section Label */}
                    <h3 className="text-lg font-semibold text-black mb-3">FAQ</h3>

                    {/* Existing FAQ Items */}
                    <div className="space-y-3">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="flex items-start gap-5">
                          {/* Checkbox Placeholder */}
                          <div className="w-6 h-6 border-2 border-gray-200 rounded-sm mt-1 flex-shrink-0"></div>
                          
                          {/* FAQ Content */}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-black mb-1">
                              {faq.question}
                            </h4>
                            <p className="text-sm font-semibold text-gray-500">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add New FAQ Section */}
                    <div className="flex flex-col md:flex-row gap-3 md:gap-5 pt-3 md:pt-5">
                      {/* Question Input */}
                      <div className="flex-1">
                        <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">
                          Question
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your question"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 lg:py-4 border-2 border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-500 placeholder-gray-500"
                        />
                      </div>
                      
                      {/* Answer Input */}
                      <div className="flex-1">
                        <label className="block text-sm md:text-base lg:text-lg font-semibold text-black mb-2 md:mb-3">
                          Answer
                        </label>
                        <input
                          type="text"
                          placeholder="Enter an answer to your question"
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl text-sm md:text-base lg:text-lg text-gray-500 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    {/* Add FAQ Button */}
                    <button 
                      onClick={addFaq}
                      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black text-white rounded-xl"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_70_202)">
                          <path
                            d="M3.125 10H16.875"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 3.125V16.875"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_70_202">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-sm md:text-base font-medium">Add FAQ</span>
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-5">
                {/* Section Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                        <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
                        <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
                      </svg>
                      <h2 className="text-lg md:text-xl font-semibold text-black">Advanced</h2>
                    </div>
                    <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-500">Fine-tune your AI agent's behavior, integrations, and system controls.</p>
                  </div>
                   <div className="flex items-center gap-2 md:gap-3">
                     <button 
                       onClick={discardAdvanced}
                       className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
                     >
                       <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                       <span className="text-sm md:text-base font-medium text-black">Discard</span>
                     </button>
                    <button 
                      onClick={saveChanges}
                      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black text-white rounded-xl"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <g clipPath="url(#clip0_60_7)">
                          <path d="M16.875 6.50859V16.25C16.875 16.4158 16.8092 16.5747 16.6919 16.6919C16.5747 16.8092 16.4158 16.875 16.25 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V3.75C3.125 3.58424 3.19085 3.42527 3.30806 3.30806C3.42527 3.19085 3.58424 3.125 3.75 3.125H13.4914C13.6569 3.12508 13.8157 3.19082 13.9328 3.30781L16.6922 6.06719C16.8092 6.18431 16.8749 6.34305 16.875 6.50859Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.25 16.875V11.875C6.25 11.7092 6.31585 11.5503 6.43306 11.4331C6.55027 11.3158 6.70924 11.25 6.875 11.25H13.125C13.2908 11.25 13.4497 11.3158 13.5669 11.4331C13.6842 11.5503 13.75 11.7092 13.75 11.875V16.875" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.875 5.625H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_60_7">
                            <rect width="20" height="20" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className="text-base font-medium">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Advanced Settings Container */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="space-y-5">
                    {/* First Row - AI Handling & Daily Summary */}
                    <div className="flex gap-5">
                      {/* AI Handling Dropdown */}
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          How should your AI handle common questions that it can't answer?
                        </label>
                         <div className="relative">
                          <select 
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white"
                            value={handlingUnknown}
                            onChange={(e) => setHandlingUnknown(e.target.value)}
                          >
                            <option value="">Select what the AI should do</option>
                            <option value="Politely transfer the call to you (or your voicemail)">Politely transfer the call to you (or your voicemail)</option>
                            <option value="Take a message and email it to you">Take a message and email it to you</option>
                            <option value="Offer to call the customer back later">Offer to call the customer back later</option>
                          </select>
                          <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                              stroke="#141B34"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Daily Summary Toggle */}
                      <div className="flex-1 space-y-4">
                        <label className="block text-lg font-semibold text-black">
                          Do you want a daily summary of all calls and bookings?
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-gray-500">No</span>
                          <button
                            onClick={() => setDailySummary(!dailySummary)}
                            className={`flex p-1 rounded-full transition-colors ${
                              dailySummary ? "bg-gray-200" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                dailySummary ? "bg-black translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                !dailySummary ? "bg-black -translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                          </button>
                          <span className="text-lg font-semibold text-gray-500">Yes</span>
                        </div>
                      </div>
                    </div>

                    {/* Second Row - Email Confirmations & Auto Reminders */}
                    <div className="flex gap-5">
                      {/* Email Confirmations Toggle */}
                      <div className="flex-1 space-y-4">
                        <label className="block text-lg font-semibold text-black">
                          Should customers receive booking confirmations by Email?
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-gray-500">No</span>
                          <button
                            onClick={() => setEmailConfirmations(!emailConfirmations)}
                            className={`flex p-1 rounded-full transition-colors ${
                              emailConfirmations ? "bg-gray-200" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                emailConfirmations ? "bg-black translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                !emailConfirmations ? "bg-black -translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                          </button>
                          <span className="text-lg font-semibold text-gray-500">Yes</span>
                        </div>
                      </div>
                      
                      {/* Auto Reminders Toggle */}
                      <div className="flex-1 space-y-4">
                        <label className="block text-lg font-semibold text-black">
                          Would you like your AI to send automatic reminders before each appointment?
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-gray-500">No</span>
                          <button
                            onClick={() => setAutoReminders(!autoReminders)}
                            className={`flex p-1 rounded-full transition-colors ${
                              autoReminders ? "bg-gray-200" : "bg-transparent"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                autoReminders ? "bg-black translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                            <div
                              className={`w-6 h-6 rounded-full transition-all ${
                                !autoReminders ? "bg-black -translate-x-6" : "bg-transparent"
                              }`}
                            ></div>
                          </button>
                          <span className="text-lg font-semibold text-gray-500">Yes</span>
                        </div>
                      </div>
                    </div>

                    {/* Third Row - Calendar Integration */}
                    <div className="flex justify-between items-end gap-5">
                      {/* Calendar Integration Dropdown */}
                      <div className="flex-1">
                        <label className="block text-lg font-semibold text-black mb-3">
                          Calendar Integration
                        </label>
                         <div className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg bg-white">
                           {googleIntegration ? (
                             <div className="flex items-center justify-between">
                               <span className="text-green-600 font-medium">{googleIntegration.user_email}</span>
                               <button
                                 onClick={disconnectIntegration}
                                 disabled={googleLoading}
                                 className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                               >
                                 Disconnect
                               </button>
                             </div>
                           ) : (
                             <span className="text-black">Google Calendar</span>
                           )}
                         </div>
                      </div>
                      
                      {/* Sync Account Button */}
                      <button 
                        onClick={() => selectedAgentId && initiateOAuth(selectedAgentId)}
                        disabled={googleLoading || !selectedAgentId}
                        className="flex items-center gap-3 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <g clipPath="url(#clip0_183_684)">
                            <path
                              d="M7.5 12.5L12.5 7.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8.75 5.94598L11.0984 3.60223C11.8036 2.90843 12.7544 2.52139 13.7437 2.52542C14.7329 2.52945 15.6805 2.92422 16.3801 3.62374C17.0796 4.32326 17.4743 5.27086 17.4784 6.26012C17.4824 7.24938 17.0954 8.20016 16.4016 8.90536L14.0531 11.2499"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5.94598 8.75L3.60223 11.0984C2.90843 11.8036 2.52139 12.7544 2.52542 13.7437C2.52945 14.7329 2.92422 15.6805 3.62374 16.3801C4.32326 17.0796 5.27086 17.4743 6.26012 17.4784C7.24938 17.4824 8.20016 17.0954 8.90536 16.4016L11.2499 14.0531"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_183_684">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-base font-medium">
                          {googleIntegration ? 'Connected' : 'Sync Account'}
                        </span>
                      </button>
                      
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
      </main>

      {/* Notification Popup */}
      <NotificationPopup
        notifications={notifications}
        isVisible={showNotifications}
        onClose={closeNotifications}
        notificationCount={notificationCount}
      />
    </div>
  );
};

export default AgentManagement;