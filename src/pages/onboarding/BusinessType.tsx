import { useState } from "react";
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

const hourOptions = ["00 hr", "01 hr", "02 hr", "03 hr", "04 hr"];
const minuteOptions = ["00 min", "15 min", "30 min", "45 min"];

interface SelectedBusinessType {
  type: string;
  hours: string;
  minutes: string;
}

export const BusinessType: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<SelectedBusinessType[]>([]);
  const [customType, setCustomType] = useState("");
  const [customDuration, setCustomDuration] = useState({ hours: "01 hr", minutes: "00 min" });
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/business-name");
  };

  const handleNext = () => {
    if (selectedBusinessTypes.length > 0 || customType.trim()) {
      const allBusinessTypes = [...selectedBusinessTypes];
      if (customType.trim()) {
        allBusinessTypes.push({
          type: customType.trim(),
          hours: customDuration.hours,
          minutes: customDuration.minutes
        });
      }
      sessionStorage.setItem("businessTypes", JSON.stringify(allBusinessTypes));
      navigate("/onboarding/business-location");
    }
  };

  const handleBusinessTypeToggle = (type: string) => {
    setSelectedBusinessTypes((prev) => {
      const exists = prev.find(item => item.type === type);
      if (exists) {
        return prev.filter(item => item.type !== type);
      } else {
        return [...prev, { type, hours: "01 hr", minutes: "00 min" }];
      }
    });
  };

  const handleDurationChange = (type: string, field: 'hours' | 'minutes', value: string) => {
    setSelectedBusinessTypes((prev) =>
      prev.map(item =>
        item.type === type ? { ...item, [field]: value } : item
      )
    );
  };

  const isNextDisabled = selectedBusinessTypes.length === 0 && !customType.trim();

  const displayText = selectedBusinessTypes.length > 0
    ? `${selectedBusinessTypes.length} service${selectedBusinessTypes.length > 1 ? 's' : ''} selected`
    : "Select services and their appointment duration";

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

        {/* Business Type Selection */}
        <div className="flex flex-col gap-2 md:gap-1.5 sm:gap-1 w-full">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 md:p-3 sm:p-2.5 border-2 border-border rounded-xl md:rounded-lg sm:rounded-lg hover:border-foreground transition-colors"
          >
            <span
              className={`text-lg md:text-base sm:text-sm ${selectedBusinessTypes.length > 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              {displayText}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform md:w-5 md:h-5 sm:w-4 sm:h-4 ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M18 15C18 15 13.5811 9 12 9C10.4188 9 6 15 6 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="border-2 border-border rounded-xl md:rounded-lg sm:rounded-lg overflow-hidden bg-background z-50">
              {businessTypes.map((type) => {
                const isSelected = selectedBusinessTypes.find(item => item.type === type);
                
                return (
                  <div key={type} className="border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3 p-3 md:p-2.5 sm:p-2 px-4 md:px-3 sm:px-2.5">
                      <button
                        onClick={() => handleBusinessTypeToggle(type)}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center ${
                            isSelected ? "border-foreground bg-foreground" : "border-muted-foreground"
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
                        <span className="text-lg md:text-base sm:text-sm text-muted-foreground min-w-[120px]">
                          {type}
                        </span>
                      </button>
                      
                      {isSelected && (
                        <div className="flex items-center gap-2 ml-auto">
                          <select
                            value={isSelected.hours}
                            onChange={(e) => handleDurationChange(type, 'hours', e.target.value)}
                            className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
                          >
                            {hourOptions.map(hour => (
                              <option key={hour} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <select
                            value={isSelected.minutes}
                            onChange={(e) => handleDurationChange(type, 'minutes', e.target.value)}
                            className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
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

              {/* Custom Option */}
              <div className="flex items-center gap-3 p-3 md:p-2.5 sm:p-2 px-4 md:px-3 sm:px-2.5">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-4 h-4 border-[1.5px] border-muted-foreground rounded flex items-center justify-center">
                    {customType.trim() && (
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
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Other (Custom type)"
                    className="flex-1 p-2 border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:border-foreground bg-background"
                  />
                </div>
                
                {customType.trim() && (
                  <div className="flex items-center gap-2">
                    <select
                      value={customDuration.hours}
                      onChange={(e) => setCustomDuration(prev => ({ ...prev, hours: e.target.value }))}
                      className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
                    >
                      {hourOptions.map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                    <select
                      value={customDuration.minutes}
                      onChange={(e) => setCustomDuration(prev => ({ ...prev, minutes: e.target.value }))}
                      className="p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-foreground"
                    >
                      {minuteOptions.map(minute => (
                        <option key={minute} value={minute}>{minute}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};
