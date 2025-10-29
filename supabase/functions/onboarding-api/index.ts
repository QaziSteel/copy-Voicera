import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabase = createClient(
      'https://nhhdxwgrmcdsapbuvelx.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')
    const apiKey = url.searchParams.get('api_key')

    // Optional API key validation for additional security
    if (apiKey && apiKey !== Deno.env.get('LOVABLE_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Onboarding API called', { userId, hasApiKey: !!apiKey })

    // Build query based on parameters
    let query = supabase
      .from('onboarding_responses')
      .select(`
        id,
        user_id,
        business_name,
        business_type,
        primary_location,
        contact_number,
        ai_assistant_name,
        ai_voice_style,
        ai_greeting_style,
        ai_handling_unknown,
        ai_handling_phone_number,
        appointment_duration,
        schedule_full_action,
        services,
        business_days,
        business_hours,
        wants_email_confirmations,
        wants_daily_summary,
        reminder_settings,
        faq_data,
        created_at,
        updated_at
      `)

    // Filter by user_id if provided
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch onboarding data', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Retrieved ${data?.length || 0} onboarding responses`)

    // Return the data
    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        count: data?.length || 0,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})