"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar as CalendarIcon, Loader2, ChevronDown, ChevronUp, 
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, CheckSquare, Layers, Clock, Activity, Target, CheckCircle2 
} from 'lucide-react';
import * as RadixPopover from '@radix-ui/react-popover';
import SecureLS from 'secure-ls';
import { cn } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, LabelList, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";
const PAGE_ID_FOR_THIS_FORM = 2046;
const getSecureLSValue = (key) => {
  if (typeof window !== 'undefined') {
    try {
      const ls = new SecureLS({ encodingType: "aes" });
      const val = ls.get(key);
      return val ? String(val).replace(/['"]/g, '').trim() : '';
    } catch (e) {
      return '';
    }
  }
  return '';
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeMainRow = (row) => ({
  ...row,
  TargetHours: toNumber(row?.TargetHours),
  ActualHours: toNumber(row?.ActualHours),
  TotalTasks: toNumber(row?.TotalTasks),
});

function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => 
    String(opt ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button className="p-1 hover:bg-primary/20 rounded-xl transition text-muted-foreground hover:text-primary cursor-pointer">
          <Filter className={cn("w-3.5 h-3.5", selected.length > 0 ? 'text-primary fill-primary/20' : '')} />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-56 bg-card border border-primary/20 rounded-xl shadow-xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={5} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-primary/20 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
          <div className="max-h-36 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-2">No options found</p>
            ) : (
              filtered.map((opt, idx) => {
                const isChecked = selected.includes(opt);
                return (
                  <button
                    key={idx}
                    onClick={() => onChange(opt)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl cursor-pointer text-left transition-colors",
                      isChecked ? "bg-primary/10 text-primary font-bold" : "hover:bg-primary/5 text-foreground"
                    )}
                  >
                    <CheckSquare className={cn("w-3.5 h-3.5 shrink-0", isChecked ? 'text-primary fill-primary/20' : 'text-muted-foreground/40')} />
                    <span className="truncate">{String(opt ?? '')}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between">
            <button 
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="text-[10px] font-black text-primary hover:underline cursor-pointer uppercase tracking-wider px-2"
            >
              Clear Filters
            </button>
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function MultiSelectHierarchyPopover({ data = [], selectedValues = [], onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = data.filter(item => {
    const main = item.name || '';
    const path = item.path || '';
    return main.toLowerCase().includes(search.toLowerCase()) || path.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSearch(''); }}>
      <RadixPopover.Trigger asChild>
        <button className="flex items-center justify-between text-sm bg-card border border-primary/20 rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all shadow-sm font-semibold cursor-pointer w-full text-left h-10 hover:bg-primary/5">
          <span className="truncate">
            {selectedValues.length === 0 
              ? placeholder 
              : `${selectedValues.length} Selected`}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-primary" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-[var(--radix-popover-trigger-width)] md:w-80 bg-card border border-primary/30 rounded-2xl shadow-2xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
          />
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            <button
              type="button"
              onClick={() => onSelect([])}
              className="w-full text-center rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest text-primary font-black hover:bg-primary/10 transition-colors cursor-pointer border border-primary/10 mb-1"
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
                  className={cn(
                    "w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer",
                    isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                    <span className="font-bold text-xs truncate">{item.name}</span>
                    {item.path && (
                      <span className="text-[9px] opacity-80 mt-0.5 leading-tight">{item.path}</span>
                    )}
                  </div>
                  <CheckSquare className={cn("w-4 h-4 shrink-0 ml-1", isSelected ? "text-primary fill-primary/20" : "text-muted-foreground/30")} />
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

const SortIcon = ({ column, sorting }) => {
  if (sorting.column !== column || sorting.direction === 'none') {
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 shrink-0 ml-1.5 transition-opacity group-hover:opacity-100" />;
  }
  if (sorting.direction === 'asc') {
    return <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />;
  }
  return <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />;
};

function UserTasksSubTable({ userId, date }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, size: 50 });
  const [sorting, setSorting] = useState({ column: null, direction: 'none' });
  const [columnFilters, setColumnFilters] = useState({
    TaskName: [],
    Status: [],
    TargetHours: [],
    ActualHours: []
  });

  useEffect(() => {
    const fetchUserTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/workload?action=userTasks&userId=${userId}&date=${date}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setTasks(json.data.map(t => ({
            ...t,
            TargetHours: toNumber(t.TargetHours),
            ActualHours: toNumber(t.ActualHours)
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserTasks();
  }, [userId, date]);

  const handleSortCycle = (column) => {
    setSorting(prev => {
      let nextDirection = 'none';
      if (prev.column === column) {
        if (prev.direction === 'none') nextDirection = 'asc';
        else if (prev.direction === 'asc') nextDirection = 'desc';
        else nextDirection = 'none';
      } else {
        nextDirection = 'asc';
      }
      return { column: nextDirection === 'none' ? null : column, direction: nextDirection };
    });
  };

  const applySorting = (data) => {
    const { column, direction } = sorting;
    if (!column || direction === 'none') return data;
    return [...data].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      if (['TargetHours', 'ActualHours'].includes(column)) {
        valA = toNumber(valA);
        valB = toNumber(valB);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getUniqueValues = (key) => Array.from(new Set(tasks.map(item => {
    if (key === 'TargetHours' || key === 'ActualHours') return String(toNumber(item[key]));
    return String(item?.[key] ?? '');
  }).filter(value => value !== '')));

  const toggleFilterValue = (column, value) => {
    setColumnFilters(prev => {
      const active = prev[column] || [];
      const next = active.includes(String(value)) ? active.filter(v => v !== String(value)) : [...active, String(value)];
      return { ...prev, [column]: next };
    });
  };

  const clearColumnFilter = (column) => setColumnFilters(prev => ({ ...prev, [column]: [] }));

  const processedTasks = useMemo(() => {
    let output = [...tasks];
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      output = output.filter(t => {
        const searchStr = [
          t?.TaskName,
          t?.Status,
          toNumber(t?.TargetHours),
          toNumber(t?.ActualHours)
        ].map(value => String(value ?? '')).join(' ').toLowerCase();
        return searchStr.includes(query);
      });
    }
    Object.keys(columnFilters).forEach(col => {
      const selectedFilters = columnFilters[col] || [];
      if (selectedFilters.length > 0) {
        output = output.filter(item => {
          let val = item[col];
          if (col === 'TargetHours' || col === 'ActualHours') val = toNumber(val);
          return selectedFilters.includes(String(val ?? ''));
        });
      }
    });
    return applySorting(output);
  }, [tasks, searchQuery, columnFilters, sorting]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, columnFilters, sorting]);

  const totalPages = Math.ceil(processedTasks.length / pagination.size) || 1;
  const pagedTasks = processedTasks.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size);
  const setPage = (p) => { if (p >= 1 && p <= totalPages) setPagination(prev => ({ ...prev, page: p })); };
  const setSize = (s) => setPagination({ page: 1, size: s });

  return (
    <div className="@container/main bg-primary/5 p-4 border-b border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-3 bg-primary/10 border-b border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black tracking-tight text-primary uppercase">Detailed Tasks</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/60" />
            <input 
              type="text"
              placeholder="Search specific tasks..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-background border border-primary/20 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all text-foreground"
            />
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead className="bg-card border-b border-primary/20 text-primary font-black sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TaskName')}>
                      <span>Task Name</span>
                      <SortIcon column="TaskName" sorting={sorting} />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues('TaskName')} 
                      selected={columnFilters.TaskName} 
                      onChange={val => toggleFilterValue('TaskName', val)} 
                      onClear={() => clearColumnFilter('TaskName')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap w-40">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('Status')}>
                      <span>Status</span>
                      <SortIcon column="Status" sorting={sorting} />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues('Status')} 
                      selected={columnFilters.Status} 
                      onChange={val => toggleFilterValue('Status', val)} 
                      onClear={() => clearColumnFilter('Status')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap w-40">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TargetHours')}>
                      <span>Target Hrs</span>
                      <SortIcon column="TargetHours" sorting={sorting} />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues('TargetHours')} 
                      selected={columnFilters.TargetHours} 
                      onChange={val => toggleFilterValue('TargetHours', val)} 
                      onClear={() => clearColumnFilter('TargetHours')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap w-40">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('ActualHours')}>
                      <span>Actual Hrs</span>
                      <SortIcon column="ActualHours" sorting={sorting} />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues('ActualHours')} 
                      selected={columnFilters.ActualHours} 
                      onChange={val => toggleFilterValue('ActualHours', val)} 
                      onClear={() => clearColumnFilter('ActualHours')}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-primary">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Retrieving Tasks...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                pagedTasks.map((task, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 transition-colors">
                    <td className="p-3 whitespace-nowrap text-foreground">{task.TaskName}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        (task.Status === 'Resolved' || task.Status === 'Done') ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" :
                        task.Status === 'In Progress' ? "bg-blue-500/20 text-blue-600 border border-blue-500/30" :
                        "bg-primary/10 text-primary border border-primary/20"
                      )}>
                        {task.Status || 'To Do'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary/60" /> {task.TargetHours}
                    </td>
                    <td className="p-3 whitespace-nowrap text-primary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {task.ActualHours}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2.5 border-t border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-primary font-bold">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select 
              value={pagination.size} 
              onChange={e => setSize(parseInt(e.target.value))}
              className="bg-background border border-primary/30 rounded-lg px-2 py-1 focus:outline-none text-foreground cursor-pointer"
            >
              {[10, 50, 100, 200].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
              <option value={999999}>All</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button disabled={pagination.page <= 1} onClick={() => setPage(1)} className="p-1 rounded-lg border border-primary/30 hover:bg-primary/20 disabled:opacity-50 transition-colors bg-background text-primary">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="p-1 rounded-lg border border-primary/30 hover:bg-primary/20 disabled:opacity-50 transition-colors bg-background text-primary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-background rounded-lg border border-primary/20">{pagination.page} / {totalPages}</span>
            <button disabled={pagination.page >= totalPages} onClick={() => setPage(pagination.page + 1)} className="p-1 rounded-lg border border-primary/30 hover:bg-primary/20 disabled:opacity-50 transition-colors bg-background text-primary">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button disabled={pagination.page >= totalPages} onClick={() => setPage(totalPages)} className="p-1 rounded-lg border border-primary/30 hover:bg-primary/20 disabled:opacity-50 transition-colors bg-background text-primary">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkloadSummary() {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  
  const [dashboardData, setDashboardData] = useState({
    hoursChart: [],
    statusChart: [],
    mainTable: []
  });
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, size: 50 });
  const [sorting, setSorting] = useState({ column: null, direction: 'none' });
  const [columnFilters, setColumnFilters] = useState({
    Name: [],
    Role: [],
    GroupName: [],
    DeptName: [],
    SectionName: [],
    TeamName: [],
    TotalTasks: [],
    TotalHours: []
  });

  useEffect(() => {
    setEmployeeId(getSecureLSValue('employee_id'));
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!employeeId) return;
      try {
        const res = await fetch(`/api/tasks/workload?action=teams&employeeId=${employeeId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          const formattedTeams = json.data.map(t => ({ id: t.Id, name: t.Name, path: t.Path, isCurrentUserTeam: t.IsCurrentUserTeam }));
          setAllTeams(formattedTeams);
          const defaultTeams = formattedTeams.filter(t => t.isCurrentUserTeam === 1).map(t => String(t.id));
          setSelectedTeams(defaultTeams);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTeams();
  }, [employeeId]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!selectedDate) return;
      setLoading(true);
      try {
        const tIds = selectedTeams.join(',');
        const res = await fetch(`/api/tasks/workload?action=dashboard&date=${selectedDate}&teamIds=${tIds}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setDashboardData({
            ...json.data,
            mainTable: Array.isArray(json.data.mainTable) ? json.data.mainTable.map(normalizeMainRow) : [],
            hoursChart: Array.isArray(json.data.hoursChart) ? json.data.hoursChart : [],
            statusChart: Array.isArray(json.data.statusChart) ? json.data.statusChart : []
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setExpandedRow(null);
      }
    };
    fetchDashboard();
  }, [selectedDate, selectedTeams]);

  const handleSortCycle = (column) => {
    setSorting(prev => {
      let nextDirection = 'none';
      if (prev.column === column) {
        if (prev.direction === 'none') nextDirection = 'asc';
        else if (prev.direction === 'asc') nextDirection = 'desc';
        else nextDirection = 'none';
      } else {
        nextDirection = 'asc';
      }
      return { column: nextDirection === 'none' ? null : column, direction: nextDirection };
    });
  };

  const applySorting = (data) => {
    const { column, direction } = sorting;
    if (!column || direction === 'none') return data;
    return [...data].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      if (['TargetHours', 'ActualHours', 'TotalHours', 'TotalTasks'].includes(column)) {
        valA = toNumber(valA);
        valB = toNumber(valB);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getUniqueValues = (key) => {
    return Array.from(new Set(dashboardData.mainTable.map(item => {
      if (key === 'TargetHours' || key === 'ActualHours' || key === 'TotalHours' || key === 'TotalTasks') return String(toNumber(item[key]));
      return String(item?.[key] ?? '');
    }).filter(value => value !== '')));
  };

  const toggleFilterValue = (column, value) => {
    setColumnFilters(prev => {
      const active = prev[column] || [];
      const next = active.includes(String(value)) ? active.filter(v => v !== String(value)) : [...active, String(value)];
      return { ...prev, [column]: next };
    });
  };

  const clearColumnFilter = (column) => setColumnFilters(prev => ({ ...prev, [column]: [] }));

  const processedTable = useMemo(() => {
    let output = [...dashboardData.mainTable];
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      output = output.filter(row => {
        const searchStr = [
          row?.Name,
          row?.Role,
          row?.GroupName,
          row?.DeptName,
          row?.SectionName,
          row?.TeamName,
          toNumber(row?.TotalTasks),
          toNumber(row?.TargetHours),
          toNumber(row?.ActualHours)
        ].map(value => String(value ?? '')).join(' ').toLowerCase();
        return searchStr.includes(query);
      });
    }
    Object.keys(columnFilters).forEach(col => {
      const selectedFilters = columnFilters[col] || [];
      if (selectedFilters.length > 0) {
        output = output.filter(item => {
          let val = item[col];
          if (['TargetHours', 'ActualHours', 'TotalHours', 'TotalTasks'].includes(col)) val = toNumber(val);
          return selectedFilters.includes(String(val ?? ''));
        });
      }
    });
    return applySorting(output);
  }, [dashboardData.mainTable, searchQuery, columnFilters, sorting]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, columnFilters, sorting]);

  const totalPages = Math.ceil(processedTable.length / pagination.size) || 1;
  const pagedTable = processedTable.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size);

  const setPage = (p) => { if (p >= 1 && p <= totalPages) setPagination(prev => ({ ...prev, page: p })); };
  const setSize = (s) => setPagination({ page: 1, size: s });

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex flex-col p-1 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-2 bg-card border border-primary/20 rounded-xl p-4 md:p-5 shadow-lg">
        <div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-3 text-primary">
            <Layers className="w-6 h-6 md:w-8 md:h-8" />
            Workload Summary
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-bold">Comprehensive insights into team performance, hours, and task statuses.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-56">
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-primary/5 border border-primary/20 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-black transition-all shadow-sm text-primary"
            />
          </div>
          <div className="w-full sm:w-64">
            <MultiSelectHierarchyPopover 
              data={allTeams}
              selectedValues={selectedTeams}
              onSelect={setSelectedTeams}
              placeholder="All Assigned Teams"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-2 mb-2">
        <div className="bg-card border border-primary/20 rounded-xl p-4 md:p-6 shadow-lg flex flex-col min-h-[390px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="relative z-10 mb-4">
            <h3 className="font-black text-sm md:text-base text-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Total Hours Tracked
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Actual hours compared with the planned shift</p>
          </div>
          <div className="flex-1 w-full min-h-[300px] relative z-10 overflow-x-auto scrollbar-thin">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : dashboardData.hoursChart.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground bg-primary/5 rounded-xl border border-dashed border-primary/20">No data available for the selected parameters</div>
            ) : (
              <div
                className="h-full min-h-[300px]"
                style={{ width: `${Math.max(100, dashboardData.hoursChart.length * 90)}px`, minWidth: '100%' }}
              >
                <ChartContainer
                  config={{
                    ActualHours: {
                      label: "Actual Hours",
                      color: "var(--chart-1)",
                    },
                    RemainingHours: {
                      label: "Remaining",
                      color: "var(--chart-2)",
                    },
                  }}
                  className="h-full w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={dashboardData.hoursChart.map(item => ({
                      ...item,
                      ActualHours: Number(item.ActualHours || 0),
                      RemainingHours: Math.max(0, Number(item.ShiftHours || 0) - Number(item.ActualHours || 0)),
                    }))}
                    margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="Username"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      label={{ value: "Hours", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fontWeight: 800 } }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          labelKey="Username"
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="ActualHours"
                      stackId="hours"
                      fill="var(--color-ActualHours)"
                      radius={[0, 0, 5, 5]}
                    />
                    <Bar
                      dataKey="RemainingHours"
                      stackId="hours"
                      fill="var(--color-RemainingHours)"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-primary/20 rounded-xl p-4 md:p-6 shadow-lg flex flex-col min-h-[390px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="relative z-10 mb-4">
            <h3 className="font-black text-sm md:text-base text-foreground uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Completion Trajectory
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Completed and pending tasks by team member</p>
          </div>
          <div className="flex-1 w-full min-h-[300px] relative z-10 overflow-x-auto scrollbar-thin">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : dashboardData.statusChart.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground bg-primary/5 rounded-xl border border-dashed border-primary/20">No data available for the selected parameters</div>
            ) : (
              <div
                className="h-full min-h-[300px]"
                style={{ width: `${Math.max(100, dashboardData.statusChart.length * 90)}px`, minWidth: '100%' }}
              >
                <ChartContainer
                  config={{
                    CompletedTasks: {
                      label: "Completed",
                      color: "var(--chart-2)",
                    },
                    PendingTasks: {
                      label: "Pending",
                      color: "var(--chart-4)",
                    },
                  }}
                  className="h-full w-full"
                >
                  <LineChart
                    accessibilityLayer
                    data={dashboardData.statusChart}
                    margin={{ top: 24, right: 24, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="Username"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      label={{ value: "Tasks", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11, fontWeight: 800 } }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      dataKey="CompletedTasks"
                      type="natural"
                      stroke="var(--color-CompletedTasks)"
                      strokeWidth={3}
                      dot={{
                        fill: "var(--color-CompletedTasks)",
                        r: 4,
                      }}
                      activeDot={{
                        r: 7,
                      }}
                    >
                      <LabelList
                        position="top"
                        offset={10}
                        className="fill-foreground"
                        fontSize={10}
                        dataKey="CompletedTasks"
                      />
                    </Line>
                    <Line
                      dataKey="PendingTasks"
                      type="natural"
                      stroke="var(--color-PendingTasks)"
                      strokeWidth={3}
                      dot={{
                        fill: "var(--color-PendingTasks)",
                        r: 4,
                      }}
                      activeDot={{
                        r: 7,
                      }}
                    >
                      <LabelList
                        position="top"
                        offset={10}
                        className="fill-foreground"
                        fontSize={10}
                        dataKey="PendingTasks"
                      />
                    </Line>
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden">
        <div className="p-4 md:p-5 bg-primary/5 border-b border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-primary uppercase">Team Workforce Roster</h2>
            <p className="text-xs text-muted-foreground font-bold mt-0.5">Select any member row to inspect detailed task allocations.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <input 
              type="text"
              placeholder="Search roster globally..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-background border border-primary/20 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all text-foreground"
            />
          </div>
        </div>

        <div className="h-[620px] max-h-[620px] overflow-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="bg-card border-b border-primary/20 text-muted-foreground font-black sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('Name')}>
                      <span>Name</span>
                      <SortIcon column="Name" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('Name')} selected={columnFilters.Name} onChange={val => toggleFilterValue('Name', val)} onClear={() => clearColumnFilter('Name')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('Role')}>
                      <span>Role</span>
                      <SortIcon column="Role" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('Role')} selected={columnFilters.Role} onChange={val => toggleFilterValue('Role', val)} onClear={() => clearColumnFilter('Role')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('GroupName')}>
                      <span>Group</span>
                      <SortIcon column="GroupName" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('GroupName')} selected={columnFilters.GroupName} onChange={val => toggleFilterValue('GroupName', val)} onClear={() => clearColumnFilter('GroupName')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('DeptName')}>
                      <span>Department</span>
                      <SortIcon column="DeptName" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('DeptName')} selected={columnFilters.DeptName} onChange={val => toggleFilterValue('DeptName', val)} onClear={() => clearColumnFilter('DeptName')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('SectionName')}>
                      <span>Section</span>
                      <SortIcon column="SectionName" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('SectionName')} selected={columnFilters.SectionName} onChange={val => toggleFilterValue('SectionName', val)} onClear={() => clearColumnFilter('SectionName')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TeamName')}>
                      <span>Team</span>
                      <SortIcon column="TeamName" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('TeamName')} selected={columnFilters.TeamName} onChange={val => toggleFilterValue('TeamName', val)} onClear={() => clearColumnFilter('TeamName')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card w-32">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TotalTasks')}>
                      <span className="text-primary">Total Tasks</span>
                      <SortIcon column="TotalTasks" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('TotalTasks')} selected={columnFilters.TotalTasks} onChange={val => toggleFilterValue('TotalTasks', val)} onClear={() => clearColumnFilter('TotalTasks')} />
                  </div>
                </th>
                <th className="p-4 whitespace-nowrap bg-card w-32">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TotalHours')}>
                      <span className="text-primary">Total Hours</span>
                      <SortIcon column="TotalHours" sorting={sorting} />
                    </div>
                    <FilterPopover options={getUniqueValues('TotalHours')} selected={columnFilters.TotalHours} onChange={val => toggleFilterValue('TotalHours', val)} onClear={() => clearColumnFilter('TotalHours')} />
                  </div>
                </th>
                <th className="w-12 p-4 bg-card"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-primary">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Loading team roster...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedTable.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2 bg-primary/5 rounded-2xl border border-dashed border-primary/20 p-6 mx-4">
                      <CheckCircle2 className="w-10 h-10 opacity-30 text-primary" />
                      <span className="font-bold">No workforce members match the criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTable.map((row) => {
                  const isExpanded = expandedRow === row.UserID;
                  return (
                    <React.Fragment key={row.UserID}>
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : row.UserID)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isExpanded ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-primary/5 border-l-4 border-l-transparent"
                        )}
                      >
                        <td className={cn("p-4 whitespace-nowrap font-black", isExpanded ? "text-primary" : "text-foreground")}>{row.Name}</td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">{row.Role || '-'}</td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">{row.GroupName || '-'}</td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">{row.DeptName || '-'}</td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">{row.SectionName || '-'}</td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground">{row.TeamName || '-'}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-primary text-primary-foreground font-black px-3 py-1.5 rounded-lg shadow-sm">{row.TotalTasks}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-black text-primary text-sm">{toNumber(row?.ActualHours)} <span className="text-[10px] opacity-70">ACT</span></span>
                            <span className="text-[10px] text-muted-foreground">{toNumber(row?.TargetHours)} TGT</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button className={cn("p-1.5 rounded-full transition-colors", isExpanded ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary")}>
                            <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b-4 border-b-primary">
                            <UserTasksSubTable userId={row.UserID} date={selectedDate} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-primary font-bold shrink-0">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select 
              value={pagination.size} 
              onChange={e => setSize(parseInt(e.target.value))}
              className="bg-background border border-primary/30 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer"
            >
              {[50, 100, 200, 500, 1000].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
              <option value={999999}>All</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button disabled={pagination.page <= 1} onClick={() => setPage(1)} className="flex items-center justify-center h-8 w-8 rounded-xl border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="flex items-center justify-center h-8 w-8 rounded-xl border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3">
              <input 
                type="number" 
                value={pagination.page}
                min={1} max={totalPages}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setPage(val);
                }}
                className="w-12 text-center bg-background border border-primary/30 rounded-xl py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs font-black"
              />
              <span>/ {totalPages}</span>
            </div>
            <button disabled={pagination.page >= totalPages} onClick={() => setPage(pagination.page + 1)} className="flex items-center justify-center h-8 w-8 rounded-xl border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button disabled={pagination.page >= totalPages} onClick={() => setPage(totalPages)} className="flex items-center justify-center h-8 w-8 rounded-xl border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}