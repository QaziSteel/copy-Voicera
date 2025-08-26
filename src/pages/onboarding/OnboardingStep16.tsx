import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep16() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/onboarding/faqs");
  };

  return (
    <OnboardingLayout onNext={handleNext} nextButtonText="Let's go">
      <div className="flex flex-col items-center gap-8">
        {/* Icon */}
        <div className="w-20 h-20 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 25V22.5C24.8328 22.5 28.75 19.1422 28.75 15C28.75 10.8578 24.8328 7.5 20 7.5C15.1672 7.5 11.25 10.8578 11.25 15"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="32.5" r="2.5" fill="black" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <p className="text-xl font-bold text-[#6B7280] tracking-[-0.1px]">
            Step 4 of 5
          </p>
          <h2 className="text-2xl font-bold text-black tracking-[-0.144px]">
            FAQs & Info
          </h2>
          <p className="text-xl font-bold text-[#6B7280] tracking-[-0.1px] max-w-[500px]">
            Your AI can answer common questions, so you don't have to.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}