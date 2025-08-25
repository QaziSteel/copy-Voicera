import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const scheduleOptions = [
  { id: "24-7", name: "24/7 (default)" },
  { id: "business-hours", name: "During business hours (8:00am - 05:00pm)" },
  { id: "custom", name: "Custom schedule" },
];

export default function OnboardingStep9() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/step8");
  };

  const handleNext = () => {
    const finalSchedule =
      selectedSchedule === "custom"
        ? customSchedule
        : scheduleOptions.find((s) => s.id === selectedSchedule)?.name;
    if (finalSchedule) {
      sessionStorage.setItem("aiCallSchedule", finalSchedule);
      navigate("/");
    }
  };

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setIsOpen(false);
    if (scheduleId !== "custom") {
      setCustomSchedule("");
    }
  };

  const selectedScheduleName = scheduleOptions.find(
    (s) => s.id === selectedSchedule,
  )?.name;
  const displayValue =
    selectedSchedule === "custom" ? "Custom schedule" : selectedScheduleName;
  const isNextDisabled =
    !selectedSchedule ||
    (selectedSchedule === "custom" && !customSchedule.trim());

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
            When should your AI answer calls?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            We'll make sure it only answers when you want it to.
          </p>
        </div>

        {/* Schedule Selection */}
        <div className="flex flex-col gap-2">
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
                    <div className="flex items-center gap-3 p-3 px-4">
                      <button
                        onClick={() => handleSelectSchedule("custom")}
                        className="text-lg text-[#6B7280] hover:text-black transition-colors"
                      >
                        {schedule.name}
                      </button>
                      <input
                        type="text"
                        value={customSchedule}
                        onChange={(e) => {
                          setCustomSchedule(e.target.value);
                          if (e.target.value) {
                            setSelectedSchedule("custom");
                          }
                        }}
                        placeholder="Enter custom duration"
                        className="flex-1 p-3 border-2 border-[#E5E7EB] rounded-xl text-base placeholder-[#6B7280] focus:outline-none focus:border-black transition-colors"
                      />
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