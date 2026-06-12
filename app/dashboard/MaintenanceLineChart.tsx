/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

interface LineChartProps {
  data: any[];
  timeRange: string;
  monthYear: string;
  onTimeRangeChange: (value: string) => void;
  onMonthYearChange: (value: string) => void;
}

const chartConfig = {
  active: { label: "Active", color: "hsl(var(--chart-1))" },
  scrap: { label: "Scrap", color: "hsl(var(--chart-2))" },
  no_status: { label: "No Status", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export function MaintenanceLineChart({ data, timeRange, monthYear, onTimeRangeChange, onMonthYearChange }: LineChartProps) {
  
  const handleToggleChange = (value: string) => {
    if (value) onTimeRangeChange(value);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthYearChange(e.target.value);
    onTimeRangeChange("custom");
  };

  return (
    <Card className="shadow-lg transition-shadow duration-300 hover:shadow-primary/20">
      <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle>Equipment Status Over Time</CardTitle>
          <CardDescription>Daily count of equipment statuses.</CardDescription>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input type="month" value={monthYear} onChange={handleDateChange} className="w-full sm:w-auto"/>
          <ToggleGroup type="single" value={timeRange} onValueChange={handleToggleChange} variant="outline" size="sm" className="w-full sm:w-auto [&>button]:flex-1">
            <ToggleGroupItem value="7d">7D</ToggleGroupItem>
            <ToggleGroupItem value="30d">30D</ToggleGroupItem>
            <ToggleGroupItem value="90d">3M</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-active)" stopOpacity={0.1} /></linearGradient>
              <linearGradient id="fillScrap" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-scrap)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-scrap)" stopOpacity={0.1} /></linearGradient>
              <linearGradient id="fillNoStatus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-no_status)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-no_status)" stopOpacity={0.1} /></linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} indicator="dot" />} />
            <Area dataKey="active" type="natural" fill="url(#fillActive)" stroke="var(--color-active)" stackId="a" />
            <Area dataKey="scrap" type="natural" fill="url(#fillScrap)" stroke="var(--color-scrap)" stackId="a" />
            <Area dataKey="no_status" type="natural" fill="url(#fillNoStatus)" stroke="var(--color-no_status)" stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}