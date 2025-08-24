import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const businessTypes = [
  "Hairdressers",
  "Nail Salon", 
  "Health Clinic",
  "Fitness Studio",
  "Coaching/Consulting",
  "Physiotherapy",
  "Chiropractor",
];

export const OnboardingStep2: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/step1");
  };

  const handleNext = () => {
    if (selectedType || customType) {
      const businessType = selectedType === "Other (Custom)" ? customType : selectedType;
      sessionStorage.setItem("businessType", businessType);
      navigate("/onboarding/step3");
    }
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setIsOpen(false);
    if (type !== "Other (Custom)") {
      setCustomType("");
    }
  };

  const isNextDisabled = !selectedType && !customType;

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      completionPercentage={26}
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            What type of business do you run?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            This helps us personalise your AI agent and suggest common FAQs.
          </p>
        </div>

        {/* Business Type Selection */}
        <div className="flex flex-col gap-2">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-black transition-colors"
          >
            <span
              className={`text-lg ${selectedType ? "text-black" : "text-[#6B7280]"}`}
            >
              {selectedType || "Select your business type"}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          {isOpen && (
            <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
              {businessTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelectType(type)}
                  className="w-full p-3 px-4 text-left text-lg text-[#6B7280] hover:bg-gray-50 transition-colors"
                >
                  {type}
                </button>
              ))}

              {/* Other Custom Option */}
              <div className="flex items-center gap-3 p-3 px-4">
                <button
                  onClick={() => handleSelectType("Other (Custom)")}
                  className="text-lg text-[#6B7280] hover:text-black transition-colors"
                >
                  Other (Custom)
                </button>
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => {
                    setCustomType(e.target.value);
                    if (e.target.value) {
                      setSelectedType("Other (Custom)");
                    }
                  }}
                  placeholder="Enter your business type..."
                  className="flex-1 p-3 border-2 border-[#E5E7EB] rounded-xl placeholder-[#6B7280] focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};