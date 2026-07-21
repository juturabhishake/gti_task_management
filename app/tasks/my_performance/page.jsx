"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, CheckSquare, Calendar as CalendarIcon, Loader2, 
  RefreshCw, AlertCircle, BarChart3, TrendingUp, Award, Clock, 
  Activity, ShieldCheck, Zap
} from 'lucide-react';
import * as RadixPopover from '@radix-ui/react-popover';
import SecureLS from 'secure-ls';
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2043;
const getSecureLSValue = (key) => {
  if (typeof window !== 'undefined') {
    try {
      const ls = new SecureLS({ encodingType: "aes" });
      return ls.get(key) || '';
    } catch (e) {
      return '';
    }
  }
  return '';
};

const getFirstDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

const getLastDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
};

function PopoverDropdown({ data = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => String(item.id) === String(selectedValue));
  const filtered = data.filter(item => {
    const main = item.name || '';
    return main.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button className="w-full sm:w-56 flex items-center justify-between text-xs bg-background hover:bg-muted/50 border border-border/80 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-sm font-medium cursor-pointer text-left">
          <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-56 bg-card border border-border/80 rounded-xl shadow-xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search shift..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/40 border border-border/60 rounded-lg px-2.5 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-3">No shifts found</p>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = String(selectedValue) === String(item.id);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer ${isSelected ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    <span className="truncate">{item.name}</span>
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export default function MyPerformance() {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState(2);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  useEffect(() => {
    const empId = getSecureLSValue('employee_id');
    setEmployeeId(empId || '');
    fetchShifts();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setNumberOfMonths(window.innerWidth < 768 ? 1 : 2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (employeeId && dateRange?.from && dateRange?.to) {
      fetchPerformance();
    }
  }, [employeeId, dateRange, selectedShiftId]);

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/tasks/performance?action=shifts');
      const json = await res.json();
      if (res.ok && json.data) {
        setShifts(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const start = formatLocalDate(dateRange.from);
      const end = formatLocalDate(dateRange.to);
      const res = await fetch(`/api/tasks/performance?employeeId=${employeeId}&startDate=${start}&endDate=${end}&shiftId=${selectedShiftId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setPerformanceData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const summary = performanceData[0] || {
    TotalScheduledHours: 0,
    TotalActualHours: 0,
    TotalIdleHours: 0,
    GlobalUtilization: 0,
    GlobalAverageScore: 0,
    SelectedShiftHours: 8.0,
    TotalPlannedHours: 0,
    TotalDays: 1
  };

  const maxValInTrend = Math.max(...performanceData.map(d => Math.max(d.DailyScheduledHours || 0, d.DailyActualHours || 0, d.DailyIdleHours || 0)), 8);
  const dynamicChartWidth = Math.max(800, performanceData.length * 65);
  const getX = (idx, total) => {
    if (total <= 1) return dynamicChartWidth / 2;
    const startX = 60;
    const endX = dynamicChartWidth - 60;
    return startX + (idx * ((endX - startX) / (total - 1)));
  };

  const getY = (val) => {
    const topY = 30;
    const bottomY = 220;
    const height = bottomY - topY;
    return bottomY - ((val || 0) / maxValInTrend) * height;
  };

  const getSvgLinePath = (key) => {
    if (performanceData.length === 0) return "";
    if (performanceData.length === 1) {
      const x = getX(0, 1);
      const y = getY(performanceData[0][key]);
      return `M ${x - 10} ${y} L ${x + 10} ${y}`;
    }
    return performanceData.map((day, idx) => {
      const x = getX(idx, performanceData.length);
      const y = getY(day[key]);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const getSvgAreaPath = (key) => {
    if (performanceData.length < 2) return "";
    const startX = getX(0, performanceData.length);
    const endX = getX(performanceData.length - 1, performanceData.length);
    const bottomY = 220;

    const lineCommands = performanceData.map((day, idx) => {
      const x = getX(idx, performanceData.length);
      const y = getY(day[key]);
      return `L ${x} ${y}`;
    }).join(" ");

    return `M ${startX} ${bottomY} ${lineCommands} L ${endX} ${bottomY} Z`;
  };

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex flex-col space-y-6 w-full p-1 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-7 bg-primary rounded-full" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              My Performance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 ml-5">
            Analyze your scheduled shifts, actual output, and utilization metrics across any timeframe.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPerformance} 
          disabled={loading}
          className="self-end sm:self-center bg-card hover:bg-muted/60 border-border/80 shadow-sm text-xs font-semibold px-3.5 py-2 h-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2 text-primary", loading && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3 text-primary" />
              <span>Select Date Range</span>
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-medium text-xs border-border/80 bg-background hover:bg-muted/50 h-10 rounded-xl px-3.5 shadow-sm transition-all",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999] rounded-2xl border-border shadow-2xl overflow-hidden" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={numberOfMonths}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              <span>Filter By Shift</span>
            </span>
            <PopoverDropdown 
              data={shifts}
              selectedValue={selectedShiftId}
              onSelect={setSelectedShiftId}
              placeholder="All Shifts"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-lg">
            <Activity className="w-3.5 h-3.5" />
            {summary.TotalDays} {summary.TotalDays === 1 ? 'Day' : 'Days'} In Range
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[450px] bg-card border border-border/60 rounded-2xl shadow-sm space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Analyzing performance metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:border-blue-500/30 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Scheduled Hours</span>
                  <p className="text-3xl font-black text-foreground mt-1.5 tracking-tight">{Number(summary.TotalScheduledHours).toFixed(2)}<span className="text-sm font-semibold text-muted-foreground ml-1">h</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-3 z-10">
                <span className="text-blue-500 font-semibold">{summary.TotalDays} Days</span>
                <span>•</span>
                <span>Total planned time</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:border-emerald-500/30 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actual Hours</span>
                  <p className="text-3xl font-black text-foreground mt-1.5 tracking-tight">{Number(summary.TotalActualHours).toFixed(2)}<span className="text-sm font-semibold text-muted-foreground ml-1">h</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-3 z-10">
                <span className="text-emerald-500 font-semibold">Recorded</span>
                <span>•</span>
                <span>Verified working time</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:border-amber-500/30 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Idle Hours</span>
                  <p className="text-3xl font-black text-foreground mt-1.5 tracking-tight">{Number(summary.TotalIdleHours).toFixed(2)}<span className="text-sm font-semibold text-muted-foreground ml-1">h</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-3 z-10">
                <span className="text-amber-500 font-semibold">Unutilized</span>
                <span>•</span>
                <span>Gap from schedule</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:border-indigo-500/30 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Utilization</span>
                  <p className="text-3xl font-black text-foreground mt-1.5 tracking-tight">{Number(summary.GlobalUtilization).toFixed(1)}<span className="text-sm font-semibold text-muted-foreground ml-1">%</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-3 z-10">
                <span className="text-indigo-500 font-semibold">Efficiency</span>
                <span>•</span>
                <span>Actual vs Planned</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md hover:border-purple-500/30 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Average Score</span>
                  <p className="text-3xl font-black text-foreground mt-1.5 tracking-tight">{Number(summary.GlobalAverageScore).toFixed(1)}<span className="text-sm font-semibold text-muted-foreground ml-1">/100</span></p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-3 z-10">
                <span className="text-purple-500 font-semibold">Quality Index</span>
                <span>•</span>
                <span>Overall rating</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-stretch">
            <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[440px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Performance Trend Analytics</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Daily comparison of scheduled time, actual output, and idle duration</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40 self-start sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm shadow-sm" />
                    <span className="text-foreground">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-sm" />
                    <span className="text-foreground">Actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm shadow-sm" />
                    <span className="text-foreground">Idle</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full mt-6 flex flex-col justify-center min-h-[280px]">
                {performanceData.length === 0 ? (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-sm text-muted-foreground space-y-2 border-2 border-dashed border-border/60 rounded-xl">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                    <span>No performance records found for this date range</span>
                  </div>
                ) : (
                  <div className="w-full relative min-h-[280px] overflow-x-auto pb-4 pt-2">
                    <svg 
                        viewBox={`0 0 ${dynamicChartWidth} 260`} 
                        style={{ minWidth: `${dynamicChartWidth}px` }}
                        className="h-full max-h-[320px] overflow-visible"
                      >
                        <defs>
                          <linearGradient id="area-sched" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="area-act" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="area-idle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <g stroke="currentColor" className="text-border/60" strokeWidth="1" strokeDasharray="4,4">
                          <line x1="60" y1="30" x2={dynamicChartWidth - 60} y2="30" />
                          <line x1="60" y1="77.5" x2={dynamicChartWidth - 60} y2="77.5" />
                          <line x1="60" y1="125" x2={dynamicChartWidth - 60} y2="125" />
                          <line x1="60" y1="172.5" x2={dynamicChartWidth - 60} y2="172.5" />
                          <line x1="60" y1="220" x2={dynamicChartWidth - 60} y2="220" strokeDasharray="none" className="text-border" strokeWidth="1.5" />
                        </g>

                        <g className="text-[11px] font-bold fill-muted-foreground">
                          <text x="45" y="34" textAnchor="end">{maxValInTrend.toFixed(0)}h</text>
                          <text x="45" y="81" textAnchor="end">{(maxValInTrend * 0.75).toFixed(1)}h</text>
                          <text x="45" y="129" textAnchor="end">{(maxValInTrend * 0.5).toFixed(1)}h</text>
                          <text x="45" y="176" textAnchor="end">{(maxValInTrend * 0.25).toFixed(1)}h</text>
                          <text x="45" y="224" textAnchor="end">0h</text>
                        </g>

                        <path d={getSvgAreaPath("DailyScheduledHours")} fill="url(#area-sched)" />
                        <path d={getSvgAreaPath("DailyActualHours")} fill="url(#area-act)" />
                        <path d={getSvgAreaPath("DailyIdleHours")} fill="url(#area-idle)" />

                        <path d={getSvgLinePath("DailyScheduledHours")} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={getSvgLinePath("DailyActualHours")} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={getSvgLinePath("DailyIdleHours")} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        <g>
                          {performanceData.map((day, idx) => {
                            const x = getX(idx, performanceData.length);
                            const isHovered = hoveredIdx === idx;
                            const dateLabel = day.TrendDate ? day.TrendDate.split('T')[0].split('-').slice(1).join('/') : '';
                            const gapWidth = Math.max(30, (dynamicChartWidth - 120) / Math.max(1, performanceData.length - 1));

                            return (
                              <g key={idx}>
                                {isHovered && (
                                  <line x1={x} y1={25} x2={x} y2={220} stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeDasharray="3,3" />
                                )}

                                <circle cx={x} cy={getY(day.DailyScheduledHours)} r={isHovered ? "6" : "4.5"} fill="#3b82f6" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />
                                <circle cx={x} cy={getY(day.DailyActualHours)} r={isHovered ? "6" : "4.5"} fill="#10b981" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />
                                <circle cx={x} cy={getY(day.DailyIdleHours)} r={isHovered ? "6" : "4.5"} fill="#f59e0b" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />

                                <text x={x} y="242" textAnchor="middle" className={cn("text-[11px] font-semibold fill-muted-foreground transition-colors", isHovered && "fill-primary font-bold")}>
                                  {dateLabel}
                                </text>
                            
                                <rect
                                  x={x - gapWidth / 2}
                                  y={10}
                                  width={gapWidth}
                                  height={240}
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredIdx(idx)}
                                  onMouseLeave={() => setHoveredIdx(null)}
                                />
                              </g>
                            );
                          })}
                        </g>
                      
                        <g className="pointer-events-none transition-all duration-150">
                          {hoveredIdx !== null && performanceData[hoveredIdx] && (() => {
                            const x = getX(hoveredIdx, performanceData.length);
                            const day = performanceData[hoveredIdx];
                            const tipWidth = 160;
                            const tipHeight = 84;

                            let tipX = x - tipWidth / 2;
                            if (tipX < 60) tipX = 60;
                            if (tipX + tipWidth > dynamicChartWidth - 40) tipX = dynamicChartWidth - 40 - tipWidth;
                        
                            return (
                              <g className="filter drop-shadow-lg">
                                <rect x={tipX} y={15} width={tipWidth} height={tipHeight} rx={10} fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                                <path d={`M ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15) - 6} 99 L ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15)} 105 L ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15) + 6} 99 Z`} fill="var(--card)" />

                                <text x={tipX + 14} y={35} className="text-[11px] font-extrabold fill-foreground">
                                  {day.TrendDate ? format(new Date(day.TrendDate.split('T')[0]), "MMMM dd, yyyy") : 'Date Details'}
                                </text>
                                <line x1={tipX + 14} y1={42} x2={tipX + tipWidth - 14} y2={42} stroke="currentColor" className="text-border/60" strokeWidth="1" />
                            
                                <circle cx={tipX + 20} cy={55} r="4" fill="#3b82f6" />
                                <text x={tipX + 30} y={58} className="text-[11px] font-medium fill-muted-foreground">Scheduled:</text>
                                <text x={tipX + tipWidth - 14} y={58} textAnchor="end" className="text-[11px] font-bold fill-foreground">{Number(day.DailyScheduledHours || 0).toFixed(1)}h</text>
                            
                                <circle cx={tipX + 20} cy={70} r="4" fill="#10b981" />
                                <text x={tipX + 30} y={73} className="text-[11px] font-medium fill-muted-foreground">Actual Work:</text>
                                <text x={tipX + tipWidth - 14} y={73} textAnchor="end" className="text-[11px] font-bold fill-foreground">{Number(day.DailyActualHours || 0).toFixed(1)}h</text>
                            
                                <circle cx={tipX + 20} cy={85} r="4" fill="#f59e0b" />
                                <text x={tipX + 30} y={88} className="text-[11px] font-medium fill-muted-foreground">Idle Gap:</text>
                                <text x={tipX + tipWidth - 14} y={88} textAnchor="end" className="text-[11px] font-bold fill-foreground">{Number(day.DailyIdleHours || 0).toFixed(1)}h</text>
                              </g>
                            );
                          })()}
                        </g>
                      </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-border/60 pb-4">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>Utilization Snapshot</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Capacity breakdown and overall score</p>
                </div>

                <div className="space-y-3.5 mt-5 text-xs">
                  <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-muted/40 border border-border/40">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Used Capacity
                    </span>
                    <span className="font-extrabold text-indigo-500 text-sm">{Number(summary.GlobalUtilization).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2">
                    <span className="text-muted-foreground">Scheduled per shift</span>
                    <span className="font-bold text-foreground">{Number(summary.SelectedShiftHours).toFixed(1)} hrs</span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2 border-t border-border/40">
                    <span className="text-muted-foreground">Total scheduled</span>
                    <span className="font-bold text-foreground">{Number(summary.TotalScheduledHours).toFixed(2)} hrs</span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2 border-t border-border/40">
                    <span className="text-muted-foreground">Total actual output</span>
                    <span className="font-bold text-emerald-500">{Number(summary.TotalActualHours).toFixed(2)} hrs</span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2 border-t border-border/40">
                    <span className="text-muted-foreground">Total unutilized idle</span>
                    <span className="font-bold text-amber-500">{Number(summary.TotalIdleHours).toFixed(2)} hrs</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quality Rating</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                    {Number(summary.GlobalAverageScore) >= 80 ? 'Excellent' : Number(summary.GlobalAverageScore) >= 60 ? 'Good' : 'Needs Focus'}
                  </span>
                </div>

                <div className="flex items-center justify-center bg-muted/20 border border-border/40 rounded-2xl p-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="52" 
                        stroke="currentColor" 
                        strokeWidth="10" 
                        className="text-muted/40"
                        fill="transparent" 
                      />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="52" 
                        stroke="#a855f7" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(Math.max(summary.GlobalAverageScore, 0), 100) / 100)}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground tracking-tight">{Number(summary.GlobalAverageScore).toFixed(0)}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}