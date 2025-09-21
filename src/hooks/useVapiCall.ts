import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VapiCallConfig {
  assistantId?: string;
  agentData?: any;
}

interface CallMetrics {
  duration: number;
  startTime: Date | null;
  endTime: Date | null;
}

export const useVapiCall = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    duration: 0,
    startTime: null,
    endTime: null
  });
  
  const vapiInstance = useRef<any>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize Vapi SDK
  const initializeVapi = useCallback(async () => {
    try {
      const Vapi = await import('@vapi-ai/web');
      
      // Get public key from environment
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      
      if (!publicKey) {
        throw new Error('Vapi public key not found. Please set VITE_VAPI_PUBLIC_KEY environment variable.');
      }

      // Always create a fresh instance to avoid config bleed between calls
      if (vapiInstance.current) {
        try {
          vapiInstance.current.stop();
        } catch (e) {
          console.warn('Previous Vapi instance stop error (ignored):', e);
        }
      }
      vapiInstance.current = new Vapi.default(publicKey);

      // Set up event listeners
      vapiInstance.current.on('call-start', () => {
        console.log('Vapi call started');
        setIsCallActive(true);
        setIsConnecting(false);
        setCallMetrics(prev => ({
          ...prev,
          startTime: new Date(),
          duration: 0
        }));
        
        // Start duration counter
        durationInterval.current = setInterval(() => {
          setCallMetrics(prev => ({
            ...prev,
            duration: prev.startTime ? Math.floor((Date.now() - prev.startTime.getTime()) / 1000) : 0
          }));
        }, 1000);
      });

      vapiInstance.current.on('call-end', () => {
        console.log('Vapi call ended');
        setIsCallActive(false);
        setIsConnecting(false);
        setCallMetrics(prev => ({
          ...prev,
          endTime: new Date()
        }));
        
        if (durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }
      });

      vapiInstance.current.on('speech-start', () => {
        console.log('Assistant started speaking');
      });

      vapiInstance.current.on('speech-end', () => {
        console.log('Assistant stopped speaking');
      });

      vapiInstance.current.on('volume-level', (volume: number) => {
        // Handle volume level for visual feedback
      });

      vapiInstance.current.on('message', (message: any) => {
        console.log('Vapi message:', message);
        
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript(prev => prev + '\n' + `${message.role}: ${message.transcript}`);
        }
      });

      vapiInstance.current.on('error', (err: any) => {
        console.error('Vapi error:', err);
        const apiMsg = (() => {
          if (!err) return null;
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          if (err.error?.message) return Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
          if (err.error) return typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
          try { return JSON.stringify(err); } catch { return 'An error occurred during the call'; }
        })();
        setError(apiMsg || 'An error occurred during the call');
        setIsConnecting(false);
        setIsCallActive(false);
      });

    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice calling system');
    }
  }, []);

  // Start call with agent configuration
  const startCall = useCallback(async (config: VapiCallConfig) => {
    try {
      setError(null);
      setTranscript('');
      setIsConnecting(true);

      await initializeVapi();

      // Build call configuration - ensure only one method is used
      let callConfig: any = {};

      // Validation: ensure only one configuration method is provided
      const configMethods = [
        !!config.assistantId,
        !!config.agentData
      ].filter(Boolean).length;

      if (configMethods === 0) {
        throw new Error('No call configuration provided. Please specify assistantId or agentData.');
      }

      if (configMethods > 1) {
        throw new Error('Multiple call configurations provided. Please specify only one: assistantId or agentData.');
      }

      if (config.assistantId) {
        // Assistant ID support - pass as string per SDK
        callConfig = String(config.assistantId).trim();
        console.log('Vapi call config (assistantId as string):', callConfig);
      } else if (config.agentData) {
        // Create dynamic assistant from agent data - full assistant object
        callConfig = {
          assistant: {
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: `You are ${config.agentData.ai_assistant_name || 'an AI assistant'} for ${config.agentData.business_name || 'a business'}. ${config.agentData.ai_greeting_style ? `Your greeting style is ${config.agentData.ai_greeting_style}.` : ''} Help customers with their inquiries about services, bookings, and general information.`
                }
              ]
            },
            voice: {
              provider: 'playht',
              voiceId: config.agentData.ai_voice_style || 'jennifer'
            },
            name: config.agentData.ai_assistant_name || 'AI Assistant',
            firstMessage: `Hello! I'm ${config.agentData.ai_assistant_name || 'your AI assistant'}. How can I help you today?`
          }
        };
        console.log('Vapi call config (dynamic assistant object):', { assistantName: callConfig.assistant.name });
      }

      console.log('Vapi start payload:', callConfig);
      await vapiInstance.current.start(callConfig);

    } catch (err: any) {
      console.error('Failed to start call:', err);
      const rawMsg = typeof err === 'string' ? err : (err?.message || err?.error?.message || err?.error);
      const msgStr = Array.isArray(rawMsg) ? rawMsg.join(', ') : (typeof rawMsg === 'string' ? rawMsg : (rawMsg ? JSON.stringify(rawMsg) : ''));

      // Targeted retry for known schema errors
      const schemaText = String(msgStr || '');
      try {
        if (schemaText.includes('assistant.property assistantId should not exist') && config.assistantId) {
          console.warn('Retrying Vapi.start with assistant as string due to schema error');
          await vapiInstance.current.start(String(config.assistantId).trim());
          return;
        }
        if (schemaText.includes('assistant should be string') && config.assistantId) {
          console.warn('Retrying Vapi.start with assistant as string');
          await vapiInstance.current.start(String(config.assistantId).trim());
          return;
        }
      } catch (retryErr) {
        console.error('Retry also failed:', retryErr);
      }

      setError(msgStr || 'Failed to start the call. Please try again.');
      setIsConnecting(false);
      setIsCallActive(false);
    }
  }, [initializeVapi]);

  // End the current call
  const endCall = useCallback(() => {
    if (vapiInstance.current && isCallActive) {
      vapiInstance.current.stop();
    }
  }, [isCallActive]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (vapiInstance.current && isCallActive) {
      const newMutedState = !isMuted;
      vapiInstance.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  }, [isCallActive, isMuted]);

  // Initialize Vapi on mount
  useEffect(() => {
    initializeVapi();
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (vapiInstance.current) {
        vapiInstance.current.stop();
      }
    };
  }, [initializeVapi]);

  // Format duration for display
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    startCall,
    endCall,
    toggleMute,
    isConnecting,
    isCallActive,
    isMuted,
    error,
    transcript,
    callMetrics,
    formatDuration
  };
};