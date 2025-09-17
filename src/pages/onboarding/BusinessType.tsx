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

export const BusinessType: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/business-name");
  };

  const handleNext = () => {
    if (selectedType || customType) {
      const businessType = selectedType === "Other (Custom)" ? customType : selectedType;
      sessionStorage.setItem("businessType", businessType);
      navigate("/onboarding/business-location");
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
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 md:gap-6 sm:gap-4 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-2 sm:gap-1.5 w-full">
          <h2 className="text-xl md:text-lg sm:text-base font-bold text-foreground">
            What type of business do you run?
          </h2>
          <p className="text-base md:text-sm sm:text-xs italic text-muted-foreground leading-6 md:leading-5 sm:leading-4">
            This helps us personalise your AI agent and suggest common FAQs.
          </p>
        </div>

        {/* Business Type Selection */}
        <div className="flex flex-col gap-2 md:gap-1.5 sm:gap-1 w-full">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 md:p-3 sm:p-2.5 border-2 border-border rounded-xl md:rounded-lg sm:rounded-lg hover:border-foreground transition-colors"
          >
            <span
              className={`text-lg md:text-base sm:text-sm ${selectedType ? "text-foreground" : "text-muted-foreground"}`}
            >
              {(selectedType === "Other (Custom)" && customType) ? customType : selectedType || "Select your business type"}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform md:w-5 md:h-5 sm:w-4 sm:h-4 ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M18 15C18 15 13.5811 9 12 9C10.4188 9 6 15 6 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="border-2 border-border rounded-xl md:rounded-lg sm:rounded-lg overflow-hidden">
              {businessTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelectType(type)}
                  className="w-full p-3 md:p-2.5 sm:p-2 px-4 md:px-3 sm:px-2.5 text-left text-lg md:text-base sm:text-sm text-muted-foreground hover:bg-accent transition-colors"
                >
                  {type}
                </button>
              ))}

              {/* Other Custom Option */}
              <div className="flex items-center gap-3 md:gap-2 sm:gap-1.5 p-3 md:p-2.5 sm:p-2 px-4 md:px-3 sm:px-2.5">
                <button
                  onClick={() => handleSelectType("Other (Custom)")}
                  className="text-lg md:text-base sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                  className="flex-1 p-3 md:p-2.5 sm:p-2 border-2 border-border rounded-xl md:rounded-lg sm:rounded-lg placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors bg-background"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};
