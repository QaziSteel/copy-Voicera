import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

interface AdditionalLocation {
  id: string;
  value: string;
}

export default function OnboardingStep4() {
  const [primaryLocation, setPrimaryLocation] = useState(
    "Enter your primary location",
  );
  const [additionalLocations, setAdditionalLocations] = useState<AdditionalLocation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load any previously saved location, but ignore old placeholder values
    const savedLocation = sessionStorage.getItem("primaryLocation");
    if (savedLocation && savedLocation !== "350 5th Avenue, Suite 2100, New York, NY 10118") {
      setPrimaryLocation(savedLocation);
    } else {
      // Clear old cached values to ensure fresh start
      sessionStorage.removeItem("primaryLocation");
    }

    // Load additional locations
    const savedAdditionalLocations = sessionStorage.getItem("additionalLocations");
    if (savedAdditionalLocations) {
      try {
        setAdditionalLocations(JSON.parse(savedAdditionalLocations));
      } catch (error) {
        console.error("Error parsing additional locations:", error);
        sessionStorage.removeItem("additionalLocations");
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/step3");
  };

  const handleNext = () => {
    if (primaryLocation.trim()) {
      // Store all locations
      sessionStorage.setItem("primaryLocation", primaryLocation.trim());
      sessionStorage.setItem("additionalLocations", JSON.stringify(additionalLocations));
      navigate("/onboarding/step5");
    }
  };

  const handleAddMoreLocations = () => {
    // Add a new location to the list
    const newLocation: AdditionalLocation = {
      id: `location-${additionalLocations.length + 2}`,
      value: `Enter your ${getLocationNumber(additionalLocations.length + 2)} location`
    };
    setAdditionalLocations([...additionalLocations, newLocation]);
  };

  const handleAdditionalLocationChange = (id: string, value: string) => {
    setAdditionalLocations(locations => 
      locations.map(location => 
        location.id === id ? { ...location, value } : location
      )
    );
  };

  const getLocationNumber = (index: number): string => {
    const numbers = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    return numbers[index - 1] || `${index}th`;
  };

  const isNextDisabled = !primaryLocation.trim() || primaryLocation === "Enter your primary location";

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

        {/* Additional Locations */}
        {additionalLocations.map((location, index) => (
          <div key={location.id} className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-black">Location {index + 2}</h3>
            <input
              type="text"
              value={location.value}
              onChange={(e) => handleAdditionalLocationChange(location.id, e.target.value)}
              placeholder={`Enter your ${getLocationNumber(index + 2)} location`}
              className="w-full p-4 text-lg font-semibold text-muted-foreground border-2 border-muted rounded-xl placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        ))}

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