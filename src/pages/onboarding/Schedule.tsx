import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function Schedule() {
  const [selectedOption, setSelectedOption] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const options = [
    "Offer the next available slot",
    "Take a message for you",
    "Add the customer to a waitlist",
  ];

  const handlePrevious = () => {
    navigate("/onboarding/appointment-time");
  };

  const handleNext = () => {
    if (selectedOption) {
      sessionStorage.setItem("scheduleFullAction", selectedOption);
      navigate("/onboarding/faq-intro");
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setShowDropdown(false);
  };

  const isNextDisabled = !selectedOption;

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-12">
        {/* Question */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-black">
            If your schedule is full, what should the AI do?
          </h2>

          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex justify-between items-center w-full p-4 border-2 border-[#E5E7EB] rounded-xl text-left"
            >
              <span
                className={`text-lg ${selectedOption ? "text-black" : "text-[#6B7280]"}`}
              >
                {selectedOption || "Select Options"}
              </span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 border-2 border-[#E5E7EB] rounded-xl bg-white z-10">
                {options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    className="px-4 py-3 text-lg text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer border-b border-[#F3F4F6] last:border-b-0"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}