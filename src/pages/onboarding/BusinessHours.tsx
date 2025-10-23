import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BusinessHours() {
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedHours = sessionStorage.getItem("businessHours");
    if (savedHours) {
      try {
        const parsedHours = JSON.parse(savedHours);
        if (parsedHours.from || parsedHours.fromTime) setFromTime(parsedHours.from || parsedHours.fromTime);
        if (parsedHours.to || parsedHours.toTime) setToTime(parsedHours.to || parsedHours.toTime);
      } catch (error) {
        console.error("Error parsing saved business hours:", error);
      }
    }
  }, []);

  // Generate time options for 24-hour format
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handlePrevious = () => {
    navigate("/onboarding/business-days");
  };

  const handleNext = () => {
    if (fromTime && toTime) {
      sessionStorage.setItem(
        "businessHours",
        JSON.stringify({ from: fromTime, to: toTime }),
      );
      navigate("/onboarding/faq-intro");
    }
  };

  const isNextDisabled = !fromTime || !toTime;

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
            Enter your business hours
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Define your availability so customers know when they can reach you.
          </p>
        </div>


        {/* Time Selection - Full Width */}
        <div className="flex gap-2 w-full">
        {/* From Time */}
        <div className="flex-1">
          <Select value={fromTime} onValueChange={setFromTime}>
            <SelectTrigger className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] rounded-xl bg-transparent text-lg h-auto [&>*:last-child]:hidden">
              <SelectValue placeholder="From" className="text-[#6B7280]" />
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
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg max-h-60 z-50">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} className="text-lg py-3 px-4 hover:bg-[#F3F4F6]">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* To Time */}
        <div className="flex-1">
          <Select value={toTime} onValueChange={setToTime}>
            <SelectTrigger className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] rounded-xl bg-transparent text-lg h-auto [&>*:last-child]:hidden">
              <SelectValue placeholder="To" className="text-[#6B7280]" />
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
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg max-h-60 z-50">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} className="text-lg py-3 px-4 hover:bg-[#F3F4F6]">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}