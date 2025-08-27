import { supabase } from "@/integrations/supabase/client";

export interface OnboardingData {
  businessName?: string;
  businessType?: string;
  primaryLocation?: string;
  contactNumber?: string;
  aiVoiceStyle?: string;
  aiGreetingStyle?: {
    label: string;
    greeting: string;
  };
  aiAssistantName?: string;
  aiHandlingUnknown?: string;
  aiCallSchedule?: string;
  services?: string[];
  businessDays?: string[];
  businessHours?: {
    from: string;
    to: string;
  };
  appointmentDuration?: string;
  scheduleFullAction?: string;
  wantsDailySummary?: boolean;
  wantsEmailConfirmations?: boolean;
  reminderSettings?: {
    enabled: boolean;
    timing?: string;
  };
  faqData?: {
    questions: string[];
    answers: string[];
  };
}

export const collectOnboardingDataFromSession = (): OnboardingData => {
  const data: OnboardingData = {};

  // Collect all data from sessionStorage
  const businessName = sessionStorage.getItem('businessName');
  if (businessName) data.businessName = businessName;

  const businessType = sessionStorage.getItem('businessType');
  if (businessType) data.businessType = businessType;

  const primaryLocation = sessionStorage.getItem('primaryLocation');
  if (primaryLocation) data.primaryLocation = primaryLocation;

  const contactNumber = sessionStorage.getItem('contactNumber');
  if (contactNumber) data.contactNumber = contactNumber;

  const aiVoiceStyle = sessionStorage.getItem('aiVoiceStyle');
  if (aiVoiceStyle) data.aiVoiceStyle = aiVoiceStyle;

  const aiGreetingStyle = sessionStorage.getItem('aiGreetingStyle');
  if (aiGreetingStyle) {
    try {
      data.aiGreetingStyle = JSON.parse(aiGreetingStyle);
    } catch (e) {
      console.warn('Failed to parse aiGreetingStyle from sessionStorage');
    }
  }

  const aiAssistantName = sessionStorage.getItem('aiAssistantName');
  if (aiAssistantName) data.aiAssistantName = aiAssistantName;

  const aiHandlingUnknown = sessionStorage.getItem('aiHandlingUnknown');
  if (aiHandlingUnknown) data.aiHandlingUnknown = aiHandlingUnknown;

  const aiCallSchedule = sessionStorage.getItem('aiCallSchedule');
  if (aiCallSchedule) data.aiCallSchedule = aiCallSchedule;

  const services = sessionStorage.getItem('services');
  if (services) {
    try {
      data.services = JSON.parse(services);
    } catch (e) {
      console.warn('Failed to parse services from sessionStorage');
    }
  }

  const businessDays = sessionStorage.getItem('businessDays');
  if (businessDays) {
    try {
      data.businessDays = JSON.parse(businessDays);
    } catch (e) {
      console.warn('Failed to parse businessDays from sessionStorage');
    }
  }

  const businessHours = sessionStorage.getItem('businessHours');
  if (businessHours) {
    try {
      data.businessHours = JSON.parse(businessHours);
    } catch (e) {
      console.warn('Failed to parse businessHours from sessionStorage');
    }
  }

  const appointmentDuration = sessionStorage.getItem('appointmentDuration');
  if (appointmentDuration) data.appointmentDuration = appointmentDuration;

  const scheduleFullAction = sessionStorage.getItem('scheduleFullAction');
  if (scheduleFullAction) data.scheduleFullAction = scheduleFullAction;

  const wantsDailySummary = sessionStorage.getItem('wantsDailySummary');
  if (wantsDailySummary) data.wantsDailySummary = wantsDailySummary === 'true';

  const wantsEmailConfirmations = sessionStorage.getItem('wantsEmailConfirmations');
  if (wantsEmailConfirmations) data.wantsEmailConfirmations = wantsEmailConfirmations === 'true';

  const reminderSettings = sessionStorage.getItem('reminderSettings');
  if (reminderSettings) {
    try {
      data.reminderSettings = JSON.parse(reminderSettings);
    } catch (e) {
      console.warn('Failed to parse reminderSettings from sessionStorage');
    }
  }

  const faqQuestions = sessionStorage.getItem('faqQuestions');
  const faqAnswers = sessionStorage.getItem('faqAnswers');
  if (faqQuestions && faqAnswers) {
    try {
      data.faqData = {
        questions: JSON.parse(faqQuestions),
        answers: JSON.parse(faqAnswers)
      };
    } catch (e) {
      console.warn('Failed to parse FAQ data from sessionStorage');
    }
  }

  return data;
};

export const saveOnboardingResponse = async (data: OnboardingData) => {
  const { data: response, error } = await supabase
    .from('onboarding_responses')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      business_name: data.businessName,
      business_type: data.businessType,
      primary_location: data.primaryLocation,
      contact_number: data.contactNumber,
      ai_voice_style: data.aiVoiceStyle,
      ai_greeting_style: data.aiGreetingStyle,
      ai_assistant_name: data.aiAssistantName,
      ai_handling_unknown: data.aiHandlingUnknown,
      ai_call_schedule: data.aiCallSchedule,
      services: data.services,
      business_days: data.businessDays,
      business_hours: data.businessHours,
      appointment_duration: data.appointmentDuration,
      schedule_full_action: data.scheduleFullAction,
      wants_daily_summary: data.wantsDailySummary,
      wants_email_confirmations: data.wantsEmailConfirmations,
      reminder_settings: data.reminderSettings,
      faq_data: data.faqData
    })
    .select()
    .single();

  return { data: response, error };
};

export const getLatestOnboardingResponse = async () => {
  const { data, error } = await supabase
    .from('onboarding_responses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('onboarding_responses')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};