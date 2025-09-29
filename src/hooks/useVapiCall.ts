import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VapiCallConfig {
  assistantId?: string;
  agentData?: any;
  onCallStart?: (resolve: (callId: string) => void) => Promise<void>;
  onCallEnd?: (callId: string, duration: number) => Promise<void>;
  onVapiCallStart?: (vapiCallId: string, testCallId: string) => Promise<void>;
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
  const [isVolumeOff, setIsVolumeOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    duration: 0,
    startTime: null,
    endTime: null
  });
  
  const vapiInstance = useRef<any>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<{ 
    onCallStart?: (resolve: (callId: string) => void) => Promise<void>; 
    onCallEnd?: (callId: string, duration: number) => Promise<void>;
    onVapiCallStart?: (vapiCallId: string, testCallId: string) => Promise<void>;
  }>({});
  const callStartTimeRef = useRef<Date | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const audioDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      vapiInstance.current.on('call-start', async (call: any) => {
        console.log('Vapi call started with call object:', call);
        const startTime = new Date();
        callStartTimeRef.current = startTime;
        
        // Start detecting audio elements for volume control
        startAudioElementDetection();
        
        setIsCallActive(true);
        setIsConnecting(false);
        setCallMetrics(prev => ({
          ...prev,
          startTime,
          duration: 0
        }));
        
        // Call the onCallStart callback if provided and wait for it to complete
        if (callbacksRef.current.onCallStart) {
          try {
            await callbacksRef.current.onCallStart((callId) => {
              currentCallIdRef.current = callId;
              console.log('Call started with test call ID:', callId);
              
              // Capture the actual Vapi call ID and update the test call log
              const vapiCallId = call.id;
              console.log('Captured Vapi call ID:', vapiCallId);
              if (vapiCallId && callbacksRef.current.onVapiCallStart) {
                callbacksRef.current.onVapiCallStart(vapiCallId, callId).catch(error => {
                  console.error('Error updating test call log with Vapi call ID:', error);
                });
              }
            });
          } catch (error) {
            console.error('Error in onCallStart callback:', error);
          }
        }
        
        // Start duration counter
        durationInterval.current = setInterval(() => {
          if (callStartTimeRef.current) {
            const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
            setCallMetrics(prev => ({
              ...prev,
              duration
            }));
          }
        }, 1000);
      });

      vapiInstance.current.on('call-end', async () => {
        console.log('Vapi call ended');
        setIsCallActive(false);
        setIsConnecting(false);
        
        // Stop audio element detection
        stopAudioElementDetection();
        
        const endTime = new Date();
        const finalDuration = callStartTimeRef.current ? Math.floor((endTime.getTime() - callStartTimeRef.current.getTime()) / 1000) : 0;
        
        console.log('Call end - Duration:', finalDuration, 'seconds');
        console.log('Call end - Call ID:', currentCallIdRef.current);
        
        setCallMetrics(prev => ({
          ...prev,
          endTime,
          duration: finalDuration
        }));
        
        // Call the onCallEnd callback if provided
        if (callbacksRef.current.onCallEnd && currentCallIdRef.current) {
          try {
            console.log('Calling onCallEnd with:', currentCallIdRef.current, finalDuration);
            await callbacksRef.current.onCallEnd(currentCallIdRef.current, finalDuration);
            console.log('onCallEnd completed successfully');
          } catch (error) {
            console.error('Error in onCallEnd callback:', error);
          }
        } else {
          console.warn('onCallEnd callback not called - callback exists:', !!callbacksRef.current.onCallEnd, 'callId exists:', !!currentCallIdRef.current);
        }
        
        // Reset refs
        callStartTimeRef.current = null;
        currentCallIdRef.current = null;
        
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
      
      // Store callbacks for later use
      callbacksRef.current = { 
        onCallStart: config.onCallStart, 
        onCallEnd: config.onCallEnd,
        onVapiCallStart: config.onVapiCallStart
      };

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

  // Audio element detection for volume control
  const startAudioElementDetection = useCallback(() => {
    // Set up MutationObserver to detect new audio elements
    mutationObserverRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement) {
            console.log('Detected new audio element:', node);
            audioElementsRef.current.push(node);
          }
        });
      });
    });

    // Start observing
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Periodic checking for existing audio elements (fallback)
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds with 100ms intervals
    
    audioDetectionIntervalRef.current = setInterval(() => {
      attempts++;
      const audioElements = Array.from(document.querySelectorAll('audio')) as HTMLAudioElement[];
      
      // Add any new audio elements we haven't seen before
      audioElements.forEach((element) => {
        if (!audioElementsRef.current.includes(element) && (element.src || element.srcObject)) {
          console.log('Found audio element via periodic check:', element);
          audioElementsRef.current.push(element);
        }
      });

      // Stop checking after max attempts or if we found audio elements
      if (attempts >= maxAttempts || audioElementsRef.current.length > 0) {
        if (audioDetectionIntervalRef.current) {
          clearInterval(audioDetectionIntervalRef.current);
          audioDetectionIntervalRef.current = null;
        }
      }
    }, 100);
  }, []);

  const stopAudioElementDetection = useCallback(() => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }
    if (audioDetectionIntervalRef.current) {
      clearInterval(audioDetectionIntervalRef.current);
      audioDetectionIntervalRef.current = null;
    }
    audioElementsRef.current = [];
  }, []);
  // Toggle volume
  const toggleVolume = useCallback(() => {
    if (isCallActive) {
      const newVolumeState = !isVolumeOff;
      setIsVolumeOff(newVolumeState);
      
      // Control detected audio elements directly
      let controlledElements = 0;
      audioElementsRef.current.forEach((element) => {
        if (element && !element.paused) {
          element.muted = newVolumeState;
          controlledElements++;
        }
      });

      if (controlledElements > 0) {
        console.log(`Volume ${newVolumeState ? 'muted' : 'unmuted'} - controlled ${controlledElements} audio elements`);
      } else {
        // Fallback: Try to find and control any audio elements in DOM
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((element: any) => {
          if (element.srcObject || element.src) {
            element.muted = newVolumeState;
          }
        });
        console.log(`Volume ${newVolumeState ? 'muted' : 'unmuted'} - used fallback method for ${audioElements.length} elements`);
      }
    }
  }, [isCallActive, isVolumeOff]);
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
      // Clean up audio detection
      stopAudioElementDetection();
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
    toggleVolume,
    isConnecting,
    isCallActive,
    isMuted,
    isVolumeOff,
    error,
    transcript,
    callMetrics,
    formatDuration
  };
};