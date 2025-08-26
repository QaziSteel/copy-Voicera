import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

const contactOptions = [
  "Use your business number",
  "Get a new local number", 
  "Get a new toll-free number",
  "Other"
];

export const OnboardingStep5: React.FC = () => {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleNext = () => {
    if (selectedContact) {
      sessionStorage.setItem("contactNumber", selectedContact);
      navigate("/onboarding/step6");
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/step4");
  };

  const handleSelectContact = (contact: string) => {
    setSelectedContact(contact);
    setIsDropdownOpen(false);
  };

  return (
    <OnboardingLayout
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText="Next"
      nextDisabled={!selectedContact}
      showPrevious={true}
    >
      <div className="flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Which contact number do you want for agent?
          </h2>
          <p className="text-base italic text-muted-foreground leading-6">
            Choose the number your AI will use to make and receive calls.
          </p>
        </div>

        {/* Contact Selection */}
        <div className="flex flex-col gap-2">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full p-4 border-2 border-border rounded-xl hover:border-foreground transition-colors"
          >
            <span
              className={`text-lg ${selectedContact ? "text-foreground" : "text-muted-foreground"}`}
            >
              {selectedContact || "Select your contact number option"}
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
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
          {isDropdownOpen && (
            <div className="border-2 border-border rounded-xl overflow-hidden bg-background">
              {contactOptions.map((contact) => (
                <button
                  key={contact}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center p-3 px-4 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-lg text-muted-foreground">{contact}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};