import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const businessTypes = [
  "Hairdressers",
  "Nail Salon", 
  "Health Clinic",
  "Fitness Studio",
  "Coaching/Consulting",
  "Physiotherapy",
  "Chiropractor",
];


export const BusinessType: React.FC = () => {
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(['']);
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedBusinessTypes = sessionStorage.getItem("businessTypes");
    if (savedBusinessTypes) {
      try {
        const parsedTypes = JSON.parse(savedBusinessTypes);
        
        // Separate preset business types from custom ones
        const presetTypes: string[] = [];
        const customEntries: string[] = [];
        
        parsedTypes.forEach((item: any) => {
          // Handle both old format (object with type property) and new format (string)
          const typeName = typeof item === 'string' ? item : item.type;
          
          if (businessTypes.includes(typeName)) {
            presetTypes.push(typeName);
          } else {
            customEntries.push(typeName);
          }
        });
        
        // Set preset selections
        setSelectedBusinessTypes(presetTypes);
        
        // Set custom entries if exist, always ensure at least one empty slot
        if (customEntries.length > 0) {
          setCustomTypes([...customEntries, '']);
        }
      } catch (error) {
        console.error("Error parsing saved business types:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/business-name");
  };

  const handleNext = () => {
    const allBusinessTypes = [...selectedBusinessTypes];
    // Add all filled custom types
    customTypes.forEach(ct => {
      if (ct.trim()) {
        allBusinessTypes.push(ct.trim());
      }
    });
    
    if (allBusinessTypes.length > 0) {
      sessionStorage.setItem("businessTypes", JSON.stringify(allBusinessTypes));
      navigate("/onboarding/business-services");
    }
  };

  const handleBusinessTypeToggle = (type: string) => {
    setSelectedBusinessTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter(item => item !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleCustomTypeChange = (index: number, value: string) => {
    const newCustomTypes = [...customTypes];
    newCustomTypes[index] = value;
    
    // If this is the last item and it now has text, add a new empty slot
    if (index === customTypes.length - 1 && value.trim()) {
      newCustomTypes.push('');
    }
    
    setCustomTypes(newCustomTypes);
  };

  const handleCustomTypeRemove = (index: number) => {
    const newCustomTypes = customTypes.filter((_, i) => i !== index);
    // Always keep at least one empty slot
    if (newCustomTypes.length === 0 || newCustomTypes.every(ct => ct.trim())) {
      newCustomTypes.push('');
    }
    setCustomTypes(newCustomTypes);
  };

  const hasFilledCustomTypes = customTypes.some(ct => ct.trim());
  const isNextDisabled = selectedBusinessTypes.length === 0 && !hasFilledCustomTypes;

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
            Select your business type
          </h2>
          <p className="text-base md:text-sm sm:text-xs italic text-muted-foreground leading-6 md:leading-5 sm:leading-4">
            Choose the type(s) that best describe your business.
          </p>
        </div>

        {/* Business Type Cards */}
        <div className="flex flex-col gap-4 w-full">
          {businessTypes.map((type) => {
            const isSelected = selectedBusinessTypes.includes(type);
            
            return (
              <div
                key={type}
                className={`flex flex-col p-4 rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#F3F4F6] border-2 border-black"
                    : "bg-[#F3F4F6] border-2 border-transparent hover:border-gray-300"
                }`}
                onClick={() => handleBusinessTypeToggle(type)}
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
                    
                    {/* Business Type Name */}
                    <span className={`text-lg leading-6 ${
                      isSelected ? "text-black" : "text-[#6B7280]"
                    }`}>
                      {type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Custom Type Cards */}
          {customTypes.map((customType, index) => {
            const isSelected = customType.trim().length > 0;
            
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
                <div className="flex items-center gap-3 mb-3">
                  {/* Checkbox */}
                  <div
                    className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center cursor-pointer ${
                      isSelected ? "border-black bg-black" : "border-[#6B7280]"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        handleCustomTypeRemove(index);
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
                    Other (Custom Type)
                  </span>
                </div>
                
                {/* Input Field Row */}
                <div className="w-full">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCustomTypeChange(index, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter your business type..."
                    className="w-full p-2 border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:border-foreground bg-background"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
};