import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { toast } = useToast();
  
  // State for all tabs
  const [loading, setLoading] = useState(true);
  
  // Basic Info
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
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
        setLocation(data.primary_location || '');
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
        primary_location: location,
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
          <div className="flex items-center gap-4">
            <Button onClick={saveChanges} className="bg-black text-white hover:bg-gray-800">
              Save Changes
            </Button>
            <Button 
              variant="outline"
              onClick={() => loadAgentSettings()}
              className="border-gray-200"
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-7">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Agent Management</h1>
              <p className="text-lg text-gray-600">Configure your AI assistant's settings and behavior</p>
            </div>
            <Button className="bg-black text-white hover:bg-gray-800">
              Test Agent
            </Button>
          </div>

          <Card className="bg-white">
            <CardContent className="p-8">
              <Tabs defaultValue="basic-info" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                  <TabsTrigger value="personality">AI Personality</TabsTrigger>
                  <TabsTrigger value="booking">Booking</TabsTrigger>
                  <TabsTrigger value="faqs">FAQs</TabsTrigger>
                </TabsList>

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
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
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
              </Tabs>

              {/* Advanced Settings moved to separate section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Advanced Settings</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-lg font-semibold">Daily Summary</Label>
                    <p className="text-sm text-gray-600">
                      Receive daily summaries of calls and bookings
                    </p>
                  </div>
                  <Switch
                    checked={dailySummary}
                    onCheckedChange={setDailySummary}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AgentManagement;