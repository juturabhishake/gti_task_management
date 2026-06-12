"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Calendar as CalendarIcon, BarChart3, Search, ChevronUp, ChevronDown, ArrowUpDown, Filter, ChevronsLeft, ChevronLeft, ChevronsUpDown, Check, ChevronRight, ChevronsRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAccessCheck } from '@/lib/useAccessCheck';

const PAGE_ID_FOR_THIS_FORM = 1;
const COLORS = { plan: "#3b82f6", pending: "#f59e0b", completed: "#10b981" };
function TableColumnHeader({ column, title, sortConfig, onSort, filters, options, onFilterToggle, onSelectAll, onClearFilter, zClass = "z-20" }) {
  const isSorted = sortConfig?.key === column;
  const isFiltered = filters && filters[column] && filters[column].length > 0;

  return (
    <th className={cn("sticky top-0 px-4 py-3 font-semibold whitespace-nowrap border-b border-primary/20 bg-card shadow-sm", zClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="cursor-pointer hover:text-primary/70 flex items-center gap-1 transition-colors select-none" onClick={() => onSort && onSort(column)}>
          {title}
          {isSorted ? (sortConfig.direction === 1 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : (<ArrowUpDown className="h-3 w-3 opacity-30" />)}
        </span>
        {options && options.length > 0 && onFilterToggle && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/20 cursor-pointer p-0">
                <Filter className={cn("h-3 w-3", isFiltered ? "text-primary fill-primary" : "text-muted-foreground")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 border-primary/20" align="start">
              <Command>
                <CommandInput placeholder={`Search ${title}...`} className="h-9" />
                <CommandEmpty>No option found.</CommandEmpty>
                <div className="p-2 border-b border-primary/10 flex justify-between bg-background z-10">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-primary/20 cursor-pointer" onClick={() => onSelectAll(column, options)}>Select All</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-primary/20 cursor-pointer" onClick={() => onClearFilter(column)}>Clear</Button>
                </div>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {options.map((opt) => {
                    const isChecked = filters[column]?.includes(opt);
                    return (
                      <CommandItem key={opt} onSelect={() => onFilterToggle(column, opt)} className="cursor-pointer">
                        <Checkbox checked={isChecked} className="mr-2 border-primary data-[state=checked]:bg-primary pointer-events-none" readOnly />
                        {opt || "(Empty)"}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </th>
  );
}
export default function CalibrationDashboard() {
  const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [data, setData] = useState({ summary: { Plan: 0, Pending: 0, Completed: 0 }, daily: [], calibratedBy: [], extCalibrationLabs: [] });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [activeFilter, setActiveFilter] = useState("month");
  const [tabRange, setTabRange] = useState("1M");
  const [monthYear, setMonthYear] = useState(format(new Date(), "yyyy-MM"));
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [currentUser, setCurrentUser] = useState({ fullName: "", empId: "" });
  const EXT_COLUMNS = [
  { key: "LabName", title: "Lab Name" },
  { key: "CertifiedOn", title: "Certified On" },
  { key: "ValidUntil", title: "Valid Until" }
];

const [extGlobalSearch, setExtGlobalSearch] = useState("");
const [extPage, setExtPage] = useState(1);
const [extPageSize, setExtPageSize] = useState(999999);
const [extTempPage, setExtTempPage] = useState(1);
const [extSortConfig, setExtSortConfig] = useState({ key: null, direction: 0 });
const [extColumnFilters, setExtColumnFilters] = useState({});

useEffect(() => {
  setExtTempPage(extPage);
}, [extPage]);

const extOptions = useMemo(() => {
  const opts = {};
  const source = data.extCalibrationLabs || [];
  opts.LabName = Array.from(new Set(source.map(r => r.LabName || ""))).sort();
  opts.CertifiedOn = Array.from(new Set(source.map(r => r.CertifiedOn ? format(new Date(r.CertifiedOn), 'yyyy-MM-dd') : "-"))).sort();
  opts.ValidUntil = Array.from(new Set(source.map(r => r.ValidUntil ? format(new Date(r.ValidUntil), 'yyyy-MM-dd') : "-"))).sort();
  return opts;
}, [data.extCalibrationLabs]);

const processedExtData = useMemo(() => {
  let processed = [...(data.extCalibrationLabs || [])];

  if (extGlobalSearch) {
    const searchLower = extGlobalSearch.toLowerCase();
    processed = processed.filter(row => {
      const cOn = row.CertifiedOn ? format(new Date(row.CertifiedOn), 'yyyy-MM-dd') : "-";
      const vUntil = row.ValidUntil ? format(new Date(row.ValidUntil), 'yyyy-MM-dd') : "-";
      return (
        String(row.LabName || "").toLowerCase().includes(searchLower) ||
        cOn.includes(searchLower) ||
        vUntil.includes(searchLower)
      );
    });
  }

  Object.entries(extColumnFilters).forEach(([col, activeFilters]) => {
    if (activeFilters && activeFilters.length > 0) {
      processed = processed.filter(row => {
        let cellVal = row[col] || "-";
        if ((col === "CertifiedOn" || col === "ValidUntil") && row[col]) {
          cellVal = format(new Date(row[col]), 'yyyy-MM-dd');
        }
        return activeFilters.includes(cellVal);
      });
    }
  });

  if (extSortConfig.key && extSortConfig.direction !== 0) {
    processed.sort((a, b) => {
      let valA = a[extSortConfig.key] || "-";
      let valB = b[extSortConfig.key] || "-";
      if (extSortConfig.key === "CertifiedOn" || extSortConfig.key === "ValidUntil") {
        valA = a[extSortConfig.key] ? format(new Date(a[extSortConfig.key]), 'yyyy-MM-dd') : "-";
        valB = b[extSortConfig.key] ? format(new Date(b[extSortConfig.key]), 'yyyy-MM-dd') : "-";
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return extSortConfig.direction === 1 ? -1 : 1;
      if (valA > valB) return extSortConfig.direction === 1 ? 1 : -1;
      return 0;
    });
  }
  return processed;
}, [data.extCalibrationLabs, extGlobalSearch, extColumnFilters, extSortConfig]);

const extTotalRecords = processedExtData.length;
const extTotalPages = extPageSize === 999999 ? 1 : Math.ceil(extTotalRecords / extPageSize) || 1;
const extPaginatedData = extPageSize === 999999 ? processedExtData : processedExtData.slice((extPage - 1) * extPageSize, extPage * extPageSize);

const handleExtSort = (column) => {
  let newDirection = 1;
  if (extSortConfig.key === column) {
    if (extSortConfig.direction === 1) newDirection = 2;
    else if (extSortConfig.direction === 2) {
      newDirection = 0;
      column = null;
    }
  }
  setExtSortConfig({ key: column, direction: newDirection });
  setExtPage(1);
};

const toggleExtFilter = (column, value) => {
  setExtColumnFilters(prev => {
    const current = prev[column] || [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    return { ...prev, [column]: updated };
  });
  setExtPage(1);
};

const selectAllExtFilter = (column, allValues) => {
  setExtColumnFilters(prev => ({ ...prev, [column]: allValues }));
  setExtPage(1);
};

const clearExtFilter = (column) => {
  setExtColumnFilters(prev => ({ ...prev, [column]: [] }));
  setExtPage(1);
};
  const currentDates = useMemo(() => {
    let start = new Date();
    let end = new Date();
    if (activeFilter === "tab") {
      if (tabRange === "1W") start = subDays(new Date(), 7);
      if (tabRange === "1M") start = subMonths(new Date(), 1);
      if (tabRange === "6M") start = subMonths(new Date(), 6);
    } else if (activeFilter === "month") {
      const [year, month] = monthYear.split("-");
      start = startOfMonth(new Date(year, month - 1));
      end = endOfMonth(new Date(year, month - 1));
    } else if (activeFilter === "range") {
      start = dateRange?.from || new Date();
      end = dateRange?.to || new Date();
    }
    return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  }, [activeFilter, tabRange, monthYear, dateRange]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("userInfo") || localStorage.getItem("secure-ls");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          fullName: parsed.fullname || parsed.fullName || parsed.name || "",
          empId: parsed.empid || parsed.empId || ""
        });
      } else {
        const rawName = localStorage.getItem("fullname") || localStorage.getItem("fullName") || "";
        const rawEmp = localStorage.getItem("empid") || localStorage.getItem("empId") || "";
        setCurrentUser({ fullName: rawName, empId: rawEmp });
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!isAccessLoading && hasAccess) {
      fetchDashboardData();
    }
  }, [currentDates, isAccessLoading, hasAccess]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const xml = `<Request><StartDate>${currentDates.start}</StartDate><EndDate>${currentDates.end}</EndDate></Request>`;
      const res = await fetch("/api/dashboard/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: xml
      });
      const result = await res.json();
      setData(result);
    } catch (e) {
      setData({ summary: { Plan: 0, Pending: 0, Completed: 0 }, daily: [], calibratedBy: [] });
    } finally {
      setLoading(false);
    }
  };

  const processedCalibratedBy = useMemo(() => {
    if (!data.calibratedBy || data.calibratedBy.length === 0) return [];
    const list = [...data.calibratedBy];
    const userIdx = list.findIndex(item => {
      const itemName = (item.name || "").toLowerCase().trim();
      const currentName = (currentUser.fullName || "").toLowerCase().trim();
      const currentEmp = (currentUser.empId || "").toLowerCase().trim();
      return (currentName && itemName.includes(currentName)) || (currentEmp && itemName.includes(currentEmp));
    });
    if (userIdx > -1) {
      const matchedItem = { ...list[userIdx], isCurrentUser: true };
      list.splice(userIdx, 1);
      list.unshift(matchedItem);
    }
    return list;
  }, [data.calibratedBy, currentUser]);

  const barChartWidth = useMemo(() => {
    const minWidth = 600;
    const computedWidth = processedCalibratedBy.length * 85;
    return Math.max(minWidth, computedWidth);
  }, [processedCalibratedBy]);

  const evalStatusData = [
    { name: "Plan", count: data.summary.Plan, fill: COLORS.plan },
    { name: "Pending", count: data.summary.Pending, fill: COLORS.pending },
    { name: "Completed", count: data.summary.Completed, fill: COLORS.completed }
  ];
  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const diffDays = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays < 30;
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold text-foreground mb-1.5">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((pld, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.fill || pld.color || "hsl(var(--primary))" }} />
                <span className="text-xs text-muted-foreground font-medium">{pld.payload.name || pld.name}:</span>
                <span className="text-xs font-black text-foreground">{pld.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isAccessLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!hasAccess) return <div className="h-screen flex items-center justify-center text-muted-foreground bg-background">Access Denied.</div>;

  return (
    <div className="@container/main min-h-screen bg-background flex flex-col gap-1">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Calibration Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor gauge evaluations and operator performance.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto bg-muted/40 p-2 rounded-xl border border-border">
          <ToggleGroup hidden type="single" value={activeFilter === "tab" ? tabRange : ""} onValueChange={(v) => { if(v) { setActiveFilter("tab"); setTabRange(v); } }} variant="outline" size="sm" className="bg-background/80 rounded-lg p-0.5 w-full md:w-auto grid grid-cols-3 md:flex">
            <ToggleGroupItem value="1W" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-9">1W</ToggleGroupItem>
            <ToggleGroupItem value="1M" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-9">1M</ToggleGroupItem>
            <ToggleGroupItem value="6M" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-9">6M</ToggleGroupItem>
          </ToggleGroup>
          <div className="h-6 w-[1px] bg-border hidden md:block" />
          <Input type="month" value={monthYear} onChange={(e) => { setMonthYear(e.target.value); setActiveFilter("month"); }} className="h-9 w-full md:w-[160px] bg-background/80 focus-visible:ring-primary/30 text-foreground" />
          <div className="h-6 w-[1px] bg-border hidden md:block" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" onClick={() => setActiveFilter("range")} className={cn("h-9 w-full md:w-auto justify-start text-left font-normal bg-background/80", activeFilter === "range" ? "border-primary text-primary" : "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {activeFilter === "range" && dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>) : (format(dateRange.from, "LLL dd"))) : (<span>Custom Range</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={(r) => { setDateRange(r); setActiveFilter("range"); }} numberOfMonths={isMobile ? 1 : 2} />
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Range</span>
        <div className="flex items-center gap-2 text-sm font-bold text-foreground bg-background px-3 py-1.5 rounded-lg shadow-sm border border-border">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span>{format(new Date(currentDates.start), "MMM dd, yyyy")}</span>
          <span className="text-muted-foreground font-normal">to</span>
          <span>{format(new Date(currentDates.end), "MMM dd, yyyy")}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Dashboard Metrics...</span>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-1">
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-1">
              <Card className="lg:col-span-1 shadow-sm border-border bg-card flex flex-col">
                <CardHeader className="pb-2 border-b border-border/80">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground"><BarChart3 className="h-4 w-4 text-primary" /> Evaluation Status</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evalStatusData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/30" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} tickMargin={10} />
                        <YAxis tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "currentColor", className: "text-muted/10" }} content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Evaluations" radius={[4, 4, 0, 0]} activeBar={false} animationDuration={1000}>
                          {evalStatusData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} className="transition-opacity hover:opacity-85" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex justify-between items-center px-4"><span className="text-xs text-primary font-bold uppercase tracking-wider">Plan</span><span className="text-lg font-black text-foreground">{data.summary.Plan}</span></div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 flex justify-between items-center px-4"><span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Pending</span><span className="text-lg font-black text-foreground">{data.summary.Pending}</span></div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 flex justify-between items-center px-4"><span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Completed</span><span className="text-lg font-black text-foreground">{data.summary.Completed}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-sm border-border bg-card flex flex-col overflow-hidden">
                <CardHeader className="pb-2 border-b border-border/80">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground"><BarChart3 className="h-4 w-4 text-primary" /> Calibrated By Performance</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-x-auto overflow-y-hidden">
                  <div className="h-full min-h-[350px] p-6 pt-4 overflow-x-auto">
                    <div style={{ width: barChartWidth, height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedCalibratedBy} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/30" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} tickMargin={12} angle={-15} textAnchor="end" />
                          <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} allowDecimals={false} />
                          <Tooltip cursor={{ fill: "currentColor", className: "text-muted/10" }} content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Evaluations" radius={[4, 4, 0, 0]} activeBar={false} animationDuration={1000}>
                            {processedCalibratedBy.map((entry, index) => (
                              <Cell key={index} fill={entry.isCurrentUser ? "hsl(var(--primary))" : "#10b981"} className="transition-opacity hover:opacity-85" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full shadow-sm border-border bg-card flex flex-col overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/80">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground"><Activity className="h-4 w-4 text-primary" /> Daily Trends</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-x-auto overflow-y-hidden">
                <div className="min-w-[700px] h-[350px] p-6 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/30" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} tickMargin={10} minTickGap={30} />
                      <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground font-semibold" tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconSize={8} formatter={(val) => <span className="text-xs font-bold text-muted-foreground">{val}</span>} />
                      <Line type="monotone" dataKey="Plan" name="Plan" stroke={COLORS.plan} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} animationDuration={1200} />
                      <Line type="monotone" dataKey="Pending" name="Pending" stroke={COLORS.pending} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} animationDuration={1200} />
                      <Line type="monotone" dataKey="Completed" name="Completed" stroke={COLORS.completed} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} animationDuration={1200} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full shadow-sm border-border bg-card flex flex-col overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                  <Activity className="h-4 w-4 text-primary" /> Ext. Calibration Lab Report
                </CardTitle>
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Global Search..."
                    value={extGlobalSearch}
                    onChange={(e) => {
                      setExtGlobalSearch(e.target.value);
                      setExtPage(1);
                    }}
                    className="pl-9 bg-background/50 border-primary/20 focus-visible:ring-primary h-9 w-full"
                  />
                </div>
              </CardHeader>
                  
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px]">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-primary uppercase bg-primary/10 sticky top-0 z-30 shadow-sm backdrop-blur-md">
                      <tr>
                        {EXT_COLUMNS.map((col) => (
                          <TableColumnHeader
                            key={col.key}
                            column={col.key}
                            title={col.title}
                            sortConfig={extSortConfig}
                            onSort={handleExtSort}
                            filters={extColumnFilters}
                            options={extOptions[col.key]}
                            onFilterToggle={toggleExtFilter}
                            onSelectAll={selectAllExtFilter}
                            onClearFilter={clearExtFilter}
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {extPaginatedData.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-6 text-muted-foreground bg-background">No records found.</td></tr>
                      ) : (
                        extPaginatedData.map((row, idx) => {
                          const expiring = isExpiringSoon(row.ValidUntil);
                          const cOn = row.CertifiedOn ? format(new Date(row.CertifiedOn), 'yyyy-MM-dd') : '-';
                          const vUntil = row.ValidUntil ? format(new Date(row.ValidUntil), 'yyyy-MM-dd') : '-';

                          return (
                            <tr key={idx} className={cn("border-b border-border/50 transition-colors bg-background", expiring ? "bg-red-500/15 hover:bg-red-500/25" : "hover:bg-primary/5")}>
                              <td className={cn("px-4 py-3", expiring && "text-red-700 dark:text-red-400 font-semibold")}>{row.LabName || "-"}</td>
                              <td className={cn("px-4 py-3", expiring && "text-red-700 dark:text-red-400 font-semibold")}>{cOn}</td>
                              <td className={cn("px-4 py-3 font-bold", expiring ? "text-red-700 dark:text-red-400" : "text-foreground")}>{vUntil}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                    
                <div className="bg-primary/5 p-3 border-t border-primary/20 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0 relative">
                  <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
                    <span className="text-sm text-primary whitespace-nowrap">Rows per page:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-[90px] h-8 bg-background/50 border-primary/20 justify-between font-normal">
                          {extPageSize === 999999 ? "All" : extPageSize}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[90px] p-0" align="start">
                        <Command>
                          <CommandGroup>
                            {[10, 50, 100, 200, 500, "All"].map((size) => (
                              <CommandItem
                                key={size}
                                value={size.toString()}
                                onSelect={(currentValue) => {
                                  setExtPageSize(currentValue.toLowerCase() === "all" ? 999999 : Number(currentValue));
                                  setExtPage(1);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    (extPageSize === 999999 && size === "All") || extPageSize === size ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {size}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                          
                  <div className="w-full md:flex-1 text-center order-first md:order-none mb-2 md:mb-0">
                    <span className="text-sm text-primary font-medium">
                      Showing {processedExtData.length === 0 ? 0 : ((extPage - 1) * (extPageSize === 999999 ? extTotalRecords : extPageSize)) + 1} to {Math.min(extPage * (extPageSize === 999999 ? extTotalRecords : extPageSize), extTotalRecords)} of {extTotalRecords} entries
                    </span>
                  </div>
                          
                  <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                    <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer shrink-0" onClick={() => setExtPage(1)} disabled={extPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer shrink-0" onClick={() => setExtPage(p => Math.max(1, p - 1))} disabled={extPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center mx-1 sm:mx-2">
                      <Input type="number" min={1} max={extTotalPages} value={extTempPage} onChange={(e) => setExtTempPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            let val = parseInt(extTempPage);
                            if (!isNaN(val) && val >= 1 && val <= extTotalPages) setExtPage(val);
                            else setExtTempPage(extPage);
                          }
                        }}
                        onBlur={() => {
                          let val = parseInt(extTempPage);
                          if (!isNaN(val) && val >= 1 && val <= extTotalPages) setExtPage(val);
                          else setExtTempPage(extPage);
                        }}
                        className="w-12 sm:w-16 h-8 text-center bg-background/50 border-primary/20 focus-visible:ring-primary px-1"
                      />
                      <span className="text-sm text-primary ml-2 whitespace-nowrap">of {extTotalPages}</span>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer shrink-0" onClick={() => setExtPage(p => Math.min(extTotalPages, p + 1))} disabled={extPage === extTotalPages || extTotalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer shrink-0" onClick={() => setExtPage(extTotalPages)} disabled={extPage === extTotalPages || extTotalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>             
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}