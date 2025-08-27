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
  
  // State for all tabs
  const [loading, setLoading] = useState(true);
  
  // Basic Info
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
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
  const [businessHours, setBusinessHours] = useState({ from: '', to: '' });
  
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 lg:px-16 py-4">
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
            <button
              onClick={() => {}}
              className="relative"
            >
              <svg width="29" height="33" viewBox="0 0 29 33" fill="none">
                <path
                  d="M15.5 27C15.5 28.933 13.933 30.5 12 30.5C10.067 30.5 8.5 28.933 8.5 27"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.2311 27H4.76887C3.79195 27 3 26.208 3 25.2311C3 24.762 3.18636 24.3121 3.51809 23.9803L4.12132 23.3771C4.68393 22.8145 5 22.0514 5 21.2558V18.5C5 14.634 8.13401 11.5 12 11.5C15.866 11.5 19 14.634 19 18.5V21.2558C19 22.0514 19.3161 22.8145 19.8787 23.3771L20.4819 23.9803C20.8136 24.3121 21 24.762 21 25.2311C21 26.208 20.208 27 19.2311 27Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24.5" cy="4" r="4" fill="#EF4444" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/profile")}
                className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Profile"
              >
                <span className="text-lg font-semibold text-gray-800">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </button>
              <button onClick={signOut} className="hover:opacity-70">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Agent Management
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground">Agent status:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
            </div>
            <p className="text-base text-muted-foreground">
              Configure your AI agent settings and behavior
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                toast({
                  title: "Agent Status",
                  description: "Agent is now offline",
                  variant: "destructive",
                });
              }}
              className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md text-sm font-medium transition-colors"
            >
              Go Offline
            </button>
            <button
              onClick={() => {
                toast({
                  title: "Test Agent",
                  description: "Testing agent functionality...",
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 5V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Test Agent
            </button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Tabs defaultValue="basic-info" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted p-1 h-auto">
                  <TabsTrigger value="basic-info" className="data-[state=active]:bg-background">Basic Info</TabsTrigger>
                  <TabsTrigger value="personality" className="data-[state=active]:bg-background">AI Personality</TabsTrigger>
                  <TabsTrigger value="booking" className="data-[state=active]:bg-background">Booking</TabsTrigger>
                  <TabsTrigger value="faqs" className="data-[state=active]:bg-background">FAQs</TabsTrigger>
                  <TabsTrigger value="advanced" className="data-[state=active]:bg-background">Advanced</TabsTrigger>
                </TabsList>
                
                <button
                  onClick={saveChanges}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>

              <TabsContent value="basic-info" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-lg font-semibold">
                      Business Name
                    </Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter your business name"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-type" className="text-lg font-semibold">
                      Business Type
                    </Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="salon">Hair Salon</SelectItem>
                        <SelectItem value="medical">Medical Practice</SelectItem>
                        <SelectItem value="dental">Dental Office</SelectItem>
                        <SelectItem value="legal">Legal Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-lg font-semibold">
                      Primary Location
                    </Label>
                    <Input
                      id="location"
                      value={businessLocation}
                      onChange={(e) => setBusinessLocation(e.target.value)}
                      placeholder="Enter your business location"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-lg font-semibold">
                      Contact Number
                    </Label>
                    <Input
                      id="contact"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter your contact number"
                      className="h-12 text-lg"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personality" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Assistant Name</Label>
                    <Input
                      value={aiAssistantName}
                      onChange={(e) => setAiAssistantName(e.target.value)}
                      placeholder="Enter assistant name"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Voice Style</Label>
                    <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select voice style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">How to handle unknown questions</Label>
                    <Select value={handlingUnknown} onValueChange={setHandlingUnknown}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select handling method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer to human</SelectItem>
                        <SelectItem value="callback">Schedule callback</SelectItem>
                        <SelectItem value="polite">Politely decline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">When should the AI answer calls?</Label>
                    <Select value={answerTime} onValueChange={setAnswerTime}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select answer time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="business-hours">Business hours only</SelectItem>
                        <SelectItem value="after-hours">After hours only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="booking" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Services (comma separated)</Label>
                    <Input
                      value={services.join(', ')}
                      onChange={(e) => setServices(e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Enter services"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Appointment Duration</Label>
                    <Select value={appointmentDuration} onValueChange={setAppointmentDuration}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Business Days (comma separated)</Label>
                    <Input
                      value={businessDays.join(', ')}
                      onChange={(e) => setBusinessDays(e.target.value.split(',').map(d => d.trim()))}
                      placeholder="e.g., Monday, Tuesday, Wednesday"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">Business Hours</Label>
                    <div className="flex gap-2">
                      <Input
                        value={businessHours.from}
                        onChange={(e) => setBusinessHours({...businessHours, from: e.target.value})}
                        placeholder="From (9:00 AM)"
                        className="h-12 text-lg"
                      />
                      <Input
                        value={businessHours.to}
                        onChange={(e) => setBusinessHours({...businessHours, to: e.target.value})}
                        placeholder="To (5:00 PM)"
                        className="h-12 text-lg"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faqs" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="faq-enabled"
                      checked={faqEnabled}
                      onCheckedChange={(checked) => setFaqEnabled(checked === true)}
                    />
                    <Label htmlFor="faq-enabled" className="text-lg font-semibold">
                      Enable FAQ responses
                    </Label>
                  </div>
                  {faqEnabled && (
                    <Button onClick={addFaq} variant="outline" className="flex items-center gap-2">
                      <Plus size={16} />
                      Add FAQ
                    </Button>
                  )}
                </div>

                {faqEnabled && (
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <Card key={faq.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <Input
                              placeholder="Enter question"
                              value={faq.question}
                              onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => removeFaq(faq.id)}
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <Input
                            placeholder="Enter answer"
                            value={faq.answer}
                            onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Daily Summary</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={dailySummary}
                      onCheckedChange={setDailySummary}
                    />
                    <span className="text-sm text-gray-600">
                      Receive daily summaries of calls and bookings
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgentManagement;