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
  const [customType, setCustomType] = useState("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedBusinessTypes = sessionStorage.getItem("businessTypes");
    if (savedBusinessTypes) {
      try {
        const parsedTypes = JSON.parse(savedBusinessTypes);
        
        // Separate preset business types from custom ones
        const presetTypes: string[] = [];
        let customEntry: string | null = null;
        
        parsedTypes.forEach((item: any) => {
          // Handle both old format (object with type property) and new format (string)
          const typeName = typeof item === 'string' ? item : item.type;
          
          if (businessTypes.includes(typeName)) {
            presetTypes.push(typeName);
          } else {
            customEntry = typeName;
          }
        });
        
        // Set preset selections
        setSelectedBusinessTypes(presetTypes);
        
        // Set custom entry if exists
        if (customEntry) {
          setIsCustomSelected(true);
          setCustomType(customEntry);
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
    if (isCustomSelected && customType.trim()) {
      allBusinessTypes.push(customType.trim());
    }
    
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

  const handleCustomToggle = () => {
    setIsCustomSelected(!isCustomSelected);
    if (!isCustomSelected) {
      setCustomType("");
    }
  };

  const isNextDisabled = selectedBusinessTypes.length === 0 && !(isCustomSelected && typeof customType === 'string' && customType.trim());

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

          {/* Custom Type Card */}
          <div
            className={`flex flex-col p-4 rounded-xl transition-colors cursor-pointer ${
              isCustomSelected
                ? "bg-[#F3F4F6] border-2 border-black"
                : "bg-[#F3F4F6] border-2 border-transparent hover:border-gray-300"
            }`}
            onClick={() => handleCustomToggle()}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <div
                  className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center ${
                    isCustomSelected ? "border-black bg-black" : "border-[#6B7280]"
                  }`}
                >
                  {isCustomSelected && (
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
                
                {/* Custom Input or Label */}
                {isCustomSelected ? (
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => {
                      e.stopPropagation();
                      setCustomType(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter your business type..."
                    className="flex-1 p-2 border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:border-foreground bg-background"
                  />
                ) : (
                  <span className="text-lg leading-6 text-[#6B7280]">
                    Other (Custom type)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};