import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep4() {
  const [primaryLocation, setPrimaryLocation] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load any previously saved location, but ignore old placeholder values
    const savedLocation = sessionStorage.getItem("primaryLocation");
    if (savedLocation && 
        savedLocation !== "350 5th Avenue, Suite 2100, New York, NY 10118" && 
        savedLocation !== "Enter your primary location") {
      setPrimaryLocation(savedLocation);
    } else {
      // Clear old cached values to ensure fresh start
      sessionStorage.removeItem("primaryLocation");
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/step3");
  };

  const handleNext = () => {
    if (primaryLocation.trim()) {
      // Store primary location
      sessionStorage.setItem("primaryLocation", primaryLocation.trim());
      navigate("/onboarding/step5");
    }
  };

  const isNextDisabled = !primaryLocation.trim();

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            Enter your business location?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Provide your business address for accurate scheduling and communication.
          </p>
        </div>

        {/* Primary Location */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-black">Location</h3>
          <input
            type="text"
            value={primaryLocation}
            onChange={(e) => setPrimaryLocation(e.target.value)}
            placeholder="Enter your location"
            className="w-full p-4 text-lg font-semibold text-muted-foreground border-2 border-muted rounded-xl placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}