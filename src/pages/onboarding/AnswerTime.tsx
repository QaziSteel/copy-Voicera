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


const scheduleOptions = [
  { id: "24-7", name: "24/7 (default)" },
  { id: "business-hours", name: "During business hours (8:00am - 5:00pm)" },
  { id: "custom", name: "Custom schedule" },
];

export default function AnswerTime() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [customFromTime, setCustomFromTime] = useState("");
  const [customToTime, setCustomToTime] = useState("");
  const navigate = useNavigate();

  // Generate time options (00:00 to 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedSchedule = sessionStorage.getItem("aiCallSchedule");
    if (savedSchedule) {
      const scheduleOption = scheduleOptions.find(opt => opt.name === savedSchedule);
      if (scheduleOption) {
        setSelectedSchedule(scheduleOption.id);
      } else {
        // Handle custom schedule - parse the time range
        setSelectedSchedule("custom");
        // Expected format: "HH:MM - HH:MM" or "From HH:MM - To HH:MM"
        const timeMatch = savedSchedule.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
          setCustomFromTime(timeMatch[1]);
          setCustomToTime(timeMatch[2]);
        }
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/assistant-name");
  };

  const handleNext = () => {
    const finalSchedule =
      selectedSchedule === "custom"
        ? `${customFromTime} - ${customToTime}`
        : scheduleOptions.find((s) => s.id === selectedSchedule)?.name;
    if (finalSchedule) {
      sessionStorage.setItem("aiCallSchedule", finalSchedule);
      navigate("/onboarding/booking-intro");
    }
  };

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setIsOpen(false);
    if (scheduleId !== "custom") {
      setCustomFromTime("");
      setCustomToTime("");
    }
  };

  const selectedScheduleName = scheduleOptions.find(
    (s) => s.id === selectedSchedule,
  )?.name;
  const displayValue =
    selectedSchedule === "custom" && customFromTime && customToTime
      ? `${customFromTime} - ${customToTime}`
      : selectedScheduleName;
  const isNextDisabled =
    !selectedSchedule ||
    (selectedSchedule === "custom" && (!customFromTime || !customToTime));

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
            When should your AI answer calls?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            We'll make sure it only answers when you want it to.
          </p>
        </div>

        {/* Schedule Selection - Full Width */}
        <div className="flex flex-col gap-2 w-full">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-black transition-colors"
        >
          <span
            className={`text-lg ${selectedSchedule ? "text-black" : "text-[#6B7280]"}`}
          >
            {displayValue || "Select when you want your AI to answer calls"}
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
            {scheduleOptions.map((schedule) => (
              <div key={schedule.id}>
                {schedule.id === "custom" ? (
                  <div className="flex flex-col gap-3 p-4">
                    <span className="text-lg text-[#6B7280]">
                      {schedule.name}
                    </span>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={customFromTime}
                          onValueChange={(value) => {
                            setCustomFromTime(value);
                            setSelectedSchedule("custom");
                          }}
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

                      <div className="flex-1">
                        <Select
                          value={customToTime}
                          onValueChange={(value) => {
                            setCustomToTime(value);
                            setSelectedSchedule("custom");
                          }}
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
                ) : (
                  <button
                    onClick={() => handleSelectSchedule(schedule.id)}
                    className="w-full p-3 px-4 text-left text-lg text-[#6B7280] hover:bg-gray-50 transition-colors"
                  >
                    {schedule.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </OnboardingLayout>
  );
}