import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { toast } from "sonner";

export default function Reminders() {
  const [wantsReminders, setWantsReminders] = useState(false);
  const [reminderTiming, setReminderTiming] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const timingOptions = ["1 hour before", "24 hours before", "Both"];

  const handlePrevious = () => {
    navigate("/onboarding/confirmations");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Save reminder settings to sessionStorage
      const reminderData = {
        wantsReminders,
        timing: wantsReminders ? reminderTiming : null,
      };
      sessionStorage.setItem("reminderSettings", JSON.stringify(reminderData));
      
      toast.success("Reminder settings saved!");
      
      // Navigate to completion page where webhook process continues
      navigate("/onboarding/completion");
    } catch (error) {
      toast.error("Failed to save reminder settings");
      console.error("Error saving reminder settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = () => {
    setWantsReminders(!wantsReminders);
    if (wantsReminders) {
      setReminderTiming(""); // Reset timing when switching to No
    }
  };

  const handleTimingSelect = (timing: string) => {
    setReminderTiming(timing);
    setShowDropdown(false);
  };

  const isNextDisabled = (wantsReminders && !reminderTiming) || isSubmitting;
  const getButtonText = () => {
    if (isSubmitting) return "Saving...";
    return "Next";
  };

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleSubmit}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      nextButtonText={getButtonText()}
      leftAligned={true}
    >
      <div className="flex flex-col gap-12">
        {/* Main Question */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-black leading-[22px]">
            Would you like your AI to send automatic reminders before each
            appointment?
          </h2>

          {/* Toggle Switch */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[#6B7280] leading-[22px]">
              No
            </span>

            <button
              onClick={handleToggle}
              className="flex p-0.5 items-center rounded-full bg-[#E5E7EB]"
              style={{ width: "52px", height: "28px" }}
            >
              <div
                className={`w-6 h-6 rounded-full ${
                  wantsReminders ? "bg-transparent" : "bg-white"
                }`}
              />
              <div
                className={`w-6 h-6 rounded-full ${
                  wantsReminders ? "bg-black" : "bg-transparent"
                }`}
              />
            </button>

            <span className="text-lg font-bold text-[#6B7280] leading-[22px]">
              Yes
            </span>
          </div>
        </div>

        {/* Conditional Timing Question */}
        {wantsReminders && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-black leading-6">
              When should reminders go out?
            </h3>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex justify-between items-center w-full p-4 border-2 border-[#E5E7EB] rounded-xl text-left bg-white"
              >
                <span
                  className={`text-lg leading-7 ${reminderTiming ? "text-black" : "text-[#6B7280]"}`}
                >
                  {reminderTiming || "Select Options"}
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
                <div className="absolute top-full left-0 right-0 mt-2 border-2 border-[#E5E7EB] rounded-xl bg-white shadow-lg z-50">
                  {timingOptions.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleTimingSelect(option)}
                      className="px-4 py-3 text-lg text-[#6B7280] leading-7 hover:bg-[#F3F4F6] cursor-pointer border-b border-[#F3F4F6] last:border-b-0"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}