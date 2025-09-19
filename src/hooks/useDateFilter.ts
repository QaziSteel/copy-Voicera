import { useState } from "react";

export const useDateFilter = () => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const openDateFilter = () => setShowDateFilter(true);
  const closeDateFilter = () => setShowDateFilter(false);

  const applyFilter = () => {
    // Here you would typically apply the filter logic
    // For now, we'll just close the popup
    setShowDateFilter(false);
  };

  const resetFilter = () => {
    setSelectedFilter("all");
    setFromDate("");
    setToDate("");
  };

  const getButtonText = () => {
    switch (selectedFilter) {
      case "all":
        return "All";
      case "today":
        return "Today";
      case "30days":
        return "Last 30 days";
      case "custom":
        return fromDate && toDate ? "Custom" : "Custom";
      default:
        return "All";
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (selectedFilter) {
      case "today":
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return { from: startOfDay, to: endOfDay };
      case "30days":
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: thirtyDaysAgo, to: now };
      case "custom":
        if (fromDate && toDate) {
          return { 
            from: new Date(fromDate), 
            to: new Date(toDate + 'T23:59:59') 
          };
        }
        return undefined;
      case "all":
      default:
        return undefined;
    }
  };

  return {
    showDateFilter,
    selectedFilter,
    fromDate,
    toDate,
    openDateFilter,
    closeDateFilter,
    setSelectedFilter,
    setFromDate,
    setToDate,
    applyFilter,
    resetFilter,
    getButtonText,
    getDateFilter,
  };
};