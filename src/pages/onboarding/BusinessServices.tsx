import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";

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
  const [customServiceInputs, setCustomServiceInputs] = useState<Record<string, string[]>>({});
  const [manuallyCheckedCustomServices, setManuallyCheckedCustomServices] = useState<Record<string, Set<number>>>({});
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
    // Collect services from custom inputs that aren't already in selectedServices
    const customServices = Object.entries(customServiceInputs).flatMap(([businessType, inputs]) =>
      inputs
        .filter(input => input.trim() !== '')
        .map(input => ({
          businessType,
          service: input.trim(),
          hours: "01 hr",
          minutes: "00 min"
        }))
    );

    // Merge and deduplicate services
    const serviceMap = new Map<string, SelectedService>();
    
    // Add predefined selected services first
    selectedServices.forEach(service => {
      const key = `${service.businessType}::${service.service}`;
      serviceMap.set(key, service);
    });
    
    // Add custom services only if they don't already exist
    customServices.forEach(service => {
      const key = `${service.businessType}::${service.service}`;
      if (!serviceMap.has(key)) {
        serviceMap.set(key, service);
      }
    });
    
    const allSelectedServices = Array.from(serviceMap.values());

    if (allSelectedServices.length > 0) {
      // Save for backward compatibility
      sessionStorage.setItem("businessServices", JSON.stringify(allSelectedServices));
      
      // Save in format expected by onboarding system
      const servicesForOnboarding = allSelectedServices.map(s => ({
        businessType: s.businessType,
        type: s.service,
        hours: s.hours,
        minutes: s.minutes
      }));
      sessionStorage.setItem("services", JSON.stringify(servicesForOnboarding));
      
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

  const handleCustomInputChange = (businessType: string, index: number, value: string) => {
    setCustomServiceInputs(prev => {
      const currentInputs = prev[businessType] || [''];
      const newInputs = [...currentInputs];
      newInputs[index] = value;
      
      // If this is the last item and it now has text, add a new empty slot
      // But only if there isn't already an empty slot at the end
      const hasEmptySlot = newInputs.some((input, i) => i !== index && input.trim() === '');
      if (index === currentInputs.length - 1 && value.trim() && !hasEmptySlot) {
        newInputs.push('');
      }
      
      return { ...prev, [businessType]: newInputs };
    });
    
    // Auto-check when typing starts
    if (value.trim().length > 0 && !(manuallyCheckedCustomServices[businessType]?.has(index) ?? false)) {
      setManuallyCheckedCustomServices(prev => {
        const newMap = { ...prev };
        const currentSet = new Set<number>(prev[businessType] || new Set<number>());
        currentSet.add(index);
        newMap[businessType] = currentSet;
        return newMap;
      });
    }
    
    // Auto-uncheck if user deletes all text
    if (value.trim().length === 0) {
      setManuallyCheckedCustomServices(prev => {
        const newMap = { ...prev };
        const currentSet = new Set<number>(prev[businessType] || new Set<number>());
        currentSet.delete(index);
        newMap[businessType] = currentSet;
        return newMap;
      });
      
      // Remove duplicate empty slots - keep only one at the end
      setCustomServiceInputs(prev => {
        const currentInputs = prev[businessType] || [''];
        const filledInputs = currentInputs.filter(input => input.trim().length > 0);
        const emptyCount = currentInputs.filter(input => input.trim().length === 0).length;
        
        if (emptyCount > 1) {
          // Keep all filled inputs + one empty slot at the end
          const newMap = { ...prev, [businessType]: [...filledInputs, ''] };
          
          // Clean up manuallyCheckedCustomServices for removed indexes
          setManuallyCheckedCustomServices(prevChecked => {
            const newCheckedMap = { ...prevChecked };
            const newCheckedSet = new Set<number>();
            filledInputs.forEach((_, idx) => {
              if (prevChecked[businessType]?.has(idx)) {
                newCheckedSet.add(idx);
              }
            });
            newCheckedMap[businessType] = newCheckedSet;
            return newCheckedMap;
          });
          
          return newMap;
        }
        return prev;
      });
    }
  };

  const handleCustomServiceAdd = (businessType: string, serviceName: string) => {
    if (serviceName.trim()) {
      const customServiceName = serviceName.trim();
      const exists = selectedServices.find(
        item => item.businessType === businessType && item.service === customServiceName
      );
      if (!exists) {
        setSelectedServices(prev => [
          ...prev, 
          { businessType, service: customServiceName, hours: "01 hr", minutes: "00 min" }
        ]);
      }
    }
  };

  const handleCustomServiceRemove = (businessType: string, index: number, serviceName: string) => {
    // Remove from inputs
    setCustomServiceInputs(prev => {
      const currentInputs = prev[businessType] || [''];
      const newInputs = currentInputs.filter((_, i) => i !== index);
      // Always keep at least one empty slot
      if (newInputs.length === 0 || newInputs.every(input => input.trim())) {
        newInputs.push('');
      }
      return { ...prev, [businessType]: newInputs };
    });
    
    // Remove from manually checked state
    setManuallyCheckedCustomServices(prev => {
      const newMap = { ...prev };
      const currentSet = new Set<number>(prev[businessType] || new Set<number>());
      currentSet.delete(index);
      newMap[businessType] = currentSet;
      return newMap;
    });
    
    // Remove from selected services
    if (serviceName.trim()) {
      setSelectedServices(prev => 
        prev.filter(item => !(item.businessType === businessType && item.service === serviceName.trim()))
      );
    }
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
            const services = servicesByBusinessType[businessType] || [];
            
            return (
              <div key={businessType} className="flex flex-col gap-4 w-full">
                {/* Business Type Heading */}
                <h3 className="text-xl md:text-lg sm:text-base font-bold text-foreground">
                  {businessType}
                </h3>
                
                {/* Service Cards */}
                <div className="flex flex-col gap-4 w-full">
                  {services.length > 0 && services.map((service) => {
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

                  {/* Custom Service Cards */}
                  {(customServiceInputs[businessType] || ['']).map((customInput, index) => {
                    const isSelected = customInput.trim().length > 0 || 
                                       (manuallyCheckedCustomServices[businessType]?.has(index) ?? false);
                    const customService = isSelected ? selectedServices.find(
                      item => item.businessType === businessType && item.service === customInput.trim()
                    ) : null;
                    
                    return (
                      <div
                        key={index}
                        className={`flex flex-col p-4 rounded-xl transition-colors ${
                          isSelected
                            ? "bg-[#F3F4F6] border-2 border-black"
                            : "bg-[#F3F4F6] border-2 border-transparent hover:border-gray-300"
                        }`}
                      >
                        {/* Checkbox and Label Row */}
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div
                              className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center cursor-pointer ${
                                isSelected ? "border-black bg-black" : "border-[#6B7280]"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  // If has text, clear it
                                  if (customInput.trim().length > 0) {
                                    handleCustomServiceRemove(businessType, index, customInput);
                                  }
                                  // Remove from manually checked set
                                  setManuallyCheckedCustomServices(prev => {
                                    const newMap = { ...prev };
                                    const currentSet = new Set<number>(prev[businessType] || new Set<number>());
                                    currentSet.delete(index);
                                    newMap[businessType] = currentSet;
                                    return newMap;
                                  });
                                } else {
                                  // Check the box manually
                                  setManuallyCheckedCustomServices(prev => {
                                    const newMap = { ...prev };
                                    const currentSet = new Set<number>(prev[businessType] || new Set<number>());
                                    currentSet.add(index);
                                    newMap[businessType] = currentSet;
                                    return newMap;
                                  });
                                }
                              }}
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
                            
                            {/* Label */}
                            <span className={`text-lg leading-6 ${
                              isSelected ? "text-black" : "text-[#6B7280]"
                            }`}>
                              Other (Custom Service)
                            </span>
                          </div>
                          
                          {/* Duration Selectors - Show when custom input has text */}
                          {customService && (
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <span className="text-sm text-[#6B7280]">Duration:</span>
                              <select
                                value={customService.hours}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleDurationChange(businessType, customInput.trim(), 'hours', e.target.value);
                                }}
                                className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground z-10"
                              >
                                {hourOptions.map(hour => (
                                  <option key={hour} value={hour}>{hour}</option>
                                ))}
                              </select>
                              <select
                                value={customService.minutes}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleDurationChange(businessType, customInput.trim(), 'minutes', e.target.value);
                                }}
                                className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground z-10"
                              >
                                {minuteOptions.map(minute => (
                                  <option key={minute} value={minute}>{minute}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* Input Field Row */}
                        <div className="w-full" onClick={(e) => e.stopPropagation()}>
                          <Input
                            placeholder="Enter your service..."
                            value={customInput}
                            onChange={(e) => handleCustomInputChange(businessType, index, e.target.value)}
                            className="text-lg w-full"
                          />
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