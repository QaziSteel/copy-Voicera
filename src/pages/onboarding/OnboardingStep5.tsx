import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

enum AIConfigPhase {
  INTRO = 'intro',
  VOICE_SELECTION = 'voice_selection'
}

const voiceOptions = [
  { id: "friendly-female", name: "Friendly Female" },
  { id: "professional-female", name: "Professional Female" },
  { id: "casual-male", name: "Casual Male" },
  { id: "energetic-male", name: "Energetic Male" },
];

export const OnboardingStep5: React.FC = () => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<AIConfigPhase>(AIConfigPhase.INTRO);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleNext = () => {
    if (currentPhase === AIConfigPhase.INTRO) {
      setCurrentPhase(AIConfigPhase.VOICE_SELECTION);
    } else if (currentPhase === AIConfigPhase.VOICE_SELECTION && selectedVoice) {
      sessionStorage.setItem("aiVoiceStyle", selectedVoice);
      navigate("/dashboard");
    }
  };

  const handlePrevious = () => {
    if (currentPhase === AIConfigPhase.VOICE_SELECTION) {
      setCurrentPhase(AIConfigPhase.INTRO);
    } else {
      navigate("/onboarding/step4");
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setIsDropdownOpen(false);
  };

  const handlePlayVoice = (voiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log(`Playing voice sample for: ${voiceId}`);
  };

  const getCompletionPercentage = () => {
    return currentPhase === AIConfigPhase.INTRO ? 80 : 90;
  };

  const getNextButtonText = () => {
    if (currentPhase === AIConfigPhase.INTRO) return "Let's go";
    return "Complete Setup";
  };

  const isNextDisabled = () => {
    return currentPhase === AIConfigPhase.VOICE_SELECTION && !selectedVoice;
  };

  const selectedVoiceName = voiceOptions.find(v => v.id === selectedVoice)?.name;

  const renderIntroPhase = () => (
    <div className="flex flex-col items-center gap-8">
      {/* Robot Icon */}
      <div className="flex items-center justify-center w-20 h-20 bg-[#F3F4F6] border-[1.25px] border-[#E5E7EB] rounded-full">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M31.6663 26.6668V23.3335C31.6663 18.6195 31.6663 16.2624 30.2018 14.798C28.7373 13.3335 26.3803 13.3335 21.6663 13.3335H18.333C13.619 13.3335 11.2619 13.3335 9.79747 14.798C8.33301 16.2624 8.33301 18.6195 8.33301 23.3335V26.6668C8.33301 31.3808 8.33301 33.7378 9.79747 35.2023C11.2619 36.6668 13.619 36.6668 18.333 36.6668H21.6663C26.3803 36.6668 28.7373 36.6668 30.2018 35.2023C31.6663 33.7378 31.6663 31.3808 31.6663 26.6668Z"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinejoin="round"
          />
          <path
            d="M31.667 30C34.024 30 35.2025 30 35.9348 29.2678C36.667 28.5355 36.667 27.357 36.667 25C36.667 22.643 36.667 21.4645 35.9348 20.7322C35.2025 20 34.024 20 31.667 20"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinejoin="round"
          />
          <path
            d="M8.33301 30C5.97599 30 4.79747 30 4.06524 29.2678C3.33301 28.5355 3.33301 27.357 3.33301 25C3.33301 22.643 3.33301 21.4645 4.06524 20.7322C4.79747 20 5.97599 20 8.33301 20"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinejoin="round"
          />
          <path
            d="M22.5 5.8335C22.5 7.21421 21.3807 8.3335 20 8.3335C18.6193 8.3335 17.5 7.21421 17.5 5.8335C17.5 4.45278 18.6193 3.3335 20 3.3335C21.3807 3.3335 22.5 4.45278 22.5 5.8335Z"
            stroke="#141B34"
            strokeWidth="1.875"
          />
          <path
            d="M20 8.3335V13.3335"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.667 21.6665V23.3332"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 21.6665V23.3332"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.667 29.1665C16.667 29.1665 17.7782 29.9998 20.0003 29.9998C22.2225 29.9998 23.3337 29.1665 23.3337 29.1665"
            stroke="#141B34"
            strokeWidth="1.875"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-bold text-black">
            Give Your AI Its Personality
          </h2>
          <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7">
            Let's make your AI sound the way you want.
          </p>
        </div>
      </div>
    </div>
  );

  const renderVoiceSelectionPhase = () => (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-black">
          What's your preferred AI voice style?
        </h2>
        <p className="text-base italic text-[#737373] leading-6">
          Pick the kind of voice your AI will use on calls.
        </p>
      </div>

      {/* Voice Style Selection */}
      <div className="flex flex-col gap-2">
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
          <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
            {voiceOptions.map((voice) => (
              <div
                key={voice.id}
                className="flex items-center justify-between p-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleSelectVoice(voice.id)}
              >
                <span className="text-lg text-[#6B7280]">{voice.name}</span>
                <button
                  onClick={(e) => handlePlayVoice(voice.id, e)}
                  className="flex items-center justify-center w-11 h-11 bg-black rounded-xl hover:bg-gray-800 transition-colors"
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
  );

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      completionPercentage={getCompletionPercentage()}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText={getNextButtonText()}
      nextDisabled={isNextDisabled()}
      showPrevious={true}
    >
      {currentPhase === AIConfigPhase.INTRO ? renderIntroPhase() : renderVoiceSelectionPhase()}
    </OnboardingLayout>
  );
};