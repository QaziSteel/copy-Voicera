import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const greetingOptions = [
  {
    id: "friendly-casual",
    label: "Friendly & Casual",
    text: "Hi! Thanks for calling [Business Name]. How can I help you today?",
  },
  {
    id: "professional-polite",
    label: "Professional & Polite",
    text: "Good day! You've reached [Business Name]. How may I assist you?",
  },
  {
    id: "warm-reassuring",
    label: "Warm & Reassuring",
    text: "Hello, you're through to [Business Name]. I'm here to help, how can I assist?",
  },
  {
    id: "energetic-enthusiastic",
    label: "Energetic & Enthusiastic",
    text: "Hey there! Thanks for calling [Business Name]! What can we do for you today?",
  },
];

export const Greetings = () => {
  const [selectedGreeting, setSelectedGreeting] = useState("warm-reassuring");
  const [businessName, setBusinessName] = useState("Business Name");
  const navigate = useNavigate();

  useEffect(() => {
    // Get business name and saved greeting selection from session storage
    const savedBusinessName = sessionStorage.getItem("businessName");
    if (savedBusinessName) {
      setBusinessName(savedBusinessName);
    }
    
    const savedGreeting = sessionStorage.getItem("aiGreetingStyle");
    if (savedGreeting) {
      try {
        const parsedGreeting = JSON.parse(savedGreeting);
        setSelectedGreeting(parsedGreeting.id);
      } catch (error) {
        console.error("Error parsing saved greeting:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/voice-style");
  };

  const handleNext = () => {
    if (selectedGreeting) {
      const selectedOption = greetingOptions.find(
        (g) => g.id === selectedGreeting,
      );
      if (selectedOption) {
        sessionStorage.setItem(
          "aiGreetingStyle",
          JSON.stringify({
            id: selectedOption.id,
            label: selectedOption.label,
            text: selectedOption.text.replace("[Business Name]", businessName),
          }),
        );
        // Navigate to next step
        navigate("/onboarding/assistant-name");
      }
    }
  };

  const isNextDisabled = !selectedGreeting;

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 w-full">
          <h2 className="text-xl font-bold text-black">
            How should your AI greet callers?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Pick the style that fits your business best. You can edit it later.
          </p>
        </div>

        {/* Greeting Options */}
        <div className="flex flex-col gap-4 w-full">
          {greetingOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedGreeting(option.id)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                selectedGreeting === option.id
                  ? "bg-[#F3F4F6] border-2 border-[#6B7280]"
                  : "bg-[#F3F4F6] border-2 border-transparent hover:border-gray-300"
              }`}
            >
              {/* Radio Button */}
              <div
                className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${
                  selectedGreeting === option.id
                    ? "border-black bg-black"
                    : "border-[#6B7280]"
                }`}
              >
                {selectedGreeting === option.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <span
                  className={`text-lg leading-6 ${
                    selectedGreeting === option.id
                      ? "text-black"
                      : "text-[#6B7280]"
                  }`}
                >
                  <strong>{option.label}:</strong> "
                  {option.text.replace("[Business Name]", businessName)}"
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Greetings;