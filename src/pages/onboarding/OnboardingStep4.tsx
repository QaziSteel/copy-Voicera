import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep4() {
  const [primaryLocation, setPrimaryLocation] = useState(
    "Enter your primary location",
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Load any previously saved location
    const savedLocation = sessionStorage.getItem("primaryLocation");
    if (savedLocation) {
      setPrimaryLocation(savedLocation);
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/step3");
  };

  const handleNext = () => {
    if (primaryLocation.trim()) {
      // Store the primary location
      sessionStorage.setItem("primaryLocation", primaryLocation.trim());
      navigate("/onboarding/step5");
    }
  };

  const handleAddMoreLocations = () => {
    // Navigate directly to step 5 to add more locations
    if (primaryLocation.trim()) {
      sessionStorage.setItem("primaryLocation", primaryLocation.trim());
      navigate("/onboarding/step5");
    }
  };

  const isNextDisabled = !primaryLocation.trim();

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      completionPercentage={18}
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            Enter your business locations?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Provide your business addresses for accurate scheduling and communication.
          </p>
        </div>

        {/* Primary Location */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-black">Primary location</h3>
          <input
            type="text"
            value={primaryLocation}
            onChange={(e) => setPrimaryLocation(e.target.value)}
            placeholder="Enter your primary location"
            className="w-full p-4 text-lg font-semibold text-muted-foreground border-2 border-muted rounded-xl placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Add More Locations Button */}
        <button
          onClick={handleAddMoreLocations}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors self-start"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.00001 1V11M11 6.0007H1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-semibold">Add more locations</span>
        </button>
      </div>
    </OnboardingLayout>
  );
}