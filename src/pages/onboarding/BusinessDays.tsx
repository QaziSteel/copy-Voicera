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
  const [dayHours, setDayHours] = useState<Record<string, { from: string; to: string }>>({});
  const navigate = useNavigate();

  // Generate time options for 24-hour format
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedDays = sessionStorage.getItem("businessDays");
    const savedHours = sessionStorage.getItem("businessHours");
    
    if (savedDays) {
      try {
        const parsedDays = JSON.parse(savedDays);
        setSelectedDays(parsedDays);
      } catch (error) {
        console.error("Error parsing saved business days:", error);
      }
    }
    
    if (savedHours) {
      try {
        const parsedHours = JSON.parse(savedHours);
        setDayHours(parsedHours);
      } catch (error) {
        console.error("Error parsing saved business hours:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/booking-intro");
  };

  const handleNext = () => {
    if (selectedDays.length > 0 && isAllDaysHaveHours()) {
      sessionStorage.setItem("businessDays", JSON.stringify(selectedDays));
      sessionStorage.setItem("businessHours", JSON.stringify(dayHours));
      navigate("/onboarding/faq-intro");
    }
  };

  const handleDayToggle = (dayShort: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayShort)) {
        // Remove day and its hours
        const newDayHours = { ...dayHours };
        delete newDayHours[dayShort];
        setDayHours(newDayHours);
        return prev.filter((d) => d !== dayShort);
      } else {
        // Add day - hours will be set separately
        return [...prev, dayShort];
      }
    });
  };

  const handleTimeChange = (day: string, field: 'from' | 'to', value: string) => {
    setDayHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const isAllDaysHaveHours = () => {
    return selectedDays.every((day) => {
      const hours = dayHours[day];
      return hours && hours.from && hours.to;
    });
  };

  const isNextDisabled = selectedDays.length === 0 || !isAllDaysHaveHours();

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
            Select your business days and hours
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Choose the days your business is open and set the hours for each day.
          </p>
        </div>

        {/* Days Selection */}
        <div className="grid grid-cols-7 gap-3 w-full">
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

        {/* Hours Selection for Selected Days */}
        {selectedDays.length > 0 && (
          <div className="flex flex-col gap-4 w-full">
            <h3 className="text-base font-semibold text-black">
              Set hours for each day:
            </h3>
            {selectedDays.map((dayShort) => {
              const dayFull = daysOfWeek.find((d) => d.short === dayShort)?.full || dayShort;
              const hours = dayHours[dayShort] || { from: "", to: "" };
              
              return (
                <div key={dayShort} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[#6B7280]">{dayFull}</p>
                  <div className="flex gap-2 w-full">
                    {/* From Time */}
                    <div className="flex-1">
                      <Select 
                        value={hours.from} 
                        onValueChange={(value) => handleTimeChange(dayShort, 'from', value)}
                      >
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
                      <Select 
                        value={hours.to} 
                        onValueChange={(value) => handleTimeChange(dayShort, 'to', value)}
                      >
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
              );
            })}
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}
