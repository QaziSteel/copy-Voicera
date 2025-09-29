import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function Confirmations() {
  const [wantsEmailConfirmations, setWantsEmailConfirmations] = useState(true);
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedConfirmations = sessionStorage.getItem("wantsEmailConfirmations");
    if (savedConfirmations) {
      setWantsEmailConfirmations(savedConfirmations === "true");
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/summaries");
  };

  const handleNext = () => {
    sessionStorage.setItem(
      "wantsEmailConfirmations",
      wantsEmailConfirmations.toString(),
    );
    navigate("/onboarding/reminders");
  };

  const handleToggle = () => {
    setWantsEmailConfirmations(!wantsEmailConfirmations);
  };

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={false}
      leftAligned={true}
    >
      <div className="flex flex-col gap-12">
        {/* Question */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-black leading-[22px]">
            Should customers receive booking confirmations by Email?
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
                  wantsEmailConfirmations ? "bg-transparent" : "bg-white"
                }`}
              />
              <div
                className={`w-6 h-6 rounded-full ${
                  wantsEmailConfirmations ? "bg-black" : "bg-transparent"
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