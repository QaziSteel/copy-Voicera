import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAgentLiveStatus } from '@/hooks/useAgentLiveStatus';
import NotificationPopup from '@/components/NotificationPopup';

interface HeaderProps {
  currentPage?: 'dashboard' | 'call-logs' | 'daily-summary' | 'agent-management' | 'profile' | 'test-agent';
}

export const Header: React.FC<HeaderProps> = ({ currentPage = 'dashboard' }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { notifications, showNotifications, openNotifications, closeNotifications, notificationCount } = useNotifications();
  const { hasLiveAgent } = useAgentLiveStatus();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 lg:px-12 py-3">
      <div className="relative flex justify-between items-center">
        <h1 className="text-xl font-semibold text-black">Voicera AI</h1>
        
        {/* Navigation Tabs - Absolutely Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 bg-gray-100 rounded-full p-0.5 inline-flex">
          <button
            onClick={() => navigate('/dashboard')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/call-logs')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentPage === 'call-logs'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Call Logs
          </button>
          <button
            onClick={() => navigate('/daily-summary')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentPage === 'daily-summary'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Daily Summary
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Agent Live Button */}
          <button
            onClick={() => navigate("/agents")}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${hasLiveAgent ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
            <span className="text-base font-semibold text-black">
              Agent Live
            </span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={openNotifications}
            className="relative"
          >
            <svg width="24" height="27" viewBox="0 0 29 33" fill="none">
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
              {notificationCount > 0 && (
                <circle cx="24.5" cy="4" r="4" fill="#EF4444" />
              )}
            </svg>
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Profile"
              >
                <span className="text-base font-semibold text-gray-800">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </button>
              <button 
                onClick={toggleDropdown}
                className="hover:opacity-70 transition-opacity"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                        fill="currentColor"
                      />
                      <path
                        d="M8 10C3.58172 10 0 13.5817 0 18H16C16 13.5817 12.4183 10 8 10Z"
                        fill="currentColor"
                      />
                    </svg>
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 14H2C1.44772 14 1 13.5523 1 13V3C1 2.44772 1.44772 2 2 2H6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11 11L15 7L11 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 7H6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        notifications={notifications}
        isVisible={showNotifications}
        onClose={closeNotifications}
        notificationCount={notificationCount}
      />
    </header>
  );
};