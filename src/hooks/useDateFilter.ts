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
    // Compute and freeze applied date range at the moment of applying
    const formatDate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

    let nextAppliedFrom = "";
    let nextAppliedTo = "";

    if (selectedFilter === "today") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      nextAppliedFrom = formatDate(startOfDay);
      nextAppliedTo = formatDate(endOfDay);
    } else if (selectedFilter === "30days") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      nextAppliedFrom = formatDate(thirtyDaysAgo);
      nextAppliedTo = formatDate(now);
    } else if (selectedFilter === "custom") {
      nextAppliedFrom = fromDate || "";
      nextAppliedTo = toDate || "";
    } else {
      // "all" or any default
      nextAppliedFrom = "";
      nextAppliedTo = "";
    }

    setAppliedFilter(selectedFilter);
    setAppliedFromDate(nextAppliedFrom);
    setAppliedToDate(nextAppliedTo);

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
    // Trigger refetch
    setFilterVersion(prev => prev + 1);
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
    if (appliedFromDate && appliedToDate) {
      return {
        from: new Date(appliedFromDate),
        to: new Date(appliedToDate + 'T23:59:59'),
      };
    }
    return undefined;
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