"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, CheckSquare, Calendar as CalendarIcon, Loader2, BarChart3, Filter,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, Clock,
  Activity, ShieldCheck, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown
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
const PAGE_ID_FOR_THIS_FORM = 2044;
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

const getHierarchyPathParts = (item, allOptions) => {
  const pathNames = [];
  const itemId = item.Id ?? item.id;
  const itemType = item.Type ?? item.type;
  
  let current = allOptions.find(o => 
    (o.Id ?? o.id) === itemId && 
    (o.Type ?? o.type).toLowerCase() === itemType.toLowerCase()
  );
  
  const visited = new Set();
  
  while (current) {
    const uniqueKey = `${current.Type ?? current.type}-${current.Id ?? current.id}`;
    if (visited.has(uniqueKey)) break;
    visited.add(uniqueKey);
    
    pathNames.push(current.Name ?? current.name);
    
    const parentId = current.ParentId ?? current.parentId;
    if (!parentId) break;
    
    const currentType = (current.Type ?? current.type).toLowerCase();
    let parentType = "";
    if (currentType === "team") parentType = "section";
    else if (currentType === "section") parentType = "department";
    else if (currentType === "department") parentType = "group";
    
    current = allOptions.find(o => 
      (o.Id ?? o.id) === parentId && 
      (o.Type ?? o.type).toLowerCase() === parentType
    );
  }
  
  return pathNames.reverse();
};

function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => 
    String(opt ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1.5 hover:bg-muted/80 rounded-lg transition-colors text-muted-foreground hover:text-primary cursor-pointer">
          <Filter className={`w-3.5 h-3.5 ${selected.length > 0 ? 'text-primary fill-primary/20' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-60 bg-card border border-border/80 rounded-xl shadow-2xl p-3 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
        <input 
          type="text" 
          placeholder="Filter values..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-3">No matching items</p>
          ) : (
            filtered.map((opt, idx) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl cursor-pointer text-left transition-colors ${isChecked ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground font-medium'}`}
                >
                  <CheckSquare className={`w-4 h-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  <span className="truncate">{String(opt ?? '')}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border/60 pt-2.5 mt-2.5 flex justify-between items-center">
          <span className="text-[10px] font-bold text-muted-foreground">{selected.length} selected</span>
          <button 
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TeamSelectorPopover({ data = [], fullOptions = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => String(item.id) === String(selectedValue));
  const filtered = data.filter(item => {
    const main = item.name || '';
    return main.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSearch(''); }}>
      <RadixPopover.Trigger asChild>
        <button className="w-full sm:w-56 flex items-center justify-between text-xs bg-background hover:bg-muted/50 border border-border/80 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-sm font-medium cursor-pointer text-left">
          <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="w-72 bg-card border border-border/80 rounded-xl shadow-2xl p-3 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search team hierarchy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setOpen(false);
              }}
              className="w-full text-left rounded-xl px-3 py-2.5 text-xs text-primary font-bold hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>All Teams</span>
              {!selectedValue && <CheckSquare className="w-4 h-4 text-primary" />}
            </button>
            {filtered.map((item, idx) => {
              const isSelected = String(selectedValue) === String(item.id);
            //   const itemForPath = { Id: `team-${item.id}`, Type: 'Team' };
              const itemForPath = { Id: Number(item.id), Type: 'Team' };
              const pathParts = getHierarchyPathParts(itemForPath, fullOptions);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer ${isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                    <span className="font-bold text-xs truncate">{item.name}</span>
                    {pathParts.length > 1 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-normal opacity-80 leading-tight">
                        {pathParts.slice(0, -1).map((part, pIdx) => (
                          <span key={pIdx} className="inline-block whitespace-nowrap">
                            {pIdx > 0 && " ➔ "}
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isSelected && <CheckSquare className="w-4 h-4 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function MultiSelectUserPopover({ data = [], selectedValues = [], onSelect, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = data.filter(item => {
    const main = item.name || '';
    const sub = item.employeeId || '';
    return main.toLowerCase().includes(search.toLowerCase()) || sub.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { if (!disabled) { setOpen(val); if (!val) setSearch(''); } }}>
      <RadixPopover.Trigger asChild>
        <button 
          disabled={disabled}
          className={cn(
            "w-full sm:w-56 flex items-center justify-between text-xs bg-background hover:bg-muted/50 border border-border/80 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-sm font-medium cursor-pointer text-left relative overflow-hidden",
            disabled && "opacity-60 cursor-not-allowed bg-muted/40 pointer-events-none border-dashed border-primary/40"
          )}
        >
          {disabled ? (
            <span className="flex items-center gap-2 text-primary font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Loading Users...</span>
            </span>
          ) : (
            <>
              <span className="truncate">
                {selectedValues.length === 0 
                  ? placeholder 
                  : `${selectedValues.length} Users Selected`}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="w-64 bg-card border border-border/80 rounded-xl shadow-2xl p-3 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            <button
              type="button"
              onClick={() => onSelect([])}
              className="w-full text-left rounded-xl px-3 py-2 text-xs text-primary font-bold hover:bg-primary/10 transition-colors cursor-pointer"
            >
              Clear All Selections
            </button>
            {filtered.map((item, idx) => {
              const isSelected = selectedValues.includes(String(item.id));
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const next = isSelected 
                      ? selectedValues.filter(v => v !== String(item.id))
                      : [...selectedValues, String(item.id)];
                    onSelect(next);
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer ${isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                    <span className="font-bold text-xs truncate">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">{item.employeeId}</span>
                  </div>
                  <CheckSquare className={`w-4 h-4 shrink-0 ml-1 ${isSelected ? 'text-primary' : 'text-muted-foreground/20'}`} />
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function PopoverDropdown({ data = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => String(item.id) === String(selectedValue));
  const filtered = data.filter(item => {
    const main = item.name || '';
    return main.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSearch(''); }}>
      <RadixPopover.Trigger asChild>
        <button className="w-full sm:w-56 flex items-center justify-between text-xs bg-background hover:bg-muted/50 border border-border/80 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-sm font-medium cursor-pointer text-left">
          <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="w-56 bg-card border border-border/80 rounded-xl shadow-2xl p-3 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search shift..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setOpen(false);
              }}
              className="w-full text-left rounded-xl px-3 py-2 text-xs text-primary font-bold hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>All Shifts</span>
              {!selectedValue && <CheckSquare className="w-4 h-4 text-primary" />}
            </button>
            {filtered.map((item, idx) => {
              const isSelected = String(selectedValue) === String(item.id);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer ${isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="truncate">{item.name}</span>
                  {isSelected && <CheckSquare className="w-4 h-4 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export default function TeamPerformance() {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [hierarchyOptions, setHierarchyOptions] = useState([]);
  const [selectedUserIdList, setSelectedUserIdList] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState(2);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, size: 100 });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [columnFilters, setColumnFilters] = useState({
    Username: [],
    ShiftName: [],
    TeamName: []
  });

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  useEffect(() => {
    const empId = getSecureLSValue('employee_id');
    setEmployeeId(empId || '');
    fetchShifts();
    fetchTeams();
    fetchHierarchyOptions();
  }, []);

  useEffect(() => {
    fetchUsersForTeam();
  }, [selectedTeamId]);

  useEffect(() => {
    const handleResize = () => {
      setNumberOfMonths(window.innerWidth < 768 ? 1 : 2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (employeeId && dateRange?.from && dateRange?.to && !usersLoading) {
      fetchPerformance();
    }
  }, [employeeId, dateRange, selectedUserIdList, selectedShiftId, selectedTeamId, usersLoading]);

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/tasks/team-performance?action=shifts');
      const json = await res.json();
      if (res.ok && json.data) {
        setShifts(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/tasks/team-performance?action=teams');
      const json = await res.json();
      if (res.ok && json.data) {
        setTeams(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsersForTeam = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch(`/api/tasks/team-performance?action=users&teamId=${selectedTeamId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setUsers(json.data);
        setSelectedUserIdList([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchHierarchyOptions = async () => {
    try {
      const res = await fetch('/api/user-hierarchy?action=options');
      const json = await res.json();
      if (res.ok && json.data) {
        setHierarchyOptions(json.data);
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
      const userIdsString = selectedUserIdList.join(',');
      const res = await fetch(`/api/tasks/team-performance?startDate=${start}&endDate=${end}&userIds=${userIdsString}&shiftId=${selectedShiftId}&teamId=${selectedTeamId}`);
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

  const maxValInTrend = Math.max(...performanceData.map(d => Math.max(d.ScheduledHours || 0, d.ActualHours || 0, d.IdleHours || 0)), 8);
  const dynamicChartWidth = Math.max(800, performanceData.length * 90);

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
      return `M ${x - 20} ${y} L ${x + 20} ${y}`;
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

  const getUniqueValues = (key) => {
    return Array.from(new Set(performanceData.map(item => item[key]).filter(Boolean)));
  };

  const toggleFilterValue = (column, value) => {
    setColumnFilters(prev => {
      const active = prev[column] || [];
      const next = active.includes(value) ? active.filter(v => v !== value) : [...active, value];
      return { ...prev, [column]: next };
    });
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:text-foreground transition-colors" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />;
  };

  const applyFilters = (data) => {
    let output = [...data];
    Object.keys(columnFilters).forEach(col => {
      const selectedFilters = columnFilters[col];
      if (selectedFilters && selectedFilters.length > 0) {
        output = output.filter(item => selectedFilters.includes(item[col]));
      }
    });

    if (globalSearchTerm.trim()) {
      const search = globalSearchTerm.toLowerCase();
      output = output.filter(item => 
        item.Username?.toLowerCase().includes(search) || 
        item.EmployeeId?.toLowerCase().includes(search) ||
        item.ShiftName?.toLowerCase().includes(search) ||
        item.TeamName?.toLowerCase().includes(search)
      );
    }

    return output;
  };

  const filteredData = applyFilters(performanceData);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pagination.size) || 1;
  const pagedData = sortedData.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size);

  const setPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      setPagination(prev => ({ ...prev, page: p }));
    }
  };

  const setSize = (s) => {
    setPagination({ page: 1, size: s });
  };

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex flex-col p-1 space-y-6 w-full animate-in fade-in duration-300 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-7 bg-primary rounded-full shadow-sm" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Team Performance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 ml-5">
            Monitor team utilization, evaluate working hours, and review quality metrics.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPerformance} 
          disabled={loading || usersLoading}
          className="self-end sm:self-center bg-card hover:bg-muted/60 border-border/80 shadow-sm text-xs font-semibold px-4 py-2.5 h-auto rounded-xl transition-all"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2 text-primary", (loading || usersLoading) && "animate-spin")} />
          Refresh Metrics
        </Button>
      </div>

      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-xl shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div className="flex flex-wrap items-stretch sm:items-center gap-4 w-full xl:w-auto">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3 text-primary" />
              <span>Timeframe</span>
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[260px] justify-start text-left font-medium text-xs border-border/80 bg-background hover:bg-muted/50 h-10 rounded-xl px-3.5 shadow-sm transition-all",
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
              <PopoverContent className="w-auto p-0 z-[9999] rounded-xl border-border shadow-2xl overflow-hidden" align="start">
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
              <Users className="w-3 h-3 text-primary" />
              <span>Team Filter</span>
            </span>
            <TeamSelectorPopover 
              data={teams}
              fullOptions={hierarchyOptions}
              selectedValue={selectedTeamId}
              onSelect={setSelectedTeamId}
              placeholder="All Teams"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-primary" />
              <span>User Selection</span>
            </span>
            <MultiSelectUserPopover 
              data={users}
              selectedValues={selectedUserIdList}
              onSelect={setSelectedUserIdList}
              placeholder="All Members"
              disabled={usersLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              <span>Shift Filter</span>
            </span>
            <PopoverDropdown 
              data={shifts}
              selectedValue={selectedShiftId}
              onSelect={setSelectedShiftId}
              placeholder="All Shifts"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-3 xl:pt-0 border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold px-3.5 py-2 rounded-xl">
            <Users className="w-4 h-4" />
            {performanceData.length} {performanceData.length === 1 ? 'Member' : 'Members'} Tracked
          </span>
        </div>
      </div>

      {(loading || usersLoading) ? (
        <div className="flex flex-col items-center justify-center min-h-[480px] bg-card border border-border/60 rounded-xl shadow-sm space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            {usersLoading ? "Updating user directory for selected team..." : "Analyzing performance metrics..."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Team Analytics Visualizer</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Comparative view of scheduled capacity, actual output, and idle hours across team members</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold bg-muted/40 px-3.5 py-2 rounded-xl border border-border/40 self-start sm:self-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm shadow-sm" />
                  <span className="text-foreground">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-sm" />
                  <span className="text-foreground">Actual Work</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm shadow-sm" />
                  <span className="text-foreground">Idle Gap</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full mt-6 flex flex-col justify-center min-h-[280px]">
              {performanceData.length === 0 ? (
                <div className="w-full h-64 flex flex-col items-center justify-center text-sm text-muted-foreground space-y-2 border-2 border-dashed border-border/60 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                  <span>No performance records match your active criteria</span>
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

                    <path d={getSvgAreaPath("ScheduledHours")} fill="url(#area-sched)" />
                    <path d={getSvgAreaPath("ActualHours")} fill="url(#area-act)" />
                    <path d={getSvgAreaPath("IdleHours")} fill="url(#area-idle)" />

                    <path d={getSvgLinePath("ScheduledHours")} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={getSvgLinePath("ActualHours")} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={getSvgLinePath("IdleHours")} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    <g>
                      {performanceData.map((day, idx) => {
                        const x = getX(idx, performanceData.length);
                        const isHovered = hoveredIdx === idx;
                        const label = day.Username ? (day.Username.length > 12 ? `${day.Username.slice(0, 10)}..` : day.Username) : '';
                        const gapWidth = Math.max(40, (dynamicChartWidth - 120) / Math.max(1, performanceData.length - 1));
                        
                        return (
                          <g key={idx}>
                            {isHovered && (
                              <line x1={x} y1={25} x2={x} y2={220} stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeDasharray="3,3" />
                            )}

                            <circle cx={x} cy={getY(day.ScheduledHours)} r={isHovered ? "6" : "4.5"} fill="#3b82f6" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />
                            <circle cx={x} cy={getY(day.ActualHours)} r={isHovered ? "6" : "4.5"} fill="#10b981" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />
                            <circle cx={x} cy={getY(day.IdleHours)} r={isHovered ? "6" : "4.5"} fill="#f59e0b" stroke="var(--background)" strokeWidth="2" className="transition-all duration-150" />
                            
                            <text x={x} y="242" textAnchor="middle" className={cn("text-[11px] font-semibold fill-muted-foreground transition-colors", isHovered && "fill-primary font-bold")}>
                              {label}
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
                        const tipWidth = 180;
                        const tipHeight = 90;
                        
                        let tipX = x - tipWidth / 2;
                        if (tipX < 60) tipX = 60;
                        if (tipX + tipWidth > dynamicChartWidth - 40) tipX = dynamicChartWidth - 40 - tipWidth;

                        return (
                          <g className="filter drop-shadow-lg">
                            <rect x={tipX} y={15} width={tipWidth} height={tipHeight} rx={10} fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                            <path d={`M ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15) - 6} 105 L ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15)} 111 L ${Math.min(Math.max(x, tipX + 15), tipX + tipWidth - 15) + 6} 105 Z`} fill="var(--card)" />
                            
                            <text x={tipX + 14} y={35} className="text-[11px] font-extrabold fill-foreground">
                              {day.Username} <tspan className="font-normal fill-muted-foreground">({day.EmployeeId})</tspan>
                            </text>
                            <line x1={tipX + 14} y1={42} x2={tipX + tipWidth - 14} y2={42} stroke="currentColor" className="text-border/60" strokeWidth="1" />

                            <circle cx={tipX + 20} cy={55} r="4" fill="#3b82f6" />
                            <text x={tipX + 30} y={58} className="text-[11px] font-medium fill-muted-foreground">Scheduled:</text>
                            <text x={tipX + tipWidth - 14} y={58} textAnchor="end" className="text-[11px] font-bold fill-foreground">{Number(day.ScheduledHours || 0).toFixed(2)}h</text>

                            <circle cx={tipX + 20} cy={70} r="4" fill="#10b981" />
                            <text x={tipX + 30} y={73} className="text-[11px] font-medium fill-muted-foreground">Actual Work:</text>
                            <text x={tipX + tipWidth - 14} y={73} textAnchor="end" className="text-[11px] font-bold fill-emerald-500">{Number(day.ActualHours || 0).toFixed(2)}h</text>

                            <circle cx={tipX + 20} cy={85} r="4" fill="#f59e0b" />
                            <text x={tipX + 30} y={88} className="text-[11px] font-medium fill-muted-foreground">Idle Gap:</text>
                            <text x={tipX + tipWidth - 14} y={88} textAnchor="end" className="text-[11px] font-bold fill-amber-500">{Number(day.IdleHours || 0).toFixed(2)}h</text>
                          </g>
                        );
                      })()}
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-bold text-foreground text-base">Member Performance Records</h4>
                  <p className="text-xs text-muted-foreground">Detailed logs matching your active filters</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary font-extrabold px-2.5 py-1 rounded-full ml-2">
                  {filteredData.length} Records
                </span>
              </div>
              <div className="relative w-full sm:w-72">
                <input 
                  type="text" 
                  placeholder="Search name, ID, shift, team..."
                  value={globalSearchTerm}
                  onChange={e => { setGlobalSearchTerm(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                  className="w-full text-xs bg-background border border-border/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground shadow-sm transition-all"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="overflow-auto h-[500px] relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-card border-b border-border/80 text-muted-foreground font-bold sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-4 whitespace-nowrap bg-card">
                      <div className="flex items-center gap-2 group">
                        <button 
                          type="button"
                          onClick={() => handleSort('Username')}
                          className="flex items-center gap-1.5 font-bold hover:text-foreground cursor-pointer select-none transition-colors"
                        >
                          <span>Member Name</span>
                          {getSortIcon('Username')}
                        </button>
                        <FilterPopover 
                          options={getUniqueValues('Username')} 
                          selected={columnFilters.Username} 
                          onChange={val => toggleFilterValue('Username', val)} 
                          onClear={() => clearColumnFilter('Username')}
                        />
                      </div>
                    </th>
                    <th className="p-4 whitespace-nowrap bg-card">
                      <div className="flex items-center gap-2 group">
                        <button 
                          type="button"
                          onClick={() => handleSort('ShiftName')}
                          className="flex items-center gap-1.5 font-bold hover:text-foreground cursor-pointer select-none transition-colors"
                        >
                          <span>Shift Schedule</span>
                          {getSortIcon('ShiftName')}
                        </button>
                        <FilterPopover 
                          options={getUniqueValues('ShiftName')} 
                          selected={columnFilters.ShiftName} 
                          onChange={val => toggleFilterValue('ShiftName', val)} 
                          onClear={() => clearColumnFilter('ShiftName')}
                        />
                      </div>
                    </th>
                    <th className="p-4 whitespace-nowrap bg-card">
                      <div className="flex items-center gap-2 group">
                        <button 
                          type="button"
                          onClick={() => handleSort('TeamName')}
                          className="flex items-center gap-1.5 font-bold hover:text-foreground cursor-pointer select-none transition-colors"
                        >
                          <span>Team Assignment</span>
                          {getSortIcon('TeamName')}
                        </button>
                        <FilterPopover 
                          options={getUniqueValues('TeamName')} 
                          selected={columnFilters.TeamName} 
                          onChange={val => toggleFilterValue('TeamName', val)} 
                          onClear={() => clearColumnFilter('TeamName')}
                        />
                      </div>
                    </th>
                    <th className="p-4 whitespace-nowrap text-right bg-card">
                      <button 
                        type="button"
                        onClick={() => handleSort('ScheduledHours')}
                        className="flex items-center justify-end gap-1.5 font-bold hover:text-foreground cursor-pointer select-none ml-auto group transition-colors"
                      >
                        <span>Scheduled</span>
                        {getSortIcon('ScheduledHours')}
                      </button>
                    </th>
                    <th className="p-4 whitespace-nowrap text-right bg-card">
                      <button 
                        type="button"
                        onClick={() => handleSort('ActualHours')}
                        className="flex items-center justify-end gap-1.5 font-bold hover:text-foreground cursor-pointer select-none ml-auto group transition-colors"
                      >
                        <span>Actual Work</span>
                        {getSortIcon('ActualHours')}
                      </button>
                    </th>
                    <th className="p-4 whitespace-nowrap text-right bg-card">
                      <button 
                        type="button"
                        onClick={() => handleSort('IdleHours')}
                        className="flex items-center justify-end gap-1.5 font-bold hover:text-foreground cursor-pointer select-none ml-auto group transition-colors"
                      >
                        <span>Idle Time</span>
                        {getSortIcon('IdleHours')}
                      </button>
                    </th>
                    <th className="p-4 whitespace-nowrap text-right bg-card">
                      <button 
                        type="button"
                        onClick={() => handleSort('UtilizationPct')}
                        className="flex items-center justify-end gap-1.5 font-bold hover:text-foreground cursor-pointer select-none ml-auto group transition-colors"
                      >
                        <span>Utilization</span>
                        {getSortIcon('UtilizationPct')}
                      </button>
                    </th>
                    <th className="p-4 whitespace-nowrap text-right bg-card">
                      <button 
                        type="button"
                        onClick={() => handleSort('AvgScore')}
                        className="flex items-center justify-end gap-1.5 font-bold hover:text-foreground cursor-pointer select-none ml-auto group transition-colors"
                      >
                        <span>Avg Score</span>
                        {getSortIcon('AvgScore')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {pagedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Search className="w-8 h-8 text-muted-foreground/30" />
                          <span className="font-semibold text-sm">No member records found matching filters</span>
                          <Button variant="link" size="sm" onClick={() => { setGlobalSearchTerm(''); setColumnFilters({ Username: [], ShiftName: [], TeamName: [] }); }} className="text-xs text-primary">
                            Reset table filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                              {row.Username?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm leading-tight">{row.Username}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">{row.EmployeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40 font-semibold">{row.ShiftName}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-bold text-foreground">{row.TeamName}</td>
                        <td className="p-4 whitespace-nowrap text-right font-bold text-blue-500">{row.ScheduledHours.toFixed(2)}h</td>
                        <td className="p-4 whitespace-nowrap text-right font-bold text-emerald-500">{row.ActualHours.toFixed(2)}h</td>
                        <td className="p-4 whitespace-nowrap text-right font-bold text-amber-500">{row.IdleHours.toFixed(2)}h</td>
                        <td className="p-4 whitespace-nowrap text-right font-extrabold text-indigo-500">{row.UtilizationPct.toFixed(1)}%</td>
                        <td className="p-4 whitespace-nowrap text-right">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full font-bold text-xs",
                            row.AvgScore >= 80 ? "bg-emerald-500/10 text-emerald-500" : row.AvgScore >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {row.AvgScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-2">
                <span>Displaying rows per page:</span>
                <select 
                  value={pagination.size} 
                  onChange={e => setSize(parseInt(e.target.value))}
                  className="bg-background border border-border/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground font-bold cursor-pointer shadow-sm"
                >
                  {[50, 100, 250, 500].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                  <option value={999999}>All Rows</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={pagination.page <= 1} 
                  onClick={() => setPage(1)}
                  className="h-8 w-8 rounded-xl border-border/80"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={pagination.page <= 1} 
                  onClick={() => setPage(pagination.page - 1)}
                  className="h-8 w-8 rounded-xl border-border/80"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1.5 px-2 font-bold text-foreground">
                  <span>Page</span>
                  <input 
                    type="number" 
                    value={pagination.page}
                    min={1}
                    max={totalPages}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) setPage(val);
                    }}
                    className="w-12 text-center bg-background border border-border/80 rounded-lg py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs shadow-sm"
                  />
                  <span className="text-muted-foreground">of {totalPages}</span>
                </div>

                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={pagination.page >= totalPages} 
                  onClick={() => setPage(pagination.page + 1)}
                  className="h-8 w-8 rounded-xl border-border/80"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={pagination.page >= totalPages} 
                  onClick={() => setPage(totalPages)}
                  className="h-8 w-8 rounded-xl border-border/80"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}