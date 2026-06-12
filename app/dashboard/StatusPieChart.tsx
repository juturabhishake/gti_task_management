"use client";

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface PieChartProps {
  data: { name: string; value: number; fill: string }[];
  title: string;
  description: string;
}

const chartConfig = {
  value: { label: "Count" },
} satisfies ChartConfig;

export function StatusPieChart({ data, title, description }: PieChartProps) {
  const [activeSlices, setActiveSlices] = React.useState<string[]>(() => data.map(d => d.name));

  const filteredData = React.useMemo(() => {
    return data.filter(d => activeSlices.includes(d.name));
  }, [data, activeSlices]);

  const toggleSlice = (name: string) => {
    setActiveSlices(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <Card className="@container/main flex h-full flex-col shadow-lg transition-shadow duration-300 hover:shadow-primary/20">
      <CardHeader className="items-center pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={filteredData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} paddingAngle={filteredData.length > 1 ? 5 : 0}>
              {filteredData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {data.map((item) => (
              <button
                key={item.name}
                onClick={() => toggleSlice(item.name)}
                className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 transition-all",
                  activeSlices.includes(item.name) ? "opacity-100" : "opacity-40 hover:opacity-70"
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name} ({item.value})
              </button>
            ))}
          </div>
      </CardContent>
    </Card>
  );
}