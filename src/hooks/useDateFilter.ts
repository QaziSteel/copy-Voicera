import { useState } from "react";

export const useDateFilter = () => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today");
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
    setSelectedFilter("today");
    setFromDate("");
    setToDate("");
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
  };
};