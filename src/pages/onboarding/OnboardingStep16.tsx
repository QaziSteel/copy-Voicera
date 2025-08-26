import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function OnboardingStep16() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLetsGo = () => {
    navigate("/onboarding/faqs");
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-6">
        <div className="flex-1"></div>
        <h1 className="text-4xl font-bold text-black text-center">
          Voicera AI
        </h1>
        <div className="flex-1 flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#6B7280]" />
            <span className="text-base text-[#6B7280]">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[800px] bg-white border-2 border-[#E5E7EB] rounded-3xl p-8">
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

            {/* Button */}
            <button
              onClick={handleLetsGo}
              className="w-full h-14 bg-black text-white text-lg font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
            >
              Let's go
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 12H4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.0001 17C15.0001 17 20 13.3176 20 12C20 10.6824 15 7 15 7"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}