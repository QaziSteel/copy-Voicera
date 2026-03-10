import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  LocationMapPicker,
  type LocationValue,
} from "@/components/onboarding/LocationMapPicker";

export default function BusinessLocation() {
  const [locationValue, setLocationValue] = useState<LocationValue | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const savedLocation = sessionStorage.getItem("primaryLocation");
    if (
      savedLocation &&
      savedLocation !== "350 5th Avenue, Suite 2100, New York, NY 10118" &&
      savedLocation !== "Enter your primary location"
    ) {
      setLocationValue({ address: savedLocation });
    } else {
      sessionStorage.removeItem("primaryLocation");
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/business-services");
  };

  const handleNext = () => {
    const address = locationValue?.address?.trim();
    if (address) {
      sessionStorage.setItem("primaryLocation", address);
      navigate("/onboarding/contact-number");
    }
  };

  const handleLocationChange = useCallback((value: LocationValue) => {
    setLocationValue(value);
  }, []);

  const primaryLocation = locationValue?.address ?? "";
  const isNextDisabled = !primaryLocation.trim();

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-3 w-full">
          <h2 className="text-xl font-bold text-black">
            Enter your business location?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Provide your business address for accurate scheduling and
            communication.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <h3 className="text-xl font-bold text-black">Location</h3>
          <LocationMapPicker
            value={locationValue}
            onChange={handleLocationChange}
            placeholder="Search for an address or click on the map"
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}
