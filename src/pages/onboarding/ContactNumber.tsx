import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactNumber() {
  const [selectedNumber, setSelectedNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load any previously saved contact number
    const savedNumber = sessionStorage.getItem("contactNumber");
    if (savedNumber) {
      setSelectedNumber(savedNumber);
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/business-location");
  };

  const handleNext = () => {
    if (selectedNumber) {
      // Store contact number
      sessionStorage.setItem("contactNumber", selectedNumber);
      navigate("/onboarding/personality-intro");
    }
  };

  const handleSelectNumber = (value: string) => {
    setSelectedNumber(value);
  };

  const isNextDisabled = !selectedNumber;

  // Sample contact numbers - you can modify these as needed
  const contactNumbers = [
    "+1-234-567-8900",
    "+1-234-567-8901", 
    "+1-234-567-8902",
    "+1-234-567-8903"
  ];

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-black">
            Which contact number do you want for agent?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Pick the contact number where your agent should respond
          </p>
        </div>

        {/* Contact Number Selection */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-black">Contact Number</h3>
          <Select value={selectedNumber} onValueChange={handleSelectNumber}>
            <SelectTrigger className="w-full p-4 text-lg font-semibold text-muted-foreground border-2 border-muted rounded-xl">
              <SelectValue placeholder="Select here" />
            </SelectTrigger>
            <SelectContent>
              {contactNumbers.map((number) => (
                <SelectItem key={number} value={number}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </OnboardingLayout>
  );
}