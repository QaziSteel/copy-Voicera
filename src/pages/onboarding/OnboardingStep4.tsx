import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

interface AdditionalLocation {
  id: string;
  value: string;
}

export default function OnboardingStep4() {
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [additionalLocations, setAdditionalLocations] = useState<AdditionalLocation[]>([]);
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

    // Load additional locations
    const savedAdditionalLocations = sessionStorage.getItem("additionalLocations");
    if (savedAdditionalLocations) {
      try {
        const parsed = JSON.parse(savedAdditionalLocations);
        // Filter out any locations with placeholder text
        const validLocations = parsed.filter((loc: AdditionalLocation) => 
          loc.value && !loc.value.startsWith("Enter your")
        );
        setAdditionalLocations(validLocations);
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
      // Store primary location
      sessionStorage.setItem("primaryLocation", primaryLocation.trim());
      
      // Store only non-empty additional locations
      const validLocations = additionalLocations.filter(loc => loc.value.trim());
      sessionStorage.setItem("additionalLocations", JSON.stringify(validLocations));
      
      navigate("/onboarding/step5");
    }
  };

  const handleAddMoreLocations = () => {
    // Add a new location to the list with empty value
    const newLocation: AdditionalLocation = {
      id: `location-${Date.now()}`, // Use timestamp for unique ID
      value: ""
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

  const handleDeleteLocation = (id: string) => {
    const updatedLocations = additionalLocations.filter(location => location.id !== id);
    setAdditionalLocations(updatedLocations);
    sessionStorage.setItem("additionalLocations", JSON.stringify(updatedLocations));
  };

  const getLocationNumber = (index: number): string => {
    const numbers = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    return numbers[index - 1] || `${index}th`;
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

        {/* Additional Locations */}
        {additionalLocations.map((location, index) => (
          <div key={location.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Location {index + 2}</h3>
              <button
                onClick={() => handleDeleteLocation(location.id)}
                className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label={`Delete location ${index + 2}`}
              >
                <Trash2 size={20} />
              </button>
            </div>
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