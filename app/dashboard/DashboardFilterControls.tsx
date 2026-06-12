"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

interface FilterControlsProps {
  timeRange: string;
  monthYear: string;
  onTimeRangeChange: (value: string) => void;
  onMonthYearChange: (value: string) => void;
}

export function DashboardFilterControls({ timeRange, monthYear, onTimeRangeChange, onMonthYearChange }: FilterControlsProps) {
  
  const handleToggleChange = (value: string) => {
    if (value) onTimeRangeChange(value);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthYearChange(e.target.value);
    onTimeRangeChange("custom");
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
      <Input type="month" value={monthYear} onChange={handleDateChange} className="w-full sm:w-auto"/>
      <ToggleGroup type="single" value={timeRange} onValueChange={handleToggleChange} variant="outline" size="sm" className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
        <ToggleGroupItem value="7d">7 Days</ToggleGroupItem>
        <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
        <ToggleGroupItem value="90d">3 Months</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}