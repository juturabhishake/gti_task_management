"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Check, Clock, Layers, Calendar as CalendarIcon, 
  UserPlus, Loader2, AlertCircle, CheckCircle2, ChevronDown, AlignLeft, ArrowRight,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, CheckSquare, ChevronUp, X
} from 'lucide-react';
import * as RadixPopover from '@radix-ui/react-popover';
import SecureLS from 'secure-ls';
import { cn } from "@/lib/utils";
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2045;
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

function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => 
    String(opt ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button className="p-1 hover:bg-primary/10 rounded-xl transition text-muted-foreground hover:text-foreground cursor-pointer">
          <Filter className={cn("w-3.5 h-3.5", selected.length > 0 ? 'text-primary fill-primary/20' : '')} />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-56 bg-card border border-border/80 rounded-xl shadow-xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={5} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
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
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-muted rounded-xl cursor-pointer text-left text-foreground transition-colors"
                  >
                    <CheckSquare className={cn("w-3.5 h-3.5 shrink-0", isChecked ? 'text-primary fill-primary/10' : 'text-muted-foreground/40')} />
                    <span className="truncate">{String(opt ?? '')}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-border/60 pt-2 mt-2 flex justify-between">
            <button 
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function PopoverDropdown({ data = [], selectedValue, onSelect, placeholder, disabled, loading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => String(item.id) === String(selectedValue));
  const filtered = data.filter(item => {
    const main = item.username || item.name || '';
    const sub = item.employeeId || '';
    return main.toLowerCase().includes(search.toLowerCase()) || sub.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSearch(''); }}>
      <RadixPopover.Trigger asChild>
        <button 
          disabled={disabled || loading}
          className={cn(
            "w-full flex items-center justify-between text-sm bg-background border border-border/80 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm font-semibold text-left",
            (disabled || loading) && "opacity-60 cursor-not-allowed bg-muted/30"
          )}
        >
          <span className="truncate">
            {loading ? "Loading..." : selectedItem ? (selectedItem.employeeId ? `${selectedItem.employeeId} - ${selectedItem.username}` : selectedItem.name) : placeholder}
          </span>
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary" /> : <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />}
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-[var(--radix-popover-trigger-width)] bg-card border border-border/80 rounded-xl shadow-2xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-3">No users found</p>
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
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors text-xs cursor-pointer",
                      isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
                    )}
                  >
                    <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                      <span className="font-bold text-sm truncate">{item.username || item.name}</span>
                      {item.employeeId && (
                        <span className="text-[10px] opacity-80 mt-0.5 truncate font-mono">{item.employeeId}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-1" />}
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
        <button className="flex items-center justify-between text-sm bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-sm font-semibold cursor-pointer w-full text-left h-[42px] hover:bg-muted/60">
          <span className="truncate">
            {selectedValues.length === 0 
              ? placeholder 
              : `${selectedValues.length} Selected`}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-[var(--radix-popover-trigger-width)] bg-card border border-border/80 rounded-xl shadow-2xl p-2 animate-in fade-in-80 zoom-in-95 duration-150" sideOffset={6} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
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
                  className={cn(
                    "w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer",
                    isSelected ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                    <span className="font-bold text-xs truncate">{item.name}</span>
                    {item.path && (
                      <span className="text-[9px] opacity-80 mt-0.5 leading-tight">{item.path}</span>
                    )}
                  </div>
                  <CheckSquare className={cn("w-4 h-4 shrink-0 ml-1", isSelected ? "text-primary" : "text-muted-foreground/30")} />
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export default function AssignmentPage() {
  const { isLoading: isAccessLoading, hasAccess, accessLevel } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [submitState, setSubmitState] = useState('idle');
  const [feedback, setFeedback] = useState(null);

  const [filterData, setFilterData] = useState({ sections: [], teams: [] });
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);

  const [pagination, setPagination] = useState({ page: 1, size: 50 });
  const [sorting, setSorting] = useState({ column: null, direction: 'none' });
  const [columnFilters, setColumnFilters] = useState({
    SubcategoryName: [],
    CategoryName: [],
    GroupName: [],
    DeptName: [],
    SectionName: [],
    TeamName: [],
    Project: []
  });

  const [formState, setFormState] = useState({
    assignedUserId: '',
    severity: '',
    project: '',
    workDate: '',
    dueDate: '',
    taskDetails: ''
  });

  const [isDesktop, setIsDesktop] = useState(true);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setEmployeeId(getSecureLSValue('employee_id'));
    setRole(getSecureLSValue('role').toUpperCase());
  }, []);

  const safeRole = String(role || '').toUpperCase();
  const isHOD = safeRole === 'HOD';
  const isHOS = safeRole === 'HOS';
  const isNormal = !isHOD && !isHOS;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setDrawerHeight(0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const vh = window.innerHeight;
      const newHeight = ((vh - clientY) / vh) * 100;
      setDrawerHeight(Math.max(15, Math.min(newHeight, 85)));
    };
    
    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const fetchFilters = async () => {
      if (isNormal) return;
      try {
        const res = await fetch('/api/tasks/assignment-board?action=filters');
        const json = await res.json();
        if (res.ok && json.data) {
          const sections = json.data.filter(d => String(d.Type || d.type).toLowerCase() === 'section');
          const teams = json.data.filter(d => String(d.Type || d.type).toLowerCase() === 'team');
          setFilterData({ 
            sections: sections.map(s => ({ id: s.Id ?? s.id, name: s.Name || s.name, path: s.Path || s.path })), 
            teams: teams.map(t => ({ id: t.Id ?? t.id, name: t.Name || t.name, path: t.Path || t.path, parentId: t.ParentId ?? t.parentId })) 
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (safeRole) fetchFilters();
  }, [safeRole, isNormal]);

  const availableTeamsForFilter = useMemo(() => {
    if (selectedSections.length === 0) return filterData.teams;
    return filterData.teams.filter(t => selectedSections.includes(String(t.parentId)));
  }, [filterData.teams, selectedSections]);

  const fetchUnassignedTasks = async () => {
    if (!employeeId || !safeRole) return;
    try {
      setLoadingTasks(true);
      const sIds = selectedSections.join(',');
      const tIds = selectedTeams.join(',');
      const res = await fetch(`/api/tasks/assignment-board?action=unassigned&employeeId=${employeeId}&role=${safeRole}&sectionIds=${sIds}&teamIds=${tIds}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setTasks(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchUnassignedTasks();
  }, [employeeId, safeRole, selectedSections, selectedTeams]);

  const selectedTask = useMemo(() => {
    return tasks.find(t => (t.Id ?? t.id) === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (selectedTask) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const res = await fetch(`/api/tasks/assignment-board?action=usersByTeam&teamId=${selectedTask.TeamId ?? selectedTask.teamId}`);
          const json = await res.json();
          if (res.ok && json.data) {
            setTeamUsers(json.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingUsers(false);
        }
      };

      fetchUsers();
      // setFormState({
      //   assignedUserId: '',
      //   severity: '',
      //   project: selectedTask.Project || selectedTask.project || '',
      //   workDate: '',
      //   dueDate: '',
      //   taskDetails: ''
      // });
      setFormState({
        assignedUserId: selectedTask.AssignedUserId || '',
        severity: selectedTask.Severity || '',
        project: selectedTask.Project || selectedTask.project || '',
        workDate: selectedTask.WorkDate ? selectedTask.WorkDate.split('T')[0] : '',
        dueDate: selectedTask.DueDate ? selectedTask.DueDate.split('T')[0] : '',
        taskDetails: selectedTask.TaskDetails || ''
      });
      setFeedback(null);
    } else {
      setTeamUsers([]);
      setFormState({
        assignedUserId: '',
        severity: '',
        project: '',
        workDate: '',
        dueDate: '',
        taskDetails: ''
      });
    }
  }, [selectedTask]);

  const handleRowClick = (id) => {
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
      if (!isDesktop) setDrawerHeight(0);
    } else {
      setSelectedTaskId(id);
      if (!isDesktop) setDrawerHeight(70);
    }
  };

  const toggleDrawerHeight = (e) => {
    e.stopPropagation();
    setDrawerHeight(prev => prev > 50 ? 15 : 70);
  };

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
      return {
        column: nextDirection === 'none' ? null : column,
        direction: nextDirection
      };
    });
  };

  const applySorting = (data) => {
    const { column, direction } = sorting;
    if (!column || direction === 'none') return data;
    return [...data].sort((a, b) => {
      const valA = String(a[column] || '').toLowerCase();
      const valB = String(b[column] || '').toLowerCase();
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getUniqueValues = (key) => {
    return Array.from(new Set(tasks.map(item => item[key]).filter(Boolean)));
  };

  const toggleFilterValue = (column, value) => {
    setColumnFilters(prev => {
      const active = prev[column];
      const next = active.includes(value) ? active.filter(v => v !== value) : [...active, value];
      return { ...prev, [column]: next };
    });
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  const processedTasks = useMemo(() => {
    let output = [...tasks];
    if (showUnassignedOnly) {
      output = output.filter(t => !t.AssignedUserId || parseInt(t.AssignedUserId) === 0);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      output = output.filter(t => {
        const searchStr = `${t.SubcategoryName} ${t.Project} ${t.CategoryName} ${t.TeamName} ${t.SectionName} ${t.DeptName} ${t.GroupName} ${t.MinHours} ${t.MaxHours}`.toLowerCase();
        return searchStr.includes(query);
      });
    }

    Object.keys(columnFilters).forEach(col => {
      const selectedFilters = columnFilters[col];
      if (selectedFilters && selectedFilters.length > 0) {
        output = output.filter(item => selectedFilters.includes(item[col]));
      }
    });

    return applySorting(output);
  }, [tasks, searchQuery, columnFilters, sorting, showUnassignedOnly]);

  const totalPages = Math.ceil(processedTasks.length / pagination.size) || 1;
  const pagedTasks = processedTasks.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size);

  const setPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      setPagination(prev => ({ ...prev, page: p }));
    }
  };

  const setSize = (s) => {
    setPagination({ page: 1, size: s });
  };

  const SortIcon = ({ column }) => {
    if (sorting.column !== column || sorting.direction === 'none') {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 shrink-0 ml-1.5 transition-opacity group-hover:opacity-100" />;
    }
    if (sorting.direction === 'asc') {
      return <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />;
    }
    return <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />;
  };

  const handleSeverityChange = (val) => {
    setFormState(prev => ({ ...prev, severity: val }));
  };

  const handleAssignTask = async () => {
    if (!selectedTaskId) {
      setFeedback({ type: 'error', text: 'Please select a task first.' });
      return;
    }
    if (!formState.assignedUserId || !formState.severity || !formState.workDate || !formState.dueDate) {
      setFeedback({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    setSubmitState('loading');
    setFeedback(null);

    try {
      const res = await fetch('/api/tasks/assignment-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          subcategoryId: selectedTaskId,
          assignedUserId: parseInt(formState.assignedUserId),
          severity: formState.severity,
          project: formState.project,
          workDate: formState.workDate,
          dueDate: formState.dueDate,
          taskDetails: formState.taskDetails
        })
      });

      const result = await res.json();
      if (res.ok && result.message === 'Success') {
        setSubmitState('success');
        setFeedback({ type: 'success', text: 'Task assigned successfully!' });
        setTimeout(() => {
          setSelectedTaskId(null);
          if (!isDesktop) setDrawerHeight(0);
          setSubmitState('idle');
          fetchUnassignedTasks();
        }, 2000);
      } else {
        setSubmitState('error');
        setFeedback({ type: 'error', text: result.message || 'Assignment failed.' });
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } catch (e) {
      setSubmitState('error');
      setFeedback({ type: 'error', text: 'Network connection failure.' });
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const severityOptions = selectedTask ? [
    { id: 'Min', label: 'Low', hours: selectedTask.MinHours ?? selectedTask.minHours ?? 0, activeColor: 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-md', idleColor: 'border-dashed border-border/60 text-muted-foreground hover:bg-emerald-500/5 hover:border-emerald-500/40' },
    { id: 'Medium', label: 'Medium', hours: selectedTask.MediumHours ?? selectedTask.mediumHours ?? 0, activeColor: 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-md', idleColor: 'border-dashed border-border/60 text-muted-foreground hover:bg-amber-500/5 hover:border-amber-500/40' },
    { id: 'Max', label: 'High', hours: selectedTask.MaxHours ?? selectedTask.maxHours ?? 0, activeColor: 'bg-rose-500/10 border-rose-500 text-rose-600 shadow-md', idleColor: 'border-dashed border-border/60 text-muted-foreground hover:bg-rose-500/5 hover:border-rose-500/40' }
  ] : [];
  const totalTasksCount = tasks.length;
  const unassignedTasksCount = tasks.filter(t => !t.AssignedUserId || parseInt(t.AssignedUserId) === 0).length;
  return (
    <div className="@container/main h-[100dvh] w-full bg-background text-foreground flex flex-col overflow-hidden font-sans animate-in fade-in duration-500">
      
      <div className="shrink-0 mb-2 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full bg-card border border-border/80 rounded-xl p-4 shadow-sm z-10">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto shrink-0 flex-1">
          <div className="flex items-center gap-3 shrink-0 mr-2">
            <UserPlus hidden={!isDesktop} className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 hidden className="text-xl md:text-2xl font-black tracking-tight">Task Assignment Hub</h1>
          </div>
          {isHOD && (
            <div className="w-full sm:flex-1 min-w-[200px]">
              <MultiSelectHierarchyPopover 
                data={filterData.sections}
                selectedValues={selectedSections}
                onSelect={(vals) => { setSelectedSections(vals); setSelectedTeams([]); }}
                placeholder="All Sections"
              />
            </div>
          )}
          {(isHOD || isHOS) && (
            <div className="w-full sm:flex-1 min-w-[200px]">
              <MultiSelectHierarchyPopover 
                data={availableTeamsForFilter}
                selectedValues={selectedTeams}
                onSelect={setSelectedTeams}
                placeholder="All Teams"
              />
            </div>
          )}
          <div className="relative w-full sm:flex-1 min-w-[250px] lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Global Search..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-muted/40 border border-border/80 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium transition-all h-[42px]"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            setShowUnassignedOnly(!showUnassignedOnly);
            setPage(1);
          }}
          className={cn(
            "hidden lg:flex items-center gap-2 justify-end shrink-0 text-xs font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer",
            showUnassignedOnly 
              ? "bg-primary text-primary-foreground border-primary shadow-md" 
              : "text-muted-foreground bg-muted/30 border-border/50 hover:bg-muted/50"
          )}
        >
          <Layers className={cn("w-4 h-4", showUnassignedOnly ? "text-primary-foreground" : "text-primary")} />
          <span>
            {showUnassignedOnly ? `${unassignedTasksCount} Unassigned` : `${totalTasksCount} Total Tasks`}
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-2 relative">
        
        <div className="flex flex-col flex-1 min-h-0 shrink-0 bg-card border border-border/80 rounded-xl shadow-sm overflow-hidden z-0">
          <div className="flex-1 overflow-auto relative scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-card border-b border-border/80 text-muted-foreground font-bold sticky top-0 z-20 shadow-sm">
                <tr className="text-primary font-bold">
                  <th className="w-12 p-3 whitespace-nowrap bg-card"></th>
                  <th className="p-3 whitespace-nowrap bg-card min-w-[200px]">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('SubcategoryName')}>
                        <span>Task Name</span>
                        <SortIcon column="SubcategoryName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('SubcategoryName')} 
                        selected={columnFilters.SubcategoryName} 
                        onChange={val => toggleFilterValue('SubcategoryName', val)} 
                        onClear={() => clearColumnFilter('SubcategoryName')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('Project')}>
                        <span>Project</span>
                        <SortIcon column="Project" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('Project')} 
                        selected={columnFilters.Project} 
                        onChange={val => toggleFilterValue('Project', val)} 
                        onClear={() => clearColumnFilter('Project')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('CategoryName')}>
                        <span>Category</span>
                        <SortIcon column="CategoryName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('CategoryName')} 
                        selected={columnFilters.CategoryName} 
                        onChange={val => toggleFilterValue('CategoryName', val)} 
                        onClear={() => clearColumnFilter('CategoryName')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TeamName')}>
                        <span>Team</span>
                        <SortIcon column="TeamName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('TeamName')} 
                        selected={columnFilters.TeamName} 
                        onChange={val => toggleFilterValue('TeamName', val)} 
                        onClear={() => clearColumnFilter('TeamName')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('SectionName')}>
                        <span>Section</span>
                        <SortIcon column="SectionName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('SectionName')} 
                        selected={columnFilters.SectionName} 
                        onChange={val => toggleFilterValue('SectionName', val)} 
                        onClear={() => clearColumnFilter('SectionName')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('DeptName')}>
                        <span>Department</span>
                        <SortIcon column="DeptName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('DeptName')} 
                        selected={columnFilters.DeptName} 
                        onChange={val => toggleFilterValue('DeptName', val)} 
                        onClear={() => clearColumnFilter('DeptName')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap bg-card">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('GroupName')}>
                        <span>Group</span>
                        <SortIcon column="GroupName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('GroupName')} 
                        selected={columnFilters.GroupName} 
                        onChange={val => toggleFilterValue('GroupName', val)} 
                        onClear={() => clearColumnFilter('GroupName')}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {loadingTasks ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Loading tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 opacity-20" />
                        <span>No tasks match the selected criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedTasks.map((task) => {
                    const taskId = task.Id ?? task.id;
                    const isSelected = selectedTaskId === taskId;
                    return (
                      <tr 
                        key={taskId} 
                        onClick={() => handleRowClick(taskId)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                        )}
                      >
                        <td className="p-3 text-center">
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center mx-auto transition-all border",
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent group-hover:border-primary/50"
                          )}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={cn("font-bold text-sm", isSelected ? "text-primary" : "text-foreground")}>{task.SubcategoryName}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {task.Project ? (
                            <span className="rounded text-[10px] font-bold uppercase tracking-wider">{task.Project}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-[10px]">None</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">{task.CategoryName}</td>
                        <td className="p-3 text-muted-foreground">{task.TeamName || '-'}</td>
                        <td className="p-3 text-muted-foreground">{task.SectionName || '-'}</td>
                        <td className="p-3 text-muted-foreground">{task.DeptName || '-'}</td>
                        <td className="p-3 text-muted-foreground">{task.GroupName || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select 
                value={pagination.size} 
                onChange={e => setSize(parseInt(e.target.value))}
                className="bg-background border border-border/80 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground cursor-pointer"
              >
                {[50, 100, 200, 500, 1000].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
                <option value={999999}>All</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button disabled={pagination.page <= 1} onClick={() => setPage(1)} className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
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
                  className="w-12 text-center bg-background border border-border/80 rounded-lg py-1 text-foreground focus:outline-none text-xs font-bold"
                />
                <span>/ {totalPages}</span>
              </div>
              <button disabled={pagination.page >= totalPages} onClick={() => setPage(pagination.page + 1)} className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button disabled={pagination.page >= totalPages} onClick={() => setPage(totalPages)} className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-background">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "flex flex-col bg-card border-border/80 overflow-hidden shrink-0 z-50",
            isDesktop 
              ? "lg:w-4/12 lg:border rounded-xl lg:shadow-xl relative" 
              : cn("fixed bottom-0 left-0 right-0 border-t border-x rounded-xl shadow-[0_-20px_50px_rgba(0,0,0,0.3)]", !isDragging && "transition-[height] duration-300 ease-in-out")
          )}
          style={!isDesktop ? { height: drawerHeight > 0 ? `${drawerHeight}vh` : '0px', touchAction: 'none', visibility: drawerHeight > 0 ? 'visible' : 'hidden' } : {}}
        >
          {!isDesktop && drawerHeight > 0 && (
            <div 
              className="w-full h-10 flex items-center justify-center cursor-row-resize bg-muted/30 border-b border-border/50 shrink-0 relative"
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              <div className="absolute right-4 flex items-center gap-2">
              <button 
                type="button"
                onClick={toggleDrawerHeight}
                className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                {drawerHeight > 50 ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTaskId(null);
                  setDrawerHeight(0); 
                }}
                className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col">
            <div className="border-b border-border/50 pb-3 mb-4 shrink-0">
              <h3 className="font-extrabold text-base md:text-lg text-foreground flex items-center gap-2 uppercase tracking-wide">
                <AlignLeft className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Parameters
              </h3>
              {!selectedTask && (
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5 font-medium">Please select a task from the list to configure assignment parameters.</p>
              )}
            </div>

            <div className={cn("space-y-6 transition-opacity duration-300 flex-1 flex flex-col", !selectedTask ? "opacity-40 pointer-events-none select-none filter blur-[1px]" : "opacity-100")}>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  Users <span className="text-muted-foreground/60 text-[9px]">(Filtered by Team)</span>
                </label>
                <PopoverDropdown 
                  data={teamUsers}
                  selectedValue={formState.assignedUserId}
                  onSelect={(val) => setFormState(prev => ({ ...prev, assignedUserId: val }))}
                  placeholder="Select Assignee..."
                  disabled={!selectedTask}
                  loading={loadingUsers}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Task Severity</label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {severityOptions.map((sev) => {
                    const isActive = formState.severity === sev.id;
                    return (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => handleSeverityChange(sev.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2.5 md:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                          isActive ? cn("font-black ring-1 scale-[1.02]", sev.activeColor) : cn(sev.idleColor)
                        )}
                      >
                        <span className="text-xs md:text-sm">{sev.label}</span>
                        <span className="text-[9px] md:text-[10px] font-bold mt-1 opacity-80">{sev.hours} Hrs</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Project Alignment</label>
                <input 
                  type="text"
                  placeholder="e.g. Core Infrastructure"
                  value={formState.project}
                  onChange={e => setFormState(prev => ({ ...prev, project: e.target.value }))}
                  className="w-full text-xs md:text-sm bg-muted/30 border border-border/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Work Date
                  </label>
                  <input 
                    type="date"
                    value={formState.workDate}
                    onChange={e => setFormState(prev => ({ ...prev, workDate: e.target.value }))}
                    className="w-full text-xs md:text-sm bg-muted/30 border border-border/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Due Date
                  </label>
                  <input 
                    type="date"
                    value={formState.dueDate}
                    onChange={e => setFormState(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full text-xs md:text-sm bg-muted/30 border border-border/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Task Detail / Remark</label>
                <textarea 
                  placeholder="Provide comprehensive details or remarks for the assignee..."
                  value={formState.taskDetails}
                  onChange={e => setFormState(prev => ({ ...prev, taskDetails: e.target.value }))}
                  className="w-full flex-1 min-h-[100px] text-xs md:text-sm bg-muted/30 border border-border/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-medium transition-all resize-none"
                />
              </div>

              {feedback && (
                <div className={cn(
                  "p-3 rounded-xl flex items-start gap-2.5 text-xs font-bold border animate-in zoom-in-95 shrink-0 mt-2",
                  feedback.type === 'error' ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                  {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  <p>{feedback.text}</p>
                </div>
              )}

              <button 
                onClick={handleAssignTask}
                disabled={submitState !== 'idle' || !selectedTask}
                className="w-full shrink-0 py-3.5 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-auto cursor-pointer"
              >
                {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitState === 'success' && <Check className="w-4 h-4" />}
                {submitState === 'idle' && <CheckCircle2 className="w-4 h-4" />}
                <span>{submitState === 'loading' ? 'Processing...' : submitState === 'success' ? 'Assigned' : 'Finalize Assignment'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}