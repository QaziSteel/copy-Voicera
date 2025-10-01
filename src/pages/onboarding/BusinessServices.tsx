import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const hourOptions = ["00 hr", "01 hr", "02 hr", "03 hr", "04 hr"];
const minuteOptions = ["00 min", "15 min", "30 min", "45 min"];

// Placeholder services for each business type
const servicesByBusinessType: Record<string, string[]> = {
  "Hairdressers": ["Hair cut", "Hair color"],
  "Nail Salon": ["Manicure", "Pedicure"],
  "Health Clinic": ["Consultation", "Check-up"],
  "Fitness Studio": ["Personal training", "Group class"],
  "Coaching/Consulting": ["1-on-1 session", "Group workshop"],
  "Physiotherapy": ["Treatment session", "Assessment"],
  "Chiropractor": ["Adjustment", "Consultation"],
};

interface SelectedService {
  businessType: string;
  service: string;
  hours: string;
  minutes: string;
}

export const BusinessServices: React.FC = () => {
  const [businessTypesFromPrevious, setBusinessTypesFromPrevious] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const navigate = useNavigate();

  // Load business types selected on previous page
  useEffect(() => {
    const savedBusinessTypes = sessionStorage.getItem("businessTypes");
    if (savedBusinessTypes) {
      try {
        const parsedTypes = JSON.parse(savedBusinessTypes);
        const typeNames = parsedTypes.map((item: any) => 
          typeof item === 'string' ? item : item.type
        );
        setBusinessTypesFromPrevious(typeNames);
      } catch (error) {
        console.error("Error parsing business types:", error);
      }
    }

    // Load previously saved services
    const savedServices = sessionStorage.getItem("businessServices");
    if (savedServices) {
      try {
        const parsedServices = JSON.parse(savedServices);
        setSelectedServices(parsedServices);
      } catch (error) {
        console.error("Error parsing saved services:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/business-type");
  };

  const handleNext = () => {
    if (selectedServices.length > 0) {
      sessionStorage.setItem("businessServices", JSON.stringify(selectedServices));
      navigate("/onboarding/business-location");
    }
  };

  const handleServiceToggle = (businessType: string, service: string) => {
    setSelectedServices((prev) => {
      const exists = prev.find(item => item.businessType === businessType && item.service === service);
      if (exists) {
        return prev.filter(item => !(item.businessType === businessType && item.service === service));
      } else {
        return [...prev, { businessType, service, hours: "01 hr", minutes: "00 min" }];
      }
    });
  };

  const handleDurationChange = (businessType: string, service: string, field: 'hours' | 'minutes', value: string) => {
    setSelectedServices((prev) =>
      prev.map(item =>
        item.businessType === businessType && item.service === service ? { ...item, [field]: value } : item
      )
    );
  };

  const isNextDisabled = selectedServices.length === 0;

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 md:gap-6 sm:gap-4 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-2 sm:gap-1.5 w-full">
          <h2 className="text-xl md:text-lg sm:text-base font-bold text-foreground">
            Select services and timings
          </h2>
          <p className="text-base md:text-sm sm:text-xs italic text-muted-foreground leading-6 md:leading-5 sm:leading-4">
            Choose your services and set the appointment duration for each.
          </p>
        </div>

        {/* Business Type Sections */}
        <div className="flex flex-col gap-8 w-full">
          {businessTypesFromPrevious.map((businessType) => {
            const services = servicesByBusinessType[businessType] || ["Service 1", "Service 2"];
            
            return (
              <div key={businessType} className="flex flex-col gap-4 w-full">
                {/* Business Type Heading */}
                <h3 className="text-xl md:text-lg sm:text-base font-bold text-foreground">
                  {businessType}
                </h3>
                
                {/* Service Cards */}
                <div className="flex flex-col gap-4 w-full">
                  {services.map((service) => {
                    const isSelected = selectedServices.find(
                      item => item.businessType === businessType && item.service === service
                    );
                    
                    return (
                      <div
                        key={service}
                        className={`flex flex-col p-4 rounded-xl transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#F3F4F6] border-2 border-black"
                            : "bg-[#F3F4F6] border-2 border-transparent hover:border-gray-300"
                        }`}
                        onClick={() => handleServiceToggle(businessType, service)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div
                              className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center ${
                                isSelected ? "border-black bg-black" : "border-[#6B7280]"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  width="8"
                                  height="6"
                                  viewBox="0 0 8 6"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1 3L3 5L7 1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            
                            {/* Service Name */}
                            <span className={`text-lg leading-6 ${
                              isSelected ? "text-black" : "text-[#6B7280]"
                            }`}>
                              {service}
                            </span>
                          </div>
                          
                          {/* Duration Selectors - Only show when selected */}
                          {isSelected && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-[#6B7280]">Duration:</span>
                              <select
                                value={isSelected.hours}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleDurationChange(businessType, service, 'hours', e.target.value);
                                }}
                                className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {hourOptions.map(hour => (
                                  <option key={hour} value={hour}>{hour}</option>
                                ))}
                              </select>
                              <select
                                value={isSelected.minutes}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleDurationChange(businessType, service, 'minutes', e.target.value);
                                }}
                                className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {minuteOptions.map(minute => (
                                  <option key={minute} value={minute}>{minute}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
};