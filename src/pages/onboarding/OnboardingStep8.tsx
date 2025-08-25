import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep8() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [customName, setCustomName] = useState("");
  const [businessName, setBusinessName] = useState("Business Name");
  const navigate = useNavigate();

  useEffect(() => {
    // Get business name from previous steps
    const savedBusinessName = sessionStorage.getItem("businessName");
    if (savedBusinessName) {
      setBusinessName(savedBusinessName);
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/step7");
  };

  const handleNext = () => {
    const finalName =
      selectedOption === "custom"
        ? customName
        : `Your ${businessName} Assistant`;
    if (finalName.trim()) {
      sessionStorage.setItem("aiAssistantName", finalName.trim());
      navigate("/");
    }
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (option !== "custom") {
      setCustomName("");
    }
  };

  const isNextDisabled =
    !selectedOption || (selectedOption === "custom" && !customName.trim());
  const displayValue =
    selectedOption === "business"
      ? `Your ${businessName} Assistant`
      : selectedOption === "custom"
        ? "Custom name"
        : "";

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            What should your AI assistant be called?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Choose a name so customers know who they're talking to.
          </p>
        </div>

        {/* Assistant Name Selection */}
        <div className="flex flex-col gap-2">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-black transition-colors"
          >
            <span
              className={`text-lg ${selectedOption ? "text-black" : "text-[#6B7280]"}`}
            >
              {displayValue || "Select name for your AI assistant"}
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
                d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                stroke="#141B34"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden bg-white z-10">
              {/* Business Name Option */}
              <button
                onClick={() => handleSelectOption("business")}
                className="w-full p-3 px-4 text-left text-lg text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Your {businessName} Assistant
              </button>

              {/* Custom Name Option */}
              <div className="flex items-center gap-3 p-3 px-4">
                <button
                  onClick={() => handleSelectOption("custom")}
                  className="text-lg text-[#6B7280] hover:text-black transition-colors"
                >
                  Custom name
                </button>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    if (e.target.value) {
                      setSelectedOption("custom");
                    }
                  }}
                  placeholder="Enter custom name..."
                  className="flex-1 p-3 border-2 border-[#E5E7EB] rounded-xl text-base placeholder-[#6B7280] focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}