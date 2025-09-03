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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ContactNumber() {
  const [selectedNumber, setSelectedNumber] = useState("");
  const [contactNumbers, setContactNumbers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default fallback numbers
  const defaultNumbers = [
    "+1-234-567-8900",
    "+1-234-567-8901", 
    "+1-234-567-8902",
    "+1-234-567-8903"
  ];

  useEffect(() => {
    // Load any previously saved contact number
    const savedNumber = sessionStorage.getItem("contactNumber");
    if (savedNumber) {
      setSelectedNumber(savedNumber);
    }

    // Check if webhook has been called before
    const hasCalledWebhook = sessionStorage.getItem("contactNumbersWebhookCalled");
    
    if (!hasCalledWebhook) {
      fetchContactNumbers();
    } else {
      // Use cached numbers or fallback to defaults
      const cachedNumbers = sessionStorage.getItem("cachedContactNumbers");
      if (cachedNumbers) {
        setContactNumbers(JSON.parse(cachedNumbers));
      } else {
        setContactNumbers(defaultNumbers);
      }
    }
  }, []);

  const fetchContactNumbers = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with your actual n8n webhook URL
      const webhookUrl = "https://teamhypergrowth.app.n8n.cloud/webhook-test/9ae119ed-1b4c-4d41-bd34-5b0cfc8b403b";
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contact numbers');
      }

      const data = await response.json();
      const numbers = data.contactNumbers || data;
      
      if (Array.isArray(numbers) && numbers.length > 0) {
        setContactNumbers(numbers);
        // Cache the numbers and mark webhook as called
        sessionStorage.setItem("cachedContactNumbers", JSON.stringify(numbers));
        sessionStorage.setItem("contactNumbersWebhookCalled", "true");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching contact numbers:', error);
      toast({
        title: "Unable to load contact numbers",
        description: "Using default numbers. Please try again later.",
        variant: "destructive",
      });
      // Fallback to default numbers
      setContactNumbers(defaultNumbers);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/business-location");
  };

  const handleNext = () => {
    if (selectedNumber) {
      setShowConfirmationPopup(true);
    }
  };

  const handleConfirmPurchase = () => {
    // Store contact number and navigate
    sessionStorage.setItem("contactNumber", selectedNumber);
    setShowConfirmationPopup(false);
    navigate("/onboarding/personality-intro");
  };

  const handleDiscard = () => {
    setShowConfirmationPopup(false);
  };

  const handleSelectNumber = (value: string) => {
    setSelectedNumber(value);
  };

  const isNextDisabled = !selectedNumber || isLoading;

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
            Which contact number do you want for agent?
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            Pick the contact number where your agent should respond
          </p>
        </div>

        {/* Contact Number Selection */}
        <div className="flex flex-col gap-3 w-full">
          <h3 className="text-xl font-bold text-black">Contact Number</h3>
          <Select 
            value={selectedNumber} 
            onValueChange={handleSelectNumber}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full p-4 text-lg font-semibold text-muted-foreground border-2 border-muted rounded-xl">
              <SelectValue placeholder={isLoading ? "Loading numbers..." : "Select here"} />
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

      {/* Confirmation Popup */}
      <AlertDialog open={showConfirmationPopup} onOpenChange={setShowConfirmationPopup}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black text-center">
              Contact Number
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center">
              The number you've selected is {selectedNumber}. Please confirm as this cannot be changed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-between">
            <Button variant="outline" onClick={handleDiscard} className="rounded-xl">
              Discard
            </Button>
            <Button onClick={handleConfirmPurchase} className="rounded-xl">
              Buy now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OnboardingLayout>
  );
}