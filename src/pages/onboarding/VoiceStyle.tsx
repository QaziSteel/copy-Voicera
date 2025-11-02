import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface Voice {
  id: number;
  voice_id: string;
  display_name: string;
  gender: string;
  style: string;
  storage_path: string;
}

export const VoiceStyle: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState<boolean>(false);
  const [selectedVoiceForPlayer, setSelectedVoiceForPlayer] = useState<Voice | null>(null);
  const audioPlayer = useAudioPlayer();

  // Load saved voice selection and fetch voices from Supabase on component mount
  useEffect(() => {
    const savedVoice = sessionStorage.getItem("aiVoiceStyle");
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }

    const fetchVoices = async () => {
      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .order('id');
      
      if (error) {
        console.error('Error fetching voices:', error);
      } else {
        setVoices(data || []);
      }
    };
    
    fetchVoices();
  }, []);

  const handleNext = () => {
    if (selectedVoice) {
      sessionStorage.setItem("aiVoiceStyle", selectedVoice);
      navigate("/onboarding/greetings");
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/personality-intro");
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setIsDropdownOpen(false);
  };

  const handlePlayVoice = async (voiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const voice = voices.find(v => v.voice_id === voiceId);
    if (!voice?.storage_path) return;
    
    // Open the audio player popup with this voice
    setSelectedVoiceForPlayer(voice);
    setShowAudioPlayer(true);
    setPlayingVoice(voiceId);
    
    // Start playing the audio
    const audioUrl = `https://xefbqgucxzgkhxgctqxn.supabase.co/storage/v1/object/public/voice-samples/${voice.storage_path}`;
    
    try {
      await audioPlayer.play(audioUrl);
    } catch (error) {
      console.error('Error playing voice:', error);
      setPlayingVoice(null);
    }
  };

  const handleCloseAudioPlayer = () => {
    setShowAudioPlayer(false);
    setSelectedVoiceForPlayer(null);
    audioPlayer.stop();
    setPlayingVoice(null);
  };

  const handlePreviousVoice = async () => {
    if (!selectedVoiceForPlayer) return;
    
    const currentIndex = voices.findIndex(v => v.voice_id === selectedVoiceForPlayer.voice_id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : voices.length - 1;
    const previousVoice = voices[previousIndex];
    
    setSelectedVoiceForPlayer(previousVoice);
    setPlayingVoice(previousVoice.voice_id);
    
    const audioUrl = `https://xefbqgucxzgkhxgctqxn.supabase.co/storage/v1/object/public/voice-samples/${previousVoice.storage_path}`;
    try {
      await audioPlayer.play(audioUrl);
    } catch (error) {
      console.error('Error playing voice:', error);
      setPlayingVoice(null);
    }
  };

  const handleNextVoice = async () => {
    if (!selectedVoiceForPlayer) return;
    
    const currentIndex = voices.findIndex(v => v.voice_id === selectedVoiceForPlayer.voice_id);
    const nextIndex = currentIndex < voices.length - 1 ? currentIndex + 1 : 0;
    const nextVoice = voices[nextIndex];
    
    setSelectedVoiceForPlayer(nextVoice);
    setPlayingVoice(nextVoice.voice_id);
    
    const audioUrl = `https://xefbqgucxzgkhxgctqxn.supabase.co/storage/v1/object/public/voice-samples/${nextVoice.storage_path}`;
    try {
      await audioPlayer.play(audioUrl);
    } catch (error) {
      console.error('Error playing voice:', error);
      setPlayingVoice(null);
    }
  };

  const handleTogglePlayback = async () => {
    if (!selectedVoiceForPlayer) return;

    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      const audioUrl = `https://xefbqgucxzgkhxgctqxn.supabase.co/storage/v1/object/public/voice-samples/${selectedVoiceForPlayer.storage_path}`;
      try {
        await audioPlayer.play(audioUrl);
      } catch (error) {
        console.error('Error playing voice:', error);
        setPlayingVoice(null);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioPlayer.duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioPlayer.duration;
    
    audioPlayer.seek(newTime);
  };

  // Stop audio when component unmounts or audio ends
  useEffect(() => {
    if (!audioPlayer.isPlaying) {
      setPlayingVoice(null);
    }
  }, [audioPlayer.isPlaying]);

  const selectedVoiceName = voices.find(v => v.voice_id === selectedVoice)?.display_name;

  const renderAudioPlayerPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[800px] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-800">
            Voice Preview – {selectedVoiceForPlayer?.display_name}
          </h3>
          <button
            onClick={handleCloseAudioPlayer}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3337 2.6665L2.66699 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66699 2.6665L13.3337 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Audio Player */}
        <div className="p-5">
          <div className="flex items-center gap-5 p-3 border border-gray-200 rounded-lg">
            {/* Previous Button */}
            <button onClick={handlePreviousVoice} className="p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.06492 12.6258C8.31931 13.8374 9.67295 14.7077 12.3802 16.4481C15.3247 18.3411 16.797 19.2876 17.9895 18.9229C18.3934 18.7994 18.7654 18.5823 19.0777 18.2876C20 17.4178 20 15.6118 20 12C20 8.38816 20 6.58224 19.0777 5.71235C18.7654 5.41773 18.3934 5.20057 17.9895 5.07707C16.797 4.71243 15.3247 5.6589 12.3802 7.55186C9.67295 9.29233 8.31931 10.1626 8.06492 11.3742C7.97836 11.7865 7.97836 12.2135 8.06492 12.6258Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 4V20"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button 
              onClick={handleTogglePlayback}
              className="w-12 h-12 bg-black rounded-full flex items-center justify-center"
            >
              {audioPlayer.isPlaying ? (
                // Pause icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="6" width="2" height="12" fill="white" rx="1"/>
                  <rect x="13" y="6" width="2" height="12" fill="white" rx="1"/>
                </svg>
              ) : (
                // Play icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                    fill="white"
                  />
                </svg>
              )}
            </button>

            {/* Next Button */}
            <button onClick={handleNextVoice} className="p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15.9351 12.6258C15.6807 13.8374 14.327 14.7077 11.6198 16.4481C8.67528 18.3411 7.20303 19.2876 6.01052 18.9229C5.60662 18.7994 5.23463 18.5823 4.92227 18.2876C4 17.4178 4 15.6118 4 12C4 8.38816 4 6.58224 4.92227 5.71235C5.23463 5.41773 5.60662 5.20057 6.01052 5.07707C7.20304 4.71243 8.67528 5.6589 11.6198 7.55186C14.327 9.29233 15.6807 10.1626 15.9351 11.3742C16.0216 11.7865 16.0216 12.2135 15.9351 12.6258Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 5V19"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Current Time */}
            <span className="text-gray-500 text-base ml-4">
              {formatTime(audioPlayer.currentTime)}
            </span>

            {/* Progress Bar */}
            <div 
              className="flex-1 mx-4 relative cursor-pointer" 
              onClick={handleSeek}
            >
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-black rounded-l-full transition-all duration-100"
                  style={{ 
                    width: audioPlayer.duration > 0 
                      ? `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="w-1 h-4 bg-black rounded-full absolute -top-1 transition-all duration-100"
                  style={{ 
                    left: audioPlayer.duration > 0 
                      ? `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>

            {/* Total Time */}
            <span className="text-gray-500 text-base">
              {formatTime(audioPlayer.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <OnboardingLayout
        onNext={handleNext}
        onPrevious={handlePrevious}
        nextButtonText="Next"
        nextDisabled={!selectedVoice}
        showPrevious={true}
        leftAligned={true}
      >
        <div className="flex flex-col gap-8 w-full">
          {/* Header */}
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-xl font-bold text-black">
              What's your preferred AI voice style?
            </h2>
            <p className="text-base italic text-[#737373] leading-6">
              Pick the kind of voice your AI will use on calls.
            </p>
          </div>

          {/* Voice Style Selection */}
          <div className="flex flex-col gap-2 w-full">
            {/* Dropdown Header */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-black transition-colors"
            >
              <span
                className={`text-lg ${selectedVoice ? "text-black" : "text-[#6B7280]"}`}
              >
                {selectedVoiceName || "Select your preferred AI voice style"}
              </span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M18 15C18 15 13.5811 9 12 9C10.4188 9 6 15 6 15"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden bg-white z-10">
                {voices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className="flex items-center justify-between p-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectVoice(voice.voice_id)}
                  >
                    <span className="text-lg text-[#6B7280]">{voice.display_name}</span>
                    <button
                      onClick={(e) => handlePlayVoice(voice.voice_id, e)}
                      className="flex items-center justify-center w-11 h-11 rounded-xl transition-colors bg-black hover:bg-gray-800"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.7425 10.705C15.4479 11.8242 14.0559 12.615 11.2717 14.1968C8.58033 15.7258 7.23466 16.4903 6.15018 16.183C5.70183 16.0559 5.29332 15.8147 4.96386 15.4822C4.16699 14.6782 4.16699 13.1188 4.16699 10C4.16699 6.88117 4.16699 5.32175 4.96386 4.51777C5.29332 4.18538 5.70183 3.94407 6.15018 3.81702C7.23466 3.50971 8.58033 4.27423 11.2717 5.80328C14.0559 7.38498 15.4479 8.17583 15.7425 9.295C15.8641 9.757 15.8641 10.243 15.7425 10.705Z"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </OnboardingLayout>

      {/* Audio Player Popup */}
      {showAudioPlayer && renderAudioPlayerPopup()}
    </>
  );
};