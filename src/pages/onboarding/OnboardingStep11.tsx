import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

export default function OnboardingStep11() {
  const navigate = useNavigate();

  const handlePrevious = () => {
    navigate("/onboarding/step10");
  };

  const handleNext = () => {
    navigate("/onboarding/step12");
  };

  return (
    <OnboardingLayout
      onPrevious={handlePrevious}
      onNext={handleNext}
      nextButtonText="Let's go"
      showPrevious={true}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Calendar Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-[#F3F4F6] border-[1.25px] border-[#E5E7EB] rounded-full">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_207_125)">
              <path
                d="M32.5 6.25H7.5C6.80964 6.25 6.25 6.80964 6.25 7.5V32.5C6.25 33.1904 6.80964 33.75 7.5 33.75H32.5C33.1904 33.75 33.75 33.1904 33.75 32.5V7.5C33.75 6.80964 33.1904 6.25 32.5 6.25Z"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M27.5 3.75V8.75"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 3.75V8.75"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.25 13.75H33.75"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.375 23.75L18.125 27.5L25.625 20"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_207_125">
                <rect width="40" height="40" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            {/* Step Header */}
            <h1 className="text-lg font-bold text-gray-500 text-center">
              Step 3 of 5
            </h1>
            <h2 className="text-2xl font-bold text-black">Booking Setup</h2>
            <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7">
              Now, let's set up how your AI will handle appointments.
            </p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}