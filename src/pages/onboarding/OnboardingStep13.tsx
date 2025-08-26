import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep13() {
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/step12");
  };

  const handleNext = () => {
    if (fromTime && toTime) {
      sessionStorage.setItem(
        "businessHours",
        JSON.stringify({ from: fromTime, to: toTime }),
      );
      navigate("/");
    }
  };

  const isNextDisabled = !fromTime || !toTime;

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
            Enter your business hours
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Define your availability so customers know when they can reach you.
          </p>
        </div>

        {/* Time Selection */}
        <div className="flex gap-3">
          {/* From Time */}
          <div className="flex-1">
            <div className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] rounded-xl">
              <input
                type={fromTime ? "time" : "text"}
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                onFocus={(e) => e.target.type = "time"}
                placeholder="From"
                className="text-lg text-[#6B7280] bg-transparent focus:outline-none focus:text-black flex-1"
              />
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 6.75V12H17.25"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* To Time */}
          <div className="flex-1">
            <div className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] rounded-xl">
              <input
                type={toTime ? "time" : "text"}
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                onFocus={(e) => e.target.type = "time"}
                placeholder="To"
                className="text-lg text-[#6B7280] bg-transparent focus:outline-none focus:text-black flex-1"
              />
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 6.75V12H17.25"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {!toTime && (
              <label className="block text-lg text-[#6B7280] mt-2 px-4">
                To
              </label>
            )}
          </div>
        </div>

        {/* Hours Summary */}
        {fromTime && toTime && (
          <div className="p-4 bg-[#F3F4F6] rounded-xl">
            <p className="text-sm text-[#6B7280]">
              Business hours: {fromTime} - {toTime}
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}