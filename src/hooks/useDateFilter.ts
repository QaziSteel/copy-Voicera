import { useState } from "react";

export const useDateFilter = () => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Applied filter states - these are used for actual data filtering
  const [appliedFilter, setAppliedFilter] = useState("all");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  
  // Version counter to trigger data re-fetching when filter is applied
  const [filterVersion, setFilterVersion] = useState(0);

  const openDateFilter = () => setShowDateFilter(true);
  const closeDateFilter = () => setShowDateFilter(false);

  const applyFilter = () => {
    // Apply the selected filter by copying to applied states
    setAppliedFilter(selectedFilter);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    // Increment version to trigger data re-fetching
    setFilterVersion(prev => prev + 1);
    setShowDateFilter(false);
  };

  const resetFilter = () => {
    setSelectedFilter("all");
    setFromDate("");
    setToDate("");
    // Also reset applied filters
    setAppliedFilter("all");
    setAppliedFromDate("");
    setAppliedToDate("");
  };

  const getButtonText = () => {
    switch (appliedFilter) {
      case "all":
        return "All";
      case "today":
        return "Today";
      case "30days":
        return "Last 30 days";
      case "custom":
        return appliedFromDate && appliedToDate ? "Custom" : "Custom";
      default:
        return "All";
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (appliedFilter) {
      case "today":
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return { from: startOfDay, to: endOfDay };
      case "30days":
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: thirtyDaysAgo, to: now };
      case "custom":
        if (appliedFromDate && appliedToDate) {
          return { 
            from: new Date(appliedFromDate), 
            to: new Date(appliedToDate + 'T23:59:59') 
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
    filterVersion,
  };
};