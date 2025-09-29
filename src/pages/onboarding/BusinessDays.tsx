import { useState, useEffect } from "react";
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

export default function BusinessDays() {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedDays = sessionStorage.getItem("businessDays");
    if (savedDays) {
      try {
        const parsedDays = JSON.parse(savedDays);
        setSelectedDays(parsedDays);
      } catch (error) {
        console.error("Error parsing saved business days:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/services");
  };

  const handleNext = () => {
    if (selectedDays.length > 0) {
      sessionStorage.setItem("businessDays", JSON.stringify(selectedDays));
      navigate("/onboarding/business-hours");
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
      leftAligned={true}
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
        <div className="grid grid-cols-7 gap-3">
          {daysOfWeek.map((day) => (
            <button
              key={day.short}
              onClick={() => handleDayToggle(day.short)}
              className={`w-full px-4 py-2.5 border-2 rounded-xl text-lg transition-colors ${
                selectedDays.includes(day.short)
                  ? "border-black bg-black text-white"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-400"
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>

      </div>
    </OnboardingLayout>
  );
}