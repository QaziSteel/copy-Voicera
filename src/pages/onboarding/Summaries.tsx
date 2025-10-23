import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { collectOnboardingDataFromSession, saveOnboardingResponse } from "@/lib/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Summaries() {
  const [wantsDailySummary, setWantsDailySummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const { user } = useAuth();

  // Load saved data on component mount
  useEffect(() => {
    const savedSummary = sessionStorage.getItem("wantsDailySummary");
    if (savedSummary) {
      setWantsDailySummary(savedSummary === "true");
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/integrations");
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      // Save daily summary preference to sessionStorage
      sessionStorage.setItem("wantsDailySummary", wantsDailySummary.toString());

      // Collect all onboarding data from session storage
      const onboardingData = collectOnboardingDataFromSession();

      if (!currentProject?.id) {
        toast.error("No project found. Please create a project first.");
        setIsSubmitting(false);
        return;
      }

      // Save onboarding response to database
      const { data, error } = await saveOnboardingResponse(onboardingData, currentProject.id);

      if (error) {
        console.error("Error saving onboarding response:", error);
        toast.error("Failed to save configuration. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (!data || !data.id) {
        toast.error("Failed to create agent. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const savedAgentId = data.id;

      // Map any existing Google integration to this agent
      if (user?.id) {
        const { error: updateError } = await supabase
          .from('google_integrations')
          .update({ agent_id: savedAgentId })
          .eq('user_id', user.id)
          .is('agent_id', null)
          .eq('is_active', true);

        if (updateError) {
          console.error("Error mapping Google integration:", updateError);
          // Don't block the flow for this error
        }
      }

      toast.success("Configuration saved successfully!");
      navigate("/onboarding/completion");
    } catch (error) {
      console.error("Unexpected error during submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleToggle = () => {
    setWantsDailySummary(!wantsDailySummary);
  };

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isSubmitting}
      leftAligned={true}
      nextButtonText={isSubmitting ? "Saving..." : "Submit"}
    >
      <div className="flex flex-col gap-12">
        {/* Question */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-black leading-[22px]">
            Do you want a daily summary of all calls and bookings?
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
                  wantsDailySummary ? "bg-transparent" : "bg-white"
                }`}
              />
              <div
                className={`w-6 h-6 rounded-full ${
                  wantsDailySummary ? "bg-black" : "bg-transparent"
                }`}
              />
            </button>

            <span className="text-lg font-bold text-[#6B7280] leading-[22px]">
              Yes
            </span>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}