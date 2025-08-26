import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep17() {
  const [selectedFAQs, setSelectedFAQs] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswers, setCustomAnswers] = useState<{ [key: string]: string }>(
    {},
  );
  const [customFAQs, setCustomFAQs] = useState<string[]>([]);
  const navigate = useNavigate();

  const predefinedFAQs = [
    "What are your prices?",
    "Where are you located?",
    "What are your opening hours?",
  ];

  const handlePrevious = () => {
    navigate("/onboarding/step16");
  };

  const handleNext = () => {
    const faqData = {
      selectedFAQs,
      customAnswers,
    };
    sessionStorage.setItem("faqData", JSON.stringify(faqData));
    navigate("/onboarding/integrations-intro");
  };

  const handleFAQToggle = (faq: string) => {
    setSelectedFAQs((prev) => {
      if (prev.includes(faq)) {
        // Remove FAQ and its answer
        const newCustomAnswers = { ...customAnswers };
        delete newCustomAnswers[faq];
        setCustomAnswers(newCustomAnswers);
        return prev.filter((item) => item !== faq);
      } else {
        return [...prev, faq];
      }
    });
  };

  const handleAnswerChange = (faq: string, answer: string) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [faq]: answer,
    }));
  };

  const handleAddCustomFAQ = () => {
    if (customQuestion.trim()) {
      setCustomFAQs((prev) => [...prev, customQuestion.trim()]);
      setSelectedFAQs((prev) => [...prev, customQuestion.trim()]);
      setCustomQuestion("");
    }
  };

  // Combine predefined and custom FAQs for rendering
  const allFAQs = [...predefinedFAQs, ...customFAQs];

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={selectedFAQs.length === 0}
    >
      <div className="flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-black leading-[22px]">
            Which questions should your AI answer?
          </h2>
          <p className="text-base italic text-[#737373] leading-6 tracking-[-0.096px]">
            Choose from popular FAQs or add your own.
          </p>
        </div>

        {/* FAQ Options */}
        <div className="flex flex-col gap-3">
          {allFAQs.map((faq) => (
            <div key={faq} className="space-y-3">
              {/* Checkbox */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFAQToggle(faq)}
                  className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center ${
                    selectedFAQs.includes(faq)
                      ? "border-black bg-black"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                >
                  {selectedFAQs.includes(faq) && (
                    <div className="w-5 h-5 bg-black rounded-sm"></div>
                  )}
                </button>
                <span className="text-lg text-black leading-7">{faq}</span>
              </div>

              {/* Answer Input */}
              {selectedFAQs.includes(faq) && (
                <div className="ml-9">
                  <input
                    type="text"
                    placeholder="Enter your answer..."
                    value={customAnswers[faq] || ""}
                    onChange={(e) => handleAnswerChange(faq, e.target.value)}
                    className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg text-[#6B7280] placeholder-[#6B7280] focus:outline-none focus:text-black"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Custom FAQ Input */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter your question..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full p-4 bg-[#F3F4F6] rounded-xl text-lg text-[#6B7280] placeholder-[#6B7280] focus:outline-none focus:text-black"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomFAQ();
                }
              }}
            />

            <button
              onClick={handleAddCustomFAQ}
              disabled={!customQuestion.trim()}
              className="flex items-center justify-center gap-3 px-5 py-[14px] bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.00001 1V11M11 6.0007H1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-bold leading-[18px]">
                Add custom FAQs
              </span>
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}