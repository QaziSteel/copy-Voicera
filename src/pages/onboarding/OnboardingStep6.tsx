import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

const voiceOptions = [
  { id: "friendly-female", name: "Friendly Female" },
  { id: "professional-female", name: "Professional Female" },
  { id: "casual-male", name: "Casual Male" },
  { id: "energetic-male", name: "Energetic Male" },
];

export const OnboardingStep6: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleNext = () => {
    if (selectedVoice) {
      sessionStorage.setItem("aiVoiceStyle", selectedVoice);
      navigate("/dashboard");
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/step5");
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setIsDropdownOpen(false);
  };

  const handlePlayVoice = (voiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log(`Playing voice sample for: ${voiceId}`);
  };

  const selectedVoiceName = voiceOptions.find(v => v.id === selectedVoice)?.name;

  return (
    <OnboardingLayout
      step={6}
      totalSteps={6}
      completionPercentage={100}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText="Complete Setup"
      nextDisabled={!selectedVoice}
      showPrevious={true}
    >
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
    </OnboardingLayout>
  );
};