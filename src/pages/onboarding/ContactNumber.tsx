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
import { Loader2 } from "lucide-react";

export default function ContactNumber() {
  const [selectedNumber, setSelectedNumber] = useState("");
  const [contactNumbers, setContactNumbers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseSuccessPopup, setShowPurchaseSuccessPopup] = useState(false);
  const [isNumberPurchased, setIsNumberPurchased] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default fallback numbers
  const defaultNumbers = [
    "+1-234-567-8900",
    "+1-234-567-8901", 
    "+1-234-567-8902",
    "+1-234-567-8903"
  ];

  // Generate or get onboarding ID
  const getOnboardingId = () => {
    let onboardingId = sessionStorage.getItem("onboardingId");
    if (!onboardingId) {
      onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("onboardingId", onboardingId);
    }
    return onboardingId;
  };

  useEffect(() => {
    const onboardingId = getOnboardingId();
    
    // Check if number is already purchased for this onboarding session
    const purchasedNumber = sessionStorage.getItem(`purchasedContactNumber_${onboardingId}`);
    const isPurchased = sessionStorage.getItem(`contactNumberPurchased_${onboardingId}`) === "true";
    
    if (isPurchased && purchasedNumber) {
      setIsNumberPurchased(true);
      setSelectedNumber(purchasedNumber);
      setContactNumbers([purchasedNumber]); // Show only the purchased number
      return;
    }

    // Load any previously saved contact number (not yet purchased)
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

  const purchaseContactNumber = async (number: string, onboardingId: string) => {
    try {
      // TODO: Replace with your actual purchase webhook URL
      const purchaseWebhookUrl = "https://teamhypergrowth.app.n8n.cloud/webhook-test/fbd1d588-31bb-4ba3-a01d-be2e09de2e3a";
      
      const response = await fetch(purchaseWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactNumber: number,
          onboardingId: onboardingId,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase contact number');
      }

      const data = await response.json();
      
      // Check if purchase was successful
      if (data.success || data.purchased) {
        return { success: true, data };
      } else {
        throw new Error(data.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing contact number:', error);
      throw error;
    }
  };

  const handlePrevious = () => {
    // If number is already purchased, user can still go back but cannot change number
    navigate("/onboarding/business-location");
  };

  const handleNext = () => {
    if (isNumberPurchased) {
      // If number is already purchased, proceed directly
      navigate("/onboarding/personality-intro");
    } else if (selectedNumber) {
      setShowConfirmationPopup(true);
    }
  };

  const handleConfirmPurchase = async () => {
    const onboardingId = getOnboardingId();
    setIsPurchasing(true);
    setPurchaseError(null);
    
    try {
      const result = await purchaseContactNumber(selectedNumber, onboardingId);
      
      if (result.success) {
        // Mark number as purchased
        sessionStorage.setItem(`contactNumberPurchased_${onboardingId}`, "true");
        sessionStorage.setItem(`purchasedContactNumber_${onboardingId}`, selectedNumber);
        sessionStorage.setItem("contactNumber", selectedNumber);
        
        // Update component state
        setIsNumberPurchased(true);
        setShowConfirmationPopup(false);
        setShowPurchaseSuccessPopup(true);
        
        toast({
          title: "Success!",
          description: `Contact number ${selectedNumber} has been purchased successfully.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase number';
      setPurchaseError(errorMessage);
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseSuccessPopup(false);
    navigate("/onboarding/personality-intro");
  };

  const handleDiscard = () => {
    setShowConfirmationPopup(false);
    setPurchaseError(null);
  };

  const handleSelectNumber = (value: string) => {
    if (!isNumberPurchased) {
      setSelectedNumber(value);
    }
  };

  const isNextDisabled = !selectedNumber || isLoading || isPurchasing;

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
            {isNumberPurchased 
              ? "Your purchased contact number" 
              : "Which contact number do you want for agent?"
            }
          </h2>
          <p className="text-base italic text-[#737373] leading-6">
            {isNumberPurchased 
              ? "This number has been purchased and locked for your agent" 
              : "Pick the contact number where your agent should respond"
            }
          </p>
        </div>

        {/* Contact Number Selection */}
        <div className="flex flex-col gap-3 w-full">
          <h3 className="text-xl font-bold text-black">
            {isNumberPurchased ? "Purchased Number" : "Contact Number"}
          </h3>
          <Select 
            value={selectedNumber} 
            onValueChange={handleSelectNumber}
            disabled={isLoading || isNumberPurchased}
          >
            <SelectTrigger className={`w-full p-4 text-lg font-semibold border-2 rounded-xl ${
              isNumberPurchased 
                ? "text-green-600 border-green-200 bg-green-50" 
                : "text-muted-foreground border-muted"
            }`}>
              <SelectValue placeholder={
                isLoading 
                  ? "Loading numbers..." 
                  : isNumberPurchased 
                    ? "Number purchased and locked" 
                    : "Select here"
              } />
            </SelectTrigger>
            <SelectContent>
              {contactNumbers.map((number) => (
                <SelectItem key={number} value={number}>
                  {number}
                  {isNumberPurchased && number === selectedNumber && " (Purchased)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isNumberPurchased && (
            <p className="text-sm text-green-600 font-medium">
              ✓ This number has been purchased and cannot be changed
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      <AlertDialog open={showConfirmationPopup} onOpenChange={setShowConfirmationPopup}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black text-center">
              Purchase Contact Number
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center">
              You are about to purchase {selectedNumber}. This action cannot be undone and the number cannot be changed later.
            </AlertDialogDescription>
            {purchaseError && (
              <div className="text-red-600 text-sm text-center mt-2">
                {purchaseError}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 justify-between">
            <Button 
              variant="outline" 
              onClick={handleDiscard} 
              className="rounded-xl"
              disabled={isPurchasing}
            >
              Discard
            </Button>
            <Button 
              onClick={handleConfirmPurchase} 
              className="rounded-xl"
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : (
                "Buy now"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase Success Popup */}
      <AlertDialog open={showPurchaseSuccessPopup} onOpenChange={setShowPurchaseSuccessPopup}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black text-center">
              Number Purchased Successfully! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center">
              Your contact number {selectedNumber} has been successfully purchased and is now ready for your agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <Button 
              onClick={handlePurchaseSuccess} 
              className="rounded-xl w-full"
            >
              Continue to Next Step
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OnboardingLayout>
  );
}