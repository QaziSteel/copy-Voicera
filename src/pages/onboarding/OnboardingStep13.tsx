import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const daysOfWeek = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tues", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thur", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

export default function OnboardingStep13() {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/step12");
  };

  const handleNext = () => {
    if (selectedDays.length > 0) {
      sessionStorage.setItem("businessDays", JSON.stringify(selectedDays));
      navigate("/onboarding/step14");
    }
  };

  const handleDayToggle = (dayShort: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayShort)
        ? prev.filter((d) => d !== dayShort)
        : [...prev, dayShort],
    );
  };

  const isNextDisabled = selectedDays.length === 0;

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            Select your business days
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Choose the days your business is open for customers.
          </p>
        </div>

        {/* Days Selection */}
        <div className="flex gap-3 flex-wrap">
          {daysOfWeek.map((day) => (
            <button
              key={day.short}
              onClick={() => handleDayToggle(day.short)}
              className={`px-4 py-2.5 border-2 rounded-xl text-lg transition-colors ${
                selectedDays.includes(day.short)
                  ? "border-black bg-black text-white"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-400"
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>

        {/* Selected Days Summary */}
        {selectedDays.length > 0 && (
          <div className="mt-4 p-4 bg-[#F3F4F6] rounded-xl">
            <p className="text-sm text-[#6B7280]">
              Selected days: {selectedDays.join(", ")}
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}