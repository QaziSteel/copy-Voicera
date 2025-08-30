import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, updatePassword } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in using useAuth
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Countdown for verification
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showVerificationModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showVerificationModal, countdown]);

  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
  };

  const handleSavePassword = async () => {
    // Validation logic
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await signIn(user.email, currentPassword);
      
      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      console.log(`Verification code: ${code}`);

      toast({
        title: "Verification Code Sent",
        description: "Check the console for your 6-digit verification code",
      });

      setShowChangePasswordModal(false);
      setShowVerificationModal(true);
      setCountdown(30);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify password. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleVerifyAndContinue = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    if (verificationCode !== generatedCode) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Actually update the password in Supabase
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setShowVerificationModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    // Reset form states
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setGeneratedCode("");
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const renderNotificationsPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-end z-50">
      <div className="bg-white w-[600px] h-full shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="bg-white p-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-black">Notifications</h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-5 space-y-4">
          {/* Sample Notifications */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path
                  d="M13 0.333984C18.9709 0.333984 21.9565 0.333566 23.8115 2.18848C25.6664 4.04346 25.667 7.02899 25.667 13C25.667 18.9709 25.6663 21.9564 23.8115 23.8115C21.9565 25.6664 18.971 25.667 13 25.667C7.02888 25.667 4.04348 25.6665 2.18848 23.8115C0.333558 21.9565 0.333008 18.971 0.333008 13C0.333008 7.02899 0.333507 4.04346 2.18848 2.18848C4.04349 0.333612 7.02901 0.333984 13 0.333984ZM13 11.584C12.5858 11.584 12.25 11.9198 12.25 12.334V18.334C12.2503 18.748 12.5859 19.084 13 19.084C13.4141 19.084 13.7497 18.748 13.75 18.334V12.334C13.75 11.9198 13.4142 11.584 13 11.584ZM13 6.76855C12.5029 6.76855 12.0996 7.17189 12.0996 7.66895V7.68262C12.0998 8.17952 12.5031 8.58203 13 8.58203C13.4969 8.58203 13.9002 8.17952 13.9004 7.68262V7.66895C13.9004 7.17189 13.4971 6.76855 13 6.76855Z"
                  fill="#007AFF"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Daily Summary Ready ·{" "}
                <span className="text-gray-500">
                  Your daily summary for August 20, 2025 is now available.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 5:00 PM</p>
              <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                View Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChangePasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[600px] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-medium text-black">Change Password</h2>
          <button
            onClick={() => setShowChangePasswordModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3337 2.66699L2.66699 13.3337M2.66699 2.66699L13.3337 13.3337"
                stroke="#6B7280"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-8">
          {/* Current Password */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-black">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-[52px] px-4 border-2 border-gray-200 rounded-xl text-lg placeholder-gray-400"
                placeholder={
                  showCurrentPassword
                    ? currentPassword || "Enter current password"
                    : "············"
                }
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                {showCurrentPassword ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9.75C4.57594 11.7009 7.46531 14.25 12 14.25C16.5347 14.25 19.4241 11.7009 21 9.75"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 15.7504L18.8081 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.9999 17.9998L14.3352 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 17.9998L9.66469 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 15.7504L5.19187 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-black">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-[52px] px-4 border-2 border-gray-200 rounded-xl text-lg placeholder-gray-400"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                {showNewPassword ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9.75C4.57594 11.7009 7.46531 14.25 12 14.25C16.5347 14.25 19.4241 11.7009 21 9.75"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 15.7504L18.8081 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.9999 17.9998L14.3352 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 17.9998L9.66469 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 15.7504L5.19187 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-black">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[52px] px-4 border-2 border-gray-200 rounded-xl text-lg placeholder-gray-400"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9.75C4.57594 11.7009 7.46531 14.25 12 14.25C16.5347 14.25 19.4241 11.7009 21 9.75"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 15.7504L18.8081 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.9999 17.9998L14.3352 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 17.9998L9.66469 14.0107"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 15.7504L5.19187 11.915"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowChangePasswordModal(false)}
              className="flex-1 py-4 px-5 bg-gray-100 text-gray-500 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePassword}
              disabled={isLoading}
              className="flex-1 py-4 px-5 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Save Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerificationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[600px] shadow-lg">
        <div className="p-5 text-center space-y-8">
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowVerificationModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.3337 2.66699L2.66699 13.3337M2.66699 2.66699L13.3337 13.3337"
                  stroke="#6B7280"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-black">
              Confirm your identity
            </h2>
            <p className="text-gray-500 text-base">
              We've sent a 6-digit verification code to{" "}
              <span className="font-semibold">john@gmail.com</span>. Enter it
              below to confirm your identity.
            </p>
          </div>

          {/* Code input */}
          <div className="space-y-4">
            <div className="text-left">
              <label className="text-lg font-semibold text-black">
                Enter Code
              </label>
            </div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full h-[52px] px-4 border-2 border-gray-200 rounded-xl text-lg placeholder-gray-400"
              placeholder="Enter the 6 digits code"
            />
            <p className="text-center text-base">
              <span className="text-gray-500">
                Didn't receive the code? Resend in{" "}
              </span>
              <span className="font-semibold text-black">{countdown}s</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowVerificationModal(false)}
              className="flex-1 py-4 px-5 bg-gray-100 text-gray-500 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyAndContinue}
              disabled={isLoading}
              className="flex-1 py-4 px-5 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating Password..." : "Verify & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl w-[600px] shadow-lg p-5 text-center space-y-10">
        {/* Success icon */}
        <div className="flex justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M40 0.000976562C42.65 0.000976562 44.7821 2.13343 49.0469 6.39844C51.6057 8.95723 54.1424 10.1455 57.792 10.1455C60.9576 10.1455 65.4722 9.53092 67.9629 12.001C70.4728 14.4908 69.8545 19.0233 69.8545 22.209C69.8545 26.2349 70.7358 28.086 73.6025 30.9531C77.8677 35.2181 80 37.351 80 40.001C79.9998 42.6504 77.8675 44.7833 73.6025 49.0479C70.7354 51.915 69.8545 53.7661 69.8545 57.792C69.8545 60.978 70.4727 65.5114 67.9619 68.001C65.4711 70.4706 60.9575 69.8555 57.792 69.8555C53.9064 69.8555 52.0349 70.6155 49.2617 73.3887C46.9005 75.7503 43.7348 80.001 40 80.001C36.2652 80.0009 33.0996 75.7503 30.7383 73.3887C27.9651 70.6155 26.0937 69.8555 22.208 69.8555C19.0426 69.8555 14.5288 70.4706 12.0381 68.001C9.52736 65.5114 10.1455 60.978 10.1455 57.792C10.1455 53.7661 9.26454 51.915 6.39746 49.0479C2.13271 44.7833 0.000301032 42.6504 0 40.001C4.00001e-05 37.351 2.13253 35.2181 6.39746 30.9531C8.95676 28.3938 10.1455 25.8577 10.1455 22.209C10.1455 19.0433 9.52995 14.5289 12 12.0381C14.4896 9.52763 19.0221 10.1455 22.208 10.1455C25.8568 10.1455 28.3938 8.95776 30.9531 6.39844C35.2181 2.13347 37.35 0.0010175 40 0.000976562ZM54.6611 28.6152C53.8958 27.1458 52.0837 26.5746 50.6143 27.3398C45.1305 30.1961 40.5848 35.7181 37.5254 40.1797C36.3864 41.8408 35.4142 43.4129 34.6387 44.7412C33.8952 44.0491 33.1596 43.45 32.5049 42.957C31.6715 42.3295 30.9211 41.8348 30.375 41.4941C30.1014 41.3235 29.8764 41.1903 29.7148 41.0967C29.6341 41.0499 29.5691 41.0121 29.5215 40.9854C29.4977 40.972 29.4778 40.9613 29.4629 40.9531C29.4555 40.949 29.4485 40.9462 29.4434 40.9434C29.4409 40.942 29.4384 40.9405 29.4365 40.9395L29.4346 40.9375L29.4326 40.9365C29.4297 40.9409 29.3881 41.0176 28.7031 42.2783L29.4316 40.9365C27.9758 40.146 26.1551 40.685 25.3643 42.1406C24.5745 43.5949 25.1113 45.4139 26.5635 46.2061L26.5674 46.208H26.5664L26.5684 46.209L26.5693 46.208C26.5735 46.2103 26.5794 46.2149 26.5879 46.2197C26.6117 46.233 26.652 46.2562 26.707 46.2881C26.8172 46.3519 26.9858 46.4519 27.1992 46.585C27.6281 46.8525 28.229 47.2482 28.8955 47.75C30.2712 48.7859 31.7406 50.1342 32.6592 51.5967C33.2403 52.5219 34.2793 53.0578 35.3701 52.9961C36.4607 52.9342 37.4305 52.2836 37.9033 51.2988C37.9045 51.2994 37.9043 51.3008 37.9043 51.3008C37.9045 51.3004 37.9053 51.2989 37.9062 51.2969C37.9084 51.2925 37.9115 51.2837 37.917 51.2725C37.9281 51.2497 37.9463 51.2133 37.9707 51.1641C38.0198 51.065 38.0963 50.9135 38.1973 50.7168C38.3995 50.323 38.703 49.7463 39.0977 49.0361C39.889 47.6124 41.0402 45.6642 42.4746 43.5723C45.415 39.2842 49.2699 34.806 53.3857 32.6621C54.8552 31.8968 55.4263 30.0847 54.6611 28.6152Z"
              fill="#22C55E"
            />
          </svg>
        </div>

        {/* Title and description */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-black">
            Password Changed Successfully
          </h2>
          <p className="text-gray-500 text-xl">
            Your account password has been updated. Make sure to use your new
            password when logging in next time.
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleCloseSuccess}
          className="w-full py-4 px-5 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-16 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-black">Voicera AI</h1>

          <div className="flex items-center gap-8">
            {/* Agent Live */}
            <button
              onClick={() => navigate("/agent-management")}
              className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 18C20.4142 18 21.1213 18 21.5607 17.5607C22 17.1213 22 16.4142 22 15C22 13.5858 22 12.8787 21.5607 12.4393C21.1213 12 20.4142 12 19 12"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 18C3.58579 18 2.87868 18 2.43934 17.5607C2 17.1213 2 16.4142 2 15C2 13.5858 2 12.8787 2.43934 12.4393C2.87868 12 3.58579 12 5 12"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 5V8"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13V14"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 13V14"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 17.5C10 17.5 10.6667 18 12 18C13.3333 18 14 17.5 14 17.5"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-lg font-semibold text-black">
                Agent Live
              </span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <svg width="29" height="33" viewBox="0 0 29 33" fill="none">
                <path
                  d="M15.5 27C15.5 28.933 13.933 30.5 12 30.5C10.067 30.5 8.5 28.933 8.5 27"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.2311 27H4.76887C3.79195 27 3 26.208 3 25.2311C3 24.762 3.18636 24.3121 3.51809 23.9803L4.12132 23.3771C4.68393 22.8145 5 22.0514 5 21.2558V18.5C5 14.634 8.13401 11.5 12 11.5C15.866 11.5 19 14.634 19 18.5V21.2558C19 22.0514 19.3161 22.8145 19.8787 23.3771L20.4819 23.9803C20.8136 24.3121 21 24.762 21 25.2311C21 26.208 20.208 27 19.2311 27Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24.5" cy="4" r="4" fill="#EF4444" />
              </svg>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-800">H</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mt-4">
          <div className="bg-gray-100 rounded-full p-2 flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-gray-500">
                Dashboard
              </span>
            </button>
            <button
              onClick={() => navigate("/call-logs")}
              className="px-4 py-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-gray-500">
                Call Logs
              </span>
            </button>
            <button
              onClick={() => navigate("/daily-summary")}
              className="px-4 py-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-gray-500">
                Daily Summary
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 py-8">
        {/* Profile Header */}
        <div className="mb-5">
          <h1 className="text-3xl font-semibold text-black mb-1">Profile</h1>
          <p className="text-xl font-semibold text-gray-500">
            Manage your account information and team access.
          </p>
        </div>

        <div className="space-y-5">
          {/* Account Information */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black">
              Account Information
            </h2>
            <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-5">
              {/* Full Name */}
              <div className="space-y-3">
                <label className="text-lg font-semibold text-black">
                  Full Name
                </label>
                <div className="bg-gray-100 rounded-xl px-4 py-4">
                  <span className="text-gray-500">John Doe</span>
                </div>
              </div>

              {/* Email and Password Row */}
              <div className="flex gap-5">
                {/* Email Address */}
                <div className="flex-1 space-y-3">
                  <label className="text-lg font-semibold text-black">
                    Email Address
                  </label>
                  <div className="bg-gray-100 rounded-xl px-4 py-4">
                    <span className="text-gray-500">john@gmail.com</span>
                  </div>
                  <button className="bg-black text-white px-4 py-2 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors">
                    Change Email
                  </button>
                </div>

                {/* Current Password */}
                <div className="flex-1 space-y-3">
                  <label className="text-lg font-semibold text-black">
                    Current Password
                  </label>
                  <div className="bg-gray-100 rounded-xl px-4 py-4">
                    <span className="text-gray-500 text-2xl">············</span>
                  </div>
                  <button
                    onClick={handleChangePasswordClick}
                    className="bg-black text-white px-4 py-2 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Team & User Management */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black">
              Team & User Management
            </h2>
            <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-5">
              {/* Add team member form */}
              <div className="flex gap-5">
                <div className="flex-1 space-y-3">
                  <label className="text-lg font-semibold text-black">
                    Name
                  </label>
                  <div className="bg-gray-100 rounded-xl px-4 py-3">
                    <span className="text-gray-500">email@example.com</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-lg font-semibold text-black">
                    Email
                  </label>
                  <div className="bg-gray-100 rounded-xl px-4 py-3">
                    <span className="text-gray-500">email@example.com</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-1 space-y-3">
                  <label className="text-lg font-semibold text-black">
                    Role
                  </label>
                  <div className="bg-gray-100 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-gray-500">Select Role</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                        stroke="#141B34"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <button className="bg-black text-white px-4 py-3 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors">
                Send Invite
              </button>
            </div>
          </div>

          {/* Team member table */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black">Team member</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-100 px-3 py-3 flex items-center gap-4 border-b border-gray-200">
                <div className="w-4 h-4 border border-gray-300"></div>
                <div className="w-8 text-xs font-bold text-gray-600 uppercase">
                  NO.
                </div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">
                  Name
                </div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">
                  Email
                </div>
                <div className="w-40 text-xs font-bold text-gray-600 uppercase">
                  Role
                </div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">
                  Status
                </div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">
                  Actions
                </div>
              </div>

              {/* Table Rows */}
              {[
                {
                  no: "01",
                  name: "John Doe",
                  email: "john@gmail.com",
                  role: "Admin",
                  status: "Active",
                },
                {
                  no: "02",
                  name: "Jane Smith",
                  email: "jane@gmail.com",
                  role: "Admin",
                  status: "Active",
                },
                {
                  no: "03",
                  name: "Mike Johnson",
                  email: "mike@yahoo.com",
                  role: "Staff",
                  status: "Active",
                },
                {
                  no: "04",
                  name: "Emily Davis",
                  email: "emily@outlook.com",
                  role: "Staff",
                  status: "Pending",
                },
                {
                  no: "05",
                  name: "David Brown",
                  email: "david@gmail.com",
                  role: "Staff",
                  status: "Pending",
                },
              ].map((member) => (
                <div
                  key={member.no}
                  className="px-3 py-4 flex items-center gap-4 border-b border-gray-200 bg-white"
                >
                  <div className="w-4 h-4 border border-gray-300"></div>
                  <div className="w-8 text-sm font-semibold text-gray-600">
                    {member.no}
                  </div>
                  <div className="flex-1 text-sm text-gray-600">
                    {member.name}
                  </div>
                  <div className="flex-1 text-sm text-gray-600">
                    {member.email}
                  </div>
                  <div className="w-40 text-sm text-gray-600">
                    {member.role}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`px-4 py-1 rounded-lg text-xs font-bold uppercase ${
                        member.status === "Active"
                          ? "bg-green-100 text-green-600 border border-green-600"
                          : "bg-orange-100 text-orange-600 border border-orange-600"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <div className="flex-1 flex gap-3">
                    <button className="px-4 py-1 bg-black text-white rounded-lg text-xs font-bold uppercase hover:bg-gray-800 transition-colors">
                      Edit
                    </button>
                    {member.status === "Active" ? (
                      <button className="px-4 py-1 border border-red-500 text-red-500 rounded-lg text-xs font-bold uppercase hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    ) : (
                      <button className="px-4 py-1 border border-gray-300 text-gray-500 rounded-lg text-xs font-bold uppercase hover:bg-gray-50 transition-colors">
                        Resend Invite
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNotifications && renderNotificationsPopup()}
      {showChangePasswordModal && renderChangePasswordModal()}
      {showVerificationModal && renderVerificationModal()}
      {showSuccessModal && renderSuccessModal()}
    </div>
  );
};

export default Profile;