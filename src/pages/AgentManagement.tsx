import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingData } from "@/lib/onboarding";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";

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

const isFAQData = (value: any): value is { enabled: boolean; questions: FAQ[] } =>
  typeof value === 'object' && value !== null &&
  typeof value.enabled === 'boolean' && 
  Array.isArray(value.questions);

const AgentManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { notifications, showNotifications, openNotifications, closeNotifications, notificationCount } = useNotifications();
  
  // State for all tabs
  const [loading, setLoading] = useState(true);
  const [isAgentLive, setIsAgentLive] = useState(true);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Basic Info
  const [businessName, setBusinessName] = useState('The Gents\' Chair');
  const [businessType, setBusinessType] = useState('Barbing Saloon');
  const [businessLocation, setBusinessLocation] = useState('350 5th Avenue, Suite 2100, New York, NY 10118');
  const [contactNumber, setContactNumber] = useState('');
  
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
  
  // FAQs
  const [faqEnabled, setFaqEnabled] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  
  // Advanced
  const [dailySummary, setDailySummary] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadAgentSettings();
  }, []);

  const loadAgentSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading agent settings:', error);
        return;
      }

      if (data) {
        // Basic Info
        setBusinessName(data.business_name || '');
        setBusinessType(data.business_type || '');
        setBusinessLocation(data.primary_location || '');
        setContactNumber(data.contact_number || '');
        
        // AI Personality
        setAiAssistantName(data.ai_assistant_name || '');
        setVoiceStyle(data.ai_voice_style || '');
        setGreetingStyle(data.ai_greeting_style || {});
        setHandlingUnknown(data.ai_handling_unknown || '');
        setAnswerTime(data.ai_call_schedule || '');
        
        // Booking
        setServices(isStringArray(data.services) ? data.services : []);
        setAppointmentDuration(data.appointment_duration || '');
        setBusinessDays(isStringArray(data.business_days) ? data.business_days : []);
        setBusinessHours(isBusinessHours(data.business_hours) ? data.business_hours : { from: '', to: '' });
        
        // FAQs
        const faqData = isFAQData(data.faq_data) ? data.faq_data : { enabled: false, questions: [] };
        setFaqEnabled(faqData.enabled || false);
        setFaqs(faqData.questions || []);
        
        // Advanced
        setDailySummary(data.wants_daily_summary || false);
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
  };

  const saveChanges = async () => {
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
        faq_data: { enabled: faqEnabled, questions: faqs } as any,
        wants_daily_summary: dailySummary,
      };

      const { error } = await supabase
        .from('onboarding_responses')
        .upsert(agentData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

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
  };

  const addFaq = () => {
    const newFaq: FAQ = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    };
    setFaqs([...faqs, newFaq]);
  };

  const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
  };

  const renderBasicInfo = () => (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" stroke="black" strokeWidth="1.5"/>
              <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="black" strokeWidth="1.5"/>
            </svg>
            <h2 className="text-xl font-semibold text-black">Business Information</h2>
          </div>
          <p className="text-lg font-semibold text-gray-500">Basic information about your business that the AI agent will use</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-white">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6743 1.66699V4.27715C16.6743 4.52203 16.3681 4.63289 16.2114 4.44477C14.6855 2.73991 12.468 1.66699 9.99996 1.66699C5.39758 1.66699 1.66663 5.39795 1.66663 10.0003C1.66663 14.6027 5.39758 18.3337 9.99996 18.3337C14.6023 18.3337 18.3333 14.6027 18.3333 10.0003" stroke="#141B34" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-base font-medium text-black">Refresh</span>
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

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="space-y-5">
          {/* First Row */}
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-lg font-semibold text-black mb-3">Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-semibold text-black mb-3">Business Type</label>
              <div className="relative">
                <select 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500 appearance-none bg-white"
                >
                  <option>Barbing Saloon</option>
                  <option>Restaurant</option>
                  <option>Clinic</option>
                  <option>Spa</option>
                </select>
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-lg font-semibold text-black mb-3">Primary Location</label>
              <input 
                type="text" 
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-lg font-semibold text-black mb-3">Business Hours</label>
              <input 
                type="text" 
                value={`${businessHours.from} - ${businessHours.to}`}
                onChange={(e) => {
                  const [from, to] = e.target.value.split(' - ');
                  setBusinessHours({ from: from || '', to: to || '' });
                }}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestMode = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90%] max-w-6xl h-[80%] flex">
        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-black">Test Your Agent</h3>
              <button 
                onClick={() => setIsTestMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Call Display */}
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M35 16V14C35 11.1716 35 9.75736 34.1213 8.87868C33.2426 8 31.8284 8 29 8H19C16.1716 8 14.7574 8 13.8787 8.87868C13 9.75736 13 11.1716 13 14V16C13 18.8284 13 20.2426 13.8787 21.1213C14.7574 22 16.1716 22 19 22H29C31.8284 22 33.2426 22 34.1213 21.1213C35 20.2426 35 18.8284 35 16Z" stroke="#141B34" strokeWidth="2"/>
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-600 mb-2">No active test call</p>
              <p className="text-gray-500">Start a test call to see how your agent responds</p>
            </div>
          </div>
          
          {/* Call Controls */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-center gap-4">
              <button className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92V19.92C22 20.9 21.11 21.74 20.04 21.74C10.04 21.74 2 13.7 2 3.7C2 2.63 2.84 1.74 3.92 1.74H6.92C7.91 1.74 8.74 2.63 8.74 3.7V6.7C8.74 7.69 7.91 8.52 6.92 8.52H4.74C4.74 13.07 8.47 16.8 13.02 16.8V14.62C13.02 13.63 13.85 12.8 14.84 12.8H17.84C18.83 12.8 19.66 13.63 19.66 14.62V17.62C19.66 18.61 18.83 19.44 17.84 19.44H15.84" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92V19.92C22 20.9 21.11 21.74 20.04 21.74C10.04 21.74 2 13.7 2 3.7C2 2.63 2.84 1.74 3.92 1.74H6.92C7.91 1.74 8.74 2.63 8.74 3.7V6.7C8.74 7.69 7.91 8.52 6.92 8.52H4.74C4.74 13.07 8.47 16.8 13.02 16.8V14.62C13.02 13.63 13.85 12.8 14.84 12.8H17.84C18.83 12.8 19.66 13.63 19.66 14.62V17.62C19.66 18.61 18.83 19.44 17.84 19.44H15.84" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Test Scenarios */}
        <div className="w-80 border-l border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-black mb-4">Test Scenarios</h4>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <p className="font-medium">Booking Request</p>
              <p className="text-sm text-gray-500">Test appointment booking</p>
            </button>
            <button className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <p className="font-medium">Business Hours</p>
              <p className="text-sm text-gray-500">Ask about opening times</p>
            </button>
            <button className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100">
              <p className="font-medium">Service Inquiry</p>
              <p className="text-sm text-gray-500">Ask about services</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading agent settings...</p>
        </div>
      </div>
    );
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

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        {/* Top Header */}
        <div className="px-4 md:px-8 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-black">Voicera AI</h1>

            <div className="flex items-center gap-8">
              {/* Agent Live */}
              <button
                onClick={() => navigate("/agent-management")}
                className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 18C20.4142 18 21.1213 18 21.5607 17.5607C22 17.1213 22 16.4142 22 15C22 13.5858 22 12.8787 21.5607 12.4393C21.1213 12 20.4142 12 19 12"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 18C3.58579 18 2.87868 18 2.43934 17.5607C2 17.1213 2 16.4142 2 15C2 13.5858 2 12.8787 2.43934 12.4393C2.87868 12 3.58579 12 5 12"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z"
                    stroke="#141B34"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 5V8"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 13V14"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 13V14"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17.5C10 17.5 10.6667 18 12 18C13.3333 18 14 17.5 14 17.5"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-lg font-semibold text-black">
                  Agent Live
                </span>
              </button>

              {/* Notification Bell */}
              <button onClick={openNotifications} className="relative">
                <svg width="29" height="33" viewBox="0 0 29 33" fill="none">
                  <path d="M15.5 27C15.5 28.933 13.933 30.5 12 30.5C10.067 30.5 8.5 28.933 8.5 27" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.2311 27H4.76887C3.79195 27 3 26.208 3 25.2311C3 24.762 3.18636 24.3121 3.51809 23.9803L4.12132 23.3771C4.68393 22.8145 5 22.0514 5 21.2558V18.5C5 14.634 8.13401 11.5 12 11.5C15.866 11.5 19 14.634 19 18.5V21.2558C19 22.0514 19.3161 22.8145 19.8787 23.3771L20.4819 23.9803C20.8136 24.3121 21 24.762 21 25.2311C21 26.208 20.208 27 19.2311 27Z" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {notificationCount > 0 && <circle cx="24.5" cy="4" r="4" fill="#EF4444"/>}
                </svg>
              </button>

              {/* User Controls */}
              <div className="flex items-center gap-5">
                <button onClick={() => navigate("/profile")} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" title="Profile">
                  <span className="text-lg font-semibold text-gray-800">{user?.email?.[0]?.toUpperCase() || "U"}</span>
                </button>
                <button onClick={signOut} className="hover:opacity-70">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center mt-4">
            <div className="bg-gray-100 rounded-full p-2 flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  location.pathname === "/dashboard" 
                    ? "bg-white shadow-sm" 
                    : "hover:bg-gray-200"
                }`}
              >
                <span className={`text-lg font-semibold ${
                  location.pathname === "/dashboard" 
                    ? "text-black" 
                    : "text-gray-500"
                }`}>
                  Dashboard
                </span>
              </button>
              <button
                onClick={() => navigate("/call-logs")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  location.pathname === "/call-logs" 
                    ? "bg-white shadow-sm" 
                    : "hover:bg-gray-200"
                }`}
              >
                <span className={`text-lg font-semibold ${
                  location.pathname === "/call-logs" 
                    ? "text-black" 
                    : "text-gray-500"
                }`}>
                  Call Logs
                </span>
              </button>
              <button
                onClick={() => navigate("/daily-summary")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  location.pathname === "/daily-summary" 
                    ? "bg-white shadow-sm" 
                    : "hover:bg-gray-200"
                }`}
              >
                <span className={`text-lg font-semibold ${
                  location.pathname === "/daily-summary" 
                    ? "text-black" 
                    : "text-gray-500"
                }`}>
                  Daily Summary
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-black mb-1">Agent Management</h1>
          <p className="text-xl font-semibold text-gray-500">Configure your AI agent settings and behavior</p>
        </div>

        {/* Agent Status Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-semibold text-gray-500">Agent status:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 ${isAgentLive ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                <span className={`text-xl font-semibold ${isAgentLive ? 'text-green-600' : 'text-red-600'}`}>
                  {isAgentLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsAgentLive(!isAgentLive)}
                className={`px-4 py-3 ${isAgentLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-lg font-semibold transition-colors`}
              >
                {isAgentLive ? 'Go Offline' : 'Go Live'}
              </button>
              <button 
                onClick={() => setIsTestMode(true)}
                className="px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-lg font-semibold transition-colors"
              >
                Test Agent
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-gray-100 rounded-full p-1">
              <TabsTrigger value="basic-info" className="rounded-full">Basic Info</TabsTrigger>
              <TabsTrigger value="personality" className="rounded-full">AI Personality</TabsTrigger>
              <TabsTrigger value="booking" className="rounded-full">Booking</TabsTrigger>
              <TabsTrigger value="faqs" className="rounded-full">FAQs</TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-full">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="space-y-6">
              {renderBasicInfo()}
            </TabsContent>

            <TabsContent value="personality" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="assistant-name" className="text-lg font-semibold">AI Assistant Name</Label>
                  <Input id="assistant-name" value={aiAssistantName} onChange={(e) => setAiAssistantName(e.target.value)} placeholder="Enter assistant name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice-style" className="text-lg font-semibold">Voice Style</Label>
                  <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handling-unknown" className="text-lg font-semibold">Handling Unknown Questions</Label>
                  <Select value={handlingUnknown} onValueChange={setHandlingUnknown}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select handling method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer to Human</SelectItem>
                      <SelectItem value="polite-decline">Polite Decline</SelectItem>
                      <SelectItem value="take-message">Take Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer-time" className="text-lg font-semibold">Answer Time</Label>
                  <Select value={answerTime} onValueChange={setAnswerTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="2-rings">After 2 rings</SelectItem>
                      <SelectItem value="3-rings">After 3 rings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Services Offered</Label>
                  <div className="space-y-2">
                    {['Haircut', 'Beard Trim', 'Hair Wash', 'Styling'].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox 
                          id={service}
                          checked={services.includes(service)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setServices([...services, service]);
                            } else {
                              setServices(services.filter(s => s !== service));
                            }
                          }}
                        />
                        <Label htmlFor={service}>{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-duration" className="text-lg font-semibold">Default Appointment Duration</Label>
                  <Select value={appointmentDuration} onValueChange={setAppointmentDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch checked={faqEnabled} onCheckedChange={setFaqEnabled} />
                  <Label className="text-lg font-semibold">Enable FAQ System</Label>
                </div>
                {faqEnabled && (
                  <Button onClick={addFaq} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add FAQ
                  </Button>
                )}
              </div>
              
              {faqEnabled && (
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card key={faq.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <Label className="text-sm font-medium">Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                              placeholder="Enter FAQ question"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFaq(faq.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Answer</Label>
                          <Input
                            value={faq.answer}
                            onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                            placeholder="Enter FAQ answer"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
                  <Label className="text-lg font-semibold">Daily Summary Reports</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive daily summaries of all calls and interactions
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Notification Popup */}
      <NotificationPopup
        notifications={notifications}
        isVisible={showNotifications}
        onClose={closeNotifications}
        notificationCount={notificationCount}
      />

      {/* Test Mode Modal */}
      {isTestMode && renderTestMode()}
    </div>
  );
};

export default AgentManagement;