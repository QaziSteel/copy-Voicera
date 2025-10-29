import { supabase } from "@/integrations/supabase/client";

export interface OnboardingData {
  businessName?: string;
  businessTypes?: string[];
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
  services?: Array<{
    businessType: string;
    type: string;
    hours: string;
    minutes: string;
  }>;
  businessDays?: string[];
  businessHours?: {
    from: string;
    to: string;
  };
  wantsDailySummary?: boolean;
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

  const wantsDailySummary = sessionStorage.getItem('wantsDailySummary');
  if (wantsDailySummary) data.wantsDailySummary = wantsDailySummary === 'true';

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
      services: data.services,
      business_days: data.businessDays,
      business_hours: data.businessHours,
      wants_daily_summary: data.wantsDailySummary,
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

    // Check 1: Does user have an onboarding_responses record?
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

    // If they have an onboarding response, they've completed onboarding
    if (data) {
      return true;
    }

    // Check 2: Are they a member of any project (invited users)?
    const { data: membership, error: memberError } = await supabase
      .from('project_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) {
      console.error('Error checking project membership:', memberError);
      return false;
    }

    // If they're in a project, consider onboarding complete (invited user)
    return !!membership;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};