import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { collectOnboardingDataFromSession, saveOnboardingResponse } from "@/lib/onboarding";
import { useGoogleIntegration } from "@/hooks/useGoogleIntegration";
import { toast } from "sonner";

export default function Reminders() {
  const [wantsReminders, setWantsReminders] = useState(false);
  const [reminderTiming, setReminderTiming] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { initiateOAuth, integration } = useGoogleIntegration(agentId, true);

  const timingOptions = ["1 hour before", "24 hours before", "Both"];

  const handlePrevious = () => {
    navigate("/onboarding/confirmations");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Save reminder settings to sessionStorage first
      const reminderData = {
        wantsReminders,
        timing: wantsReminders ? reminderTiming : null,
      };
      sessionStorage.setItem("reminderSettings", JSON.stringify(reminderData));
      
      // Collect all onboarding data and save to database
      const onboardingData = collectOnboardingDataFromSession();
      const { data, error } = await saveOnboardingResponse(onboardingData);
      
      if (error) {
        toast.error("Failed to save onboarding data: " + error.message);
        setIsSubmitting(false);
        return;
      }

      // Get the agent ID from the saved response
      const savedAgentId = data?.id;
      if (!savedAgentId) {
        toast.error("Failed to get agent ID");
        setIsSubmitting(false);
        return;
      }

      setAgentId(savedAgentId);

      // Check if calendar integration was selected during onboarding
      const calendarIntegration = sessionStorage.getItem("calendarIntegration");
      const shouldConnectCalendar = calendarIntegration === "true";

      if (shouldConnectCalendar) {
        setIsConnectingCalendar(true);
        toast.success("Onboarding saved! Connecting Google Calendar...");
        
        // Trigger OAuth popup
        initiateOAuth(savedAgentId);
        
        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            setIsConnectingCalendar(false);
            setIsSubmitting(false);
            toast.success("Google Calendar connected successfully!");
            navigate("/onboarding/completion");
          } else if (event.data.type === 'OAUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            setIsConnectingCalendar(false);
            setIsSubmitting(false);
            toast.error("Failed to connect Google Calendar. Please try again.");
          }
        };

        window.addEventListener('message', handleMessage);
        
        // Fallback timeout
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          if (isConnectingCalendar) {
            setIsConnectingCalendar(false);
            setIsSubmitting(false);
            // Still navigate to completion even if OAuth wasn't confirmed
            navigate("/onboarding/completion");
          }
        }, 30000); // 30 second timeout
      } else {
        // No calendar integration needed, proceed directly
        toast.success("Onboarding completed successfully!");
        navigate("/onboarding/completion");
      }
    } catch (error) {
      toast.error("Failed to save onboarding data");
      console.error("Error saving onboarding data:", error);
      setIsSubmitting(false);
      setIsConnectingCalendar(false);
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

  const isNextDisabled = (wantsReminders && !reminderTiming) || isSubmitting || isConnectingCalendar;
  const getButtonText = () => {
    if (isConnectingCalendar) return "Connecting Calendar...";
    if (isSubmitting) return "Saving...";
    return wantsReminders ? "Submit" : "Next";
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