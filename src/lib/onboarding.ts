import { supabase } from "@/integrations/supabase/client";

export interface OnboardingData {
  businessName?: string;
  businessTypes?: Array<{
    type: string;
    hours: string;
    minutes: string;
  }>;
  primaryLocation?: string;
  contactNumber?: string;
  purchasedNumberDetails?: {
    id?: string;
    orgId?: string;
    number?: string;
    createdAt?: string;
    updatedAt?: string;
    twilioAccountSid?: string;
    name?: string;
    provider?: string;
    status?: string;
    smsEnabled?: boolean;
    workflowId?: string;
  };
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
  calendarIntegrationRequired?: boolean;
}

export const collectOnboardingDataFromSession = (): OnboardingData => {
  const data: OnboardingData = {};

  // Collect all data from sessionStorage
  const businessName = sessionStorage.getItem('businessName');
  if (businessName) data.businessName = businessName;

  const businessTypes = sessionStorage.getItem('businessTypes');
  if (businessTypes) {
    try {
      data.businessTypes = JSON.parse(businessTypes);
    } catch (e) {
      console.warn('Failed to parse businessTypes from sessionStorage');
    }
  }

  const primaryLocation = sessionStorage.getItem('primaryLocation');
  if (primaryLocation) data.primaryLocation = primaryLocation;

  const contactNumber = sessionStorage.getItem('contactNumber');
  if (contactNumber) data.contactNumber = contactNumber;

  const purchasedNumberDetails = sessionStorage.getItem('purchasedNumberDetails');
  if (purchasedNumberDetails) {
    try {
      data.purchasedNumberDetails = JSON.parse(purchasedNumberDetails);
    } catch (e) {
      console.warn('Failed to parse purchasedNumberDetails from sessionStorage');
    }
  }

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

  const calendarIntegration = sessionStorage.getItem('calendarIntegration');
  const calendarRequired = sessionStorage.getItem('calendar_integration_required');
  if (calendarIntegration || calendarRequired) {
    data.calendarIntegrationRequired = calendarIntegration === 'true' || calendarRequired === 'true';
  }

  return data;
};

export const saveOnboardingResponse = async (data: OnboardingData, projectId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get the user's default project if no projectId provided
  let finalProjectId = projectId;
  if (!finalProjectId) {
    const { data: userProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .limit(1);
    
    finalProjectId = userProjects?.[0]?.project_id;
  }

  const { data: response, error } = await supabase
    .from('onboarding_responses')
    .insert({
      user_id: user.id,
      project_id: finalProjectId,
      business_name: data.businessName,
      business_types: data.businessTypes,
      primary_location: data.primaryLocation,
      contact_number: data.contactNumber,
      purchased_number_details: data.purchasedNumberDetails,
      ai_voice_style: data.aiVoiceStyle,
      ai_greeting_style: data.aiGreetingStyle,
      ai_assistant_name: data.aiAssistantName,
      ai_handling_unknown: data.aiHandlingUnknown,
      ai_call_schedule: data.aiCallSchedule,
      services: data.services,
      business_days: data.businessDays,
      business_hours: data.businessHours,
      schedule_full_action: data.scheduleFullAction,
      wants_daily_summary: data.wantsDailySummary,
      wants_email_confirmations: data.wantsEmailConfirmations,
      reminder_settings: data.reminderSettings,
      faq_data: data.faqData,
      calendar_integration_required: data.calendarIntegrationRequired
    })
    .select()
    .single();

  return { data: response, error };
};

export const getLatestOnboardingResponse = async (projectId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('onboarding_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  return { data, error };
};

export const hasCompletedOnboarding = async (projectId?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    let query = supabase
      .from('onboarding_responses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.limit(1).maybeSingle();

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

// Clear all onboarding session data for fresh start
export function clearOnboardingSession() {
  // Fixed session storage keys
  const fixedKeys = [
    'businessName', 'businessTypes', 'primaryLocation', 'contactNumber',
    'aiVoiceStyle', 'aiGreetingStyle', 'aiAssistantName', 'aiHandlingUnknown', 'aiCallSchedule',
    'services', 'businessDays', 'businessHours', 'scheduleFullAction',
    'wantsDailySummary', 'wantsEmailConfirmations', 'reminderSettings',
    'faqQuestions', 'faqAnswers', 'calendarIntegration', 'calendar_integration_required',
    'purchasedNumberDetails'
  ];

  // Clear fixed keys
  fixedKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });

  // Get current onboarding ID for dynamic keys
  const onboardingId = sessionStorage.getItem('onboardingId');
  if (onboardingId) {
    // Clear dynamic keys that include onboarding ID
    const dynamicKeys = [
      `purchasedContactNumber_${onboardingId}`,
      `contactNumberPurchased_${onboardingId}`,
      `cachedContactNumbers_${onboardingId}`,
      `contactNumbersWebhookCalled_${onboardingId}`
    ];
    
    dynamicKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
  }

  // Clear the onboarding ID itself
  sessionStorage.removeItem('onboardingId');
}