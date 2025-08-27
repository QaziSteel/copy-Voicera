import React from "react";

interface DateFilterPopupProps {
  isVisible: boolean;
  onClose: () => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onApplyFilter: () => void;
}

export const DateFilterPopup: React.FC<DateFilterPopupProps> = ({
  isVisible,
  onClose,
  selectedFilter,
  onFilterChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApplyFilter,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-32 px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-800">Filter</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3337 2.6665L2.66699 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66699 2.6665L13.3337 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-5 space-y-6">
          {/* Today */}
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                selectedFilter === "today"
                  ? "border-black bg-black"
                  : "border-gray-400"
              }`}
              onClick={() => onFilterChange("today")}
            />
            <span className="text-gray-600">Today</span>
          </div>

          {/* 30 days ago */}
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                selectedFilter === "30days"
                  ? "border-black bg-black"
                  : "border-gray-400"
              }`}
              onClick={() => onFilterChange("30days")}
            />
            <span className="text-gray-600">30 days ago</span>
          </div>

          {/* Custom */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                  selectedFilter === "custom"
                    ? "border-black bg-black"
                    : "border-gray-400"
                }`}
                onClick={() => onFilterChange("custom")}
              />
              <span className="text-gray-600">Custom</span>
            </div>

            {/* Date inputs */}
            <div className="flex gap-3 ml-8">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">From</label>
                <input
                  type="text"
                  placeholder="Enter the start date"
                  value={fromDate}
                  onChange={(e) => onFromDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-500 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">To</label>
                <input
                  type="text"
                  placeholder="Enter the end date"
                  value={toDate}
                  onChange={(e) => onToDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-500 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={onApplyFilter}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold"
          >
            Apply filter
          </button>
        </div>
      </div>
    </div>
  );
};