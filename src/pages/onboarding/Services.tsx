import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

const serviceOptions = [
  "Appointment",
  "Consultation",
  "Service",
  "Class",
  "Other",
];

export default function Services() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState("");
  const navigate = useNavigate();

  // Load saved data on component mount
  useEffect(() => {
    const savedServices = sessionStorage.getItem("selectedServices");
    if (savedServices) {
      try {
        const parsedServices = JSON.parse(savedServices);
        setSelectedServices(parsedServices);
      } catch (error) {
        console.error("Error parsing saved services:", error);
      }
    }
    
    const savedCustomServices = sessionStorage.getItem("customServices");
    if (savedCustomServices) {
      try {
        const parsedCustomServices = JSON.parse(savedCustomServices);
        // Set the first custom service if it exists
        if (parsedCustomServices.length > 0) {
          setCustomService(parsedCustomServices[0]);
        }
      } catch (error) {
        console.error("Error parsing saved custom services:", error);
      }
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/booking-intro");
  };

  const handleNext = () => {
    if (selectedServices.length > 0 || customService.trim()) {
      const allServices = [...selectedServices];
      if (customService.trim()) {
        allServices.push(customService.trim());
      }
      sessionStorage.setItem("services", JSON.stringify(allServices));
      navigate("/onboarding/business-days");
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  };

  const displayText =
    selectedServices.length > 0
      ? `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} selected`
      : "Select the services you want your customers to book";

  const isNextDisabled = selectedServices.length === 0 && !customService.trim();

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 w-full">
          <h2 className="text-xl font-bold text-black">
            What can customers book?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Pick the type of appointments or services your AI will book.
          </p>
        </div>

        {/* Service Selection */}
        <div className="flex flex-col gap-2 w-full">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-black transition-colors"
          >
            <span
              className={`text-lg ${selectedServices.length > 0 ? "text-black" : "text-[#6B7280]"}`}
            >
              {displayText}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                stroke="#141B34"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden bg-white z-50">
              {serviceOptions.map((service) => (
                <div key={service}>
                  {service === "Other" ? (
                    <div className="flex items-center gap-3 p-3 px-4">
                      <button
                        onClick={() => handleServiceToggle(service)}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center ${
                            selectedServices.includes(service)
                              ? "border-black bg-black"
                              : "border-[#6B7280]"
                          }`}
                        >
                          {selectedServices.includes(service) && (
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
                        <span className="text-lg text-[#6B7280]">
                          {service}
                        </span>
                      </button>
                      <input
                        type="text"
                        value={customService}
                        onChange={(e) => setCustomService(e.target.value)}
                        placeholder="Custom"
                        className="flex-1 p-3 border-2 border-[#E5E7EB] rounded-xl text-base placeholder-[#6B7280] focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleServiceToggle(service)}
                      className="w-full flex items-center gap-2.5 p-3 px-4 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-4 h-4 border-[1.5px] rounded flex items-center justify-center ${
                          selectedServices.includes(service)
                            ? "border-black bg-black"
                            : "border-[#6B7280]"
                        }`}
                      >
                        {selectedServices.includes(service) && (
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
                      <span className="text-lg text-[#6B7280]">{service}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}