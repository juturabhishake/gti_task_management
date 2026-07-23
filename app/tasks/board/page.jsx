"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Filter, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare,
  Calendar as CalendarIcon, Minimize2, Maximize2, X, Clock, AlertCircle, Check, Folder, Layers, ArrowRight, Pencil, Plus, ChevronDown, Activity
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

const PAGE_ID_FOR_THIS_FORM = 2042;

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

function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => 
    String(opt ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 hover:bg-primary/10 rounded transition text-muted-foreground hover:text-foreground cursor-pointer">
          <Filter className={`w-3.5 h-3.5 ${selected.length > 0 ? 'text-primary fill-primary/20' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-56 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
        <input 
          type="text" 
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-background border border-primary/20 rounded-lg p-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        />
        <div className="max-h-36 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-1">No items found</p>
          ) : (
            filtered.map((opt, idx) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={idx}
                  onClick={() => onChange(opt)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-primary/5 rounded cursor-pointer text-left text-foreground"
                >
                  <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-primary fill-primary/10' : 'text-muted-foreground/40'}`} />
                  <span className="truncate">{String(opt ?? '')}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-primary/10 pt-2 mt-2 flex justify-between">
          <button 
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CustomCategorySelector({ data = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => item.id === selectedValue);
  const filtered = data.filter(item => {
    const name = item.name || '';
    const path = item.path || '';
    return name.toLowerCase().includes(search.toLowerCase()) || path.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col w-full gap-3">
      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <RadixPopover.Trigger asChild>
          <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-xl p-3.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-12 cursor-pointer shadow-sm transition hover:border-primary/40">
            <span className="truncate font-semibold text-xs text-muted-foreground">
              {selectedItem ? selectedItem.name : placeholder}
            </span>
            <ChevronDown className="w-5 h-5 ml-2 shrink-0 opacity-60 text-primary" />
          </button>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content 
            className="z-[9999] bg-card border border-primary/20 rounded-xl shadow-2xl p-3 w-[var(--radix-popover-trigger-width)] max-w-[95vw] md:max-w-2xl" 
            sideOffset={5} 
            align="start"
          >
            <input 
              type="text" 
              placeholder="Search by category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-background border border-primary/20 rounded-xl p-2.5 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
            />
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">No categories found</p>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = selectedValue === item.id;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelect(item.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between transition cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-bold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className="flex flex-col text-left max-w-[85%]">
                        <span className="font-bold text-xs truncate">{item.name}</span>
                        {item.path && (
                          <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-normal opacity-85 leading-relaxed">
                            {item.path}
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckSquare className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>

      {selectedItem && selectedItem.path && (
        <div className="rounded-xl p-5 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 border border-primary/15 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-primary font-bold">
            <Layers className="w-4 h-4 animate-pulse" />
            <span>Structured Hierarchy Branch Flow</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-1.5">
            {(() => {
              const parts = selectedItem.path.split(' ➔ ');
              const levels = ['Group', 'Department', 'Section', 'Team'];
              return (
                <>
                  {levels.map((level, idx) => (
                    <div key={idx} className="relative flex flex-col bg-background/40 border border-primary/10 rounded-xl p-3 shadow-sm hover:border-primary/30 transition duration-200">
                      <span className="text-[8px] uppercase tracking-widest text-primary font-black opacity-80">{level}</span>
                      <span className="text-xs font-bold text-foreground mt-1.5 truncate">{parts[idx] || 'Unassigned'}</span>
                      {idx < 3 && (
                        <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-background border border-primary/20 p-0.5 rounded-full shadow">
                          <ArrowRight className="w-3 h-3 text-primary opacity-60" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col bg-primary/10 border border-primary/20 rounded-xl p-3 shadow-md animate-bounce-slow">
                    <span className="text-[8px] uppercase tracking-widest text-primary font-black">Category</span>
                    <span className="text-xs font-extrabold text-foreground mt-1.5 truncate">{selectedItem.name}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function PopoverDropdown({ data = [], selectedValue, onSelect, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => item.id === selectedValue);
  const filtered = data.filter(item => {
    const main = item.username || item.name || '';
    const sub = item.employeeId || '';
    return main.toLowerCase().includes(search.toLowerCase()) || sub.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button 
          disabled={disabled}
          className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-left"
        >
          <span className="truncate font-semibold text-xs">
            {selectedItem ? (selectedItem.employeeId ? `${selectedItem.employeeId} | ${selectedItem.username}` : selectedItem.name) : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-background border border-primary/20 rounded-lg p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-2">No options found</p>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = selectedValue === item.id;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left rounded-md px-2.5 py-1.5 flex items-center justify-between transition cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                  >
                    <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                      <span className="font-bold text-xs truncate">{item.username || item.name}</span>
                      {item.employeeId && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.employeeId}</span>
                      )}
                    </div>
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
function MultiSelectUserPopover({ data = [], fullOptions = [], selectedValues = [], onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = data.filter(item => {
    const main = item.name || '';
    return main.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RadixPopover.Root open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSearch(''); }}>
      <RadixPopover.Trigger asChild>
        <button className="w-full sm:w-75 flex items-center justify-between text-xs bg-background border border-primary/20 rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-9 cursor-pointer text-left font-semibold">
          <span className="truncate">
            {selectedValues.length === 0 
              ? placeholder 
              : `${selectedValues.length} Selected`}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60 text-primary" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="z-[9999] w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-background border border-primary/20 rounded-lg p-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            <button
              type="button"
              onClick={() => onSelect([])}
              className="w-full text-left rounded-md px-2.5 py-1.5 text-xs text-primary font-bold hover:bg-primary/5 cursor-pointer"
            >
              Clear All Selection
            </button>
            {filtered.map((item, idx) => {
              const isSelected = selectedValues.includes(String(item.id));
              const itemForPath = { Id: Number(item.id), Type: 'Team' };
              const pathParts = getHierarchyPathParts(itemForPath, fullOptions);

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
                  className={`w-full text-left rounded-md px-2.5 py-1.5 flex items-center justify-between transition text-xs cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                    <span className="font-bold text-xs truncate">{item.name}</span>
                    {pathParts.length > 1 && (
                      <div className="text-[9px] text-muted-foreground mt-0.5 whitespace-normal opacity-85 leading-tight">
                        {pathParts.slice(0, -1).map((part, pIdx) => (
                          <span key={pIdx} className="inline-block whitespace-nowrap">
                            {pIdx > 0 && " ➔ "}
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
export default function SubcategoryTaskView() {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [dataList, setDataList] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categoryCatalog, setCategoryCatalog] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [modalFullscreen, setModalFullscreen] = useState(false);
  const [submitState, setSubmitState] = useState('idle');
  const [feedback, setFeedback] = useState(null);

  const [teamUsers, setTeamUsers] = useState([]);
  const [hasEditAccess, setHasEditAccess] = useState(false);
  const [isAssignedUser, setIsAssignedUser] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hierarchyOptions, setHierarchyOptions] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedTeamsList, setSelectedTeamsList] = useState([]);
  const [previousUserIds, setPreviousUserIds] = useState([]);
  const [prevStatusId, setPrevStatusId] = useState(null);
  const [hasSetDefaultUser, setHasSetDefaultUser] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [formState, setFormState] = useState({
    name: '',
    project: '',
    categoryId: '',
    minHours: '',
    mediumHours: '',
    maxHours: '',
    assignedUserId: '',
    actualHours: '',
    statusId: '',
    reason: '',
    taskDetails: '',
    workDate: '',
    dueDate: '',
    severity: '',
    targetStandardHours: '',
    progressPct: 0
  });

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  const [numberOfMonths, setNumberOfMonths] = useState(2);
  const scrollContainerRef = React.useRef(null);
  useEffect(() => {
    const empId = getSecureLSValue('employee_id');
    setEmployeeId(empId || '');
    fetchCategoryCatalog();
    fetchHierarchyOptions();
  }, []);
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
  const handleTeamSelectionChange = (newTeams) => {
    if (newTeams.length > 0 && selectedTeamsList.length === 0) {
      setPreviousUserIds(selectedAssignees);
      setSelectedAssignees([]);
      
    } else if (newTeams.length === 0 && selectedTeamsList.length > 0) {
      setSelectedAssignees(previousUserIds);
    }
    setSelectedTeamsList(newTeams);
  };
  useEffect(() => {
    const handleResize = () => {
      setNumberOfMonths(window.innerWidth < 768 ? 1 : 2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
   const fetchTeams = async () => {
     const res = await fetch('/api/tasks/team-performance?action=teams');
     const json = await res.json();
     if (res.ok && json.data) setTeamsList(json.data);
   };
   fetchTeams();
  }, []);
  useEffect(() => {
    if (employeeId) {
      fetchStatusesAndData();
    }
  }, [employeeId, dateRange, searchTerm, selectedTeamsList]);
  // useEffect(() => {
  //   // if (dataList.length > 0 && employeeId && selectedAssignees.length === 0) {
  //   //   const currentUser = dataList.find(t => String(t.AssignedEmployeeId) === String(employeeId));
  //   //   if (currentUser && currentUser.AssignedUserId) {
  //   //     setSelectedAssignees([String(currentUser.AssignedUserId)]);
  //   //   }
  //   // }
  //   if (dataList.length > 0 && employeeId && selectedAssignees.length === 0 && selectedTeamsList.length === 0) {
  //     const currentUser = dataList.find(t => String(t.AssignedEmployeeId) === String(employeeId));
  //     if (currentUser && currentUser.AssignedUserId) {
  //       setSelectedAssignees([String(currentUser.AssignedUserId)]);
  //     }
  //   }
  // }, [dataList, employeeId, selectedTeamsList]);
  useEffect(() => {
    if (dataList.length > 0 && employeeId && !hasSetDefaultUser && selectedTeamsList.length === 0) {
      const currentUser = dataList.find(t => String(t.AssignedEmployeeId) === String(employeeId));
      if (currentUser && currentUser.AssignedUserId) {
        setSelectedAssignees([String(currentUser.AssignedUserId)]);
        setHasSetDefaultUser(true);
      }
    }
  }, [dataList, employeeId, selectedTeamsList, hasSetDefaultUser]);
  useEffect(() => {
    if (taskDetail) {
      const verifyAccess = async () => {
        if (isAdmin) {
          setHasEditAccess(true);
          setIsAssignedUser(true);
          return;
        }

        // if (taskDetail.StatusName === 'Resolved') {
        //   setHasEditAccess(false);
        //   setIsAssignedUser(false);
        //   return;
        // }

        try {
          const employeeIdVal = getSecureLSValue('employee_id');
          if (!employeeIdVal) {
            setHasEditAccess(false);
            setIsAssignedUser(false);
            return;
          }

          if (taskDetail.AssignedEmployeeId && String(taskDetail.AssignedEmployeeId) === String(employeeIdVal)) {
            setIsAssignedUser(true);
          } else {
            setIsAssignedUser(false);
          }

          const resVerify = await fetch(`/api/tasks/task-assignments?action=verifyUser&employeeId=${employeeIdVal}&teamId=${taskDetail.TeamId}`);
          const jsonVerify = await resVerify.json();
          if (resVerify.ok && jsonVerify.isMapped) {
            setHasEditAccess(true);
          } else {
            setHasEditAccess(false);
          }
        } catch (e) {
          setHasEditAccess(false);
          setIsAssignedUser(false);
        }
      };

      verifyAccess();
    }
  }, [isAdmin, isAdminLoading, taskDetail]);

  const fetchCategoryCatalog = async () => {
    try {
      const res = await fetch('/api/category-subcategory-update?type=CategoryCatalog');
      const json = await res.json();
      if (res.ok && json.data) {
        setCategoryCatalog(json.data);
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

  const fetchStatusesAndData = async () => {
    try {
      setTableLoading(true);
      const resStatus = await fetch('/api/tasks/task-assignments?action=statuses');
      const jsonStatus = await resStatus.json();
      
      let fetchedStatuses = [];
      // if (resStatus.ok && jsonStatus.data) {
      //   const preferredOrder = ['to do', 'pending', 'in progress', 'waiting for response', 'on hold', 'blocked', 'resolved', 'done'];
      //   fetchedStatuses = [...jsonStatus.data].sort((a, b) => {
      //     const idxA = preferredOrder.indexOf(a.name.toLowerCase());
      //     const idxB = preferredOrder.indexOf(b.name.toLowerCase());
      //     return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      //   });
      //   setStatuses(fetchedStatuses);
      // }
      if (resStatus.ok && jsonStatus.data) {
        const sortedStatuses = [...jsonStatus.data].sort((a, b) => a.id - b.id);
        setStatuses(sortedStatuses);
      }

      if (dateRange?.from && dateRange?.to) {
        const start = formatLocalDate(dateRange.from);
        const end = formatLocalDate(dateRange.to);
        const teamIdsString = selectedTeamsList.join(',');
        const resData = await fetch(`/api/tasks/task-assignments?action=list&page=1&size=999999&search=${searchTerm}&startDate=${start}&endDate=${end}&teamIds=${teamIdsString}&loggedInEmployeeId=${employeeId || ''}`);
        const jsonData = await resData.json();
        if (resData.ok && jsonData.data) {
          setDataList(jsonData.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTableLoading(false);
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("text/plain", String(task.Id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const executeStatusChange = async (taskId, targetStatusId) => {
    const taskToUpdate = dataList.find(t => t.Id === taskId);
    if (!taskToUpdate || taskToUpdate.StatusId === targetStatusId) return;

    const originalList = [...dataList];
    setDataList(prev => prev.map(t => t.Id === taskId ? { ...t, StatusId: targetStatusId, StatusName: statuses.find(s => s.id === targetStatusId)?.name || t.StatusName } : t));

    try {
      const res = await fetch('/api/tasks/task-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryId: taskToUpdate.Id,
          assignedUserId: taskToUpdate.AssignedUserId || null,
          actualHours: taskToUpdate.ActualHours || null,
          statusId: targetStatusId,
          reason: taskToUpdate.Reason || '',
          taskDetails: taskToUpdate.TaskDetails || '',
          workDate: taskToUpdate.WorkDate ? taskToUpdate.WorkDate.split('T')[0] : '',
          dueDate: taskToUpdate.DueDate ? taskToUpdate.DueDate.split('T')[0] : '',
          severity: taskToUpdate.Severity || '',
          targetStandardHours: taskToUpdate.ExpectedHours || null
        })
      });

      if (!res.ok) {
        setDataList(originalList);
      }
    } catch (err) {
      setDataList(originalList);
      console.error(err);
    }
  };

  const handleDrop = async (e, targetStatusId) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    const taskId = parseInt(taskIdStr);
    if (isNaN(taskId)) return;
    await executeStatusChange(taskId, targetStatusId);
  };

  const handleOpenCreateModal = () => {
    setFeedback(null);
    setFormState({
      name: '',
      project: '',
      categoryId: '',
      minHours: '',
      mediumHours: '',
      maxHours: '',
      assignedUserId: '',
      actualHours: '',
      statusId: '',
      reason: '',
      taskDetails: '',
      workDate: '',
      dueDate: '',
      severity: '',
      targetStandardHours: ''
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (id) => {
    try {
      setFeedback(null);
      setSelectedSubcategoryId(id);
      setModalMode('edit');
      setIsModalOpen(true);
      setLoadingDetail(true);
      
      const res = await fetch(`/api/tasks/task-assignments?action=single&subcategoryId=${id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const detail = json.data;
        setTaskDetail(detail);
        setFormState({
          name: detail.SubcategoryName,
          project: detail.Project || '',
          categoryId: detail.CategoryId,
          minHours: String(detail.MinHours || ''),
          mediumHours: String(detail.MediumHours || ''),
          maxHours: String(detail.MaxHours || ''),
          assignedUserId: detail.AssignedUserId || '',
          actualHours: detail.ActualHours !== null ? String(detail.ActualHours) : '',
          statusId: detail.StatusId || '',
          reason: detail.Reason || '',
          taskDetails: detail.TaskDetails || '',
          workDate: detail.WorkDate ? detail.WorkDate.split('T')[0] : '',
          dueDate: detail.DueDate ? detail.DueDate.split('T')[0] : '',
          severity: detail.Severity || '',
          targetStandardHours: detail.ExpectedHours !== null ? String(detail.ExpectedHours) : '',
          progressPct: detail.ProgressPct || 0
        });

        const resUsers = await fetch(`/api/tasks/task-assignments?action=usersByTeam&teamId=${detail.TeamId}`);
        const jsonUsers = await resUsers.json();
        if (resUsers.ok && jsonUsers.data) {
          setTeamUsers(jsonUsers.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };
  const handleProgressChange = (val) => {
    const parsedVal = parseInt(val) || 0;
    let updateState = { ...formState, progressPct: parsedVal };
    const resolvedStatus = statuses.find(s => s.name === 'Resolved' || s.name === 'Done');
    if (parsedVal === 100) {
      if (resolvedStatus && formState.statusId !== resolvedStatus.id) {
        setPrevStatusId(formState.statusId);
        updateState.statusId = resolvedStatus.id;
      }
    } else {
      if (resolvedStatus && formState.statusId === resolvedStatus.id && prevStatusId) {
        updateState.statusId = prevStatusId;
      }
    }
    setFormState(updateState);
  };
  const handleSeverityChange = (val) => {
    let target = 0;
    if (val === 'Min') target = taskDetail?.MinHours || 0;
    else if (val === 'Medium') target = taskDetail?.MediumHours || 0;
    else if (val === 'Max') target = taskDetail?.MaxHours || 0;

    setFormState(prev => ({
      ...prev,
      severity: val,
      targetStandardHours: String(target)
    }));
  };

  const handleResetForm = () => {
    setFormState({
      name: '',
      project: '',
      categoryId: '',
      minHours: '',
      mediumHours: '',
      maxHours: '',
      assignedUserId: '',
      actualHours: '',
      statusId: '',
      reason: '',
      taskDetails: '',
      workDate: '',
      dueDate: '',
      severity: '',
      targetStandardHours: ''
    });
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modalMode === 'create') {
      if (!formState.name || !formState.project || !formState.categoryId || !formState.minHours || !formState.mediumHours || !formState.maxHours) {
        setFeedback({ type: 'error', text: 'All form configuration fields are required' });
        return;
      }
    } else {
      if (!formState.assignedUserId || !formState.workDate || !formState.dueDate || !formState.taskDetails || !formState.severity) {
        setFeedback({ type: 'error', text: 'All assignment details are required' });
        return;
      }
      if (taskDetail?.AssignedUserId && (!formState.actualHours || !formState.statusId || !formState.reason)) {
        setFeedback({ type: 'error', text: 'All work update fields are required' });
        return;
      }
    }

    setSubmitState('loading');
    setFeedback(null);

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: 'CREATE',
            type: 'Subcategory',
            name: formState.name,
            parentId: parseInt(formState.categoryId),
            project: formState.project,
            maxHours: parseFloat(formState.maxHours) || 0,
            mediumHours: parseFloat(formState.mediumHours) || 0,
            minHours: parseFloat(formState.minHours) || 0
          })
        });
      } else {
        res = await fetch('/api/tasks/task-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subcategoryId: parseInt(selectedSubcategoryId),
            assignedUserId: parseInt(formState.assignedUserId),
            actualHours: formState.actualHours ? parseFloat(formState.actualHours) : null,
            statusId: formState.statusId ? parseInt(formState.statusId) : null,
            reason: formState.reason,
            taskDetails: formState.taskDetails,
            workDate: formState.workDate,
            dueDate: formState.dueDate,
            severity: formState.severity,
            targetStandardHours: formState.targetStandardHours ? parseFloat(formState.targetStandardHours) : null,
            progressPct: parseInt(formState.progressPct)
          })
        });
      }

      const result = await res.json();
      if (res.ok && result.message === 'Success') {
        setSubmitState('success');
        setFeedback({ type: 'success', text: modalMode === 'create' ? 'Task created successfully' : 'Task updated successfully' });
        setTimeout(() => {
          setSubmitState('idle');
          setIsModalOpen(false);
          fetchStatusesAndData();
        }, 1500);
      } else {
        setSubmitState('error');
        setFeedback({ type: 'error', text: result.message || 'Action failed to execute' });
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } catch (err) {
      setSubmitState('error');
      setFeedback({ type: 'error', text: 'Network connection failure' });
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'UN';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUniqueTaskAssignees = () => {
    const list = [];
    const seen = new Set();
    dataList.forEach(t => {
      if (t.AssignedUserId && !seen.has(t.AssignedUserId)) {
        seen.add(t.AssignedUserId);
        list.push({ id: t.AssignedUserId, username: t.AssignedUsername });
      }
    });
    return list;
  };

  const toggleAssigneeFilter = (id) => {
    setSelectedAssignees(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  const uniqueAssignees = getUniqueTaskAssignees();
  const severityOptions = [
    { id: 'Min', name: `Low (${taskDetail?.MinHours || 0} Hours)` },
    { id: 'Medium', name: `Medium (${taskDetail?.MediumHours || 0} Hours)` },
    { id: 'Max', name: `High (${taskDetail?.MaxHours || 0} Hours)` }
  ];
  const handleBoardDragOver = (e) => {
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX;

    const edgeThreshold = 80;
    const scrollSpeed = 15;

    if (clientX < rect.left + edgeThreshold) {
      container.scrollLeft -= scrollSpeed;
    } else if (clientX > rect.right - edgeThreshold) {
      container.scrollLeft += scrollSpeed;
    }
  };
  const verifyAccess = async () => {
    if (isAdmin) {
      setHasEditAccess(true);
      setIsAssignedUser(true);
      return;
    }
    if (taskDetail.StatusName === 'Resolved') {
      setHasEditAccess(false);
      setIsAssignedUser(false);
      return;
    }
    try {
      const employeeIdVal = getSecureLSValue('employee_id');
      if (!employeeIdVal) {
        setHasEditAccess(false);
        setIsAssignedUser(false);
        return;
      }
      if (taskDetail.AssignedEmployeeId && String(taskDetail.AssignedEmployeeId) === String(employeeIdVal)) {
        setIsAssignedUser(true);
      } else {
        setIsAssignedUser(false);
      }
      const resVerify = await fetch(`/api/tasks/task-assignments?action=verifyUser&employeeId=${employeeIdVal}&teamId=${taskDetail.TeamId}`);
      const jsonVerify = await resVerify.json();

      if (resVerify.ok && jsonVerify.isMapped) {
        setHasEditAccess(true);
      } else {
        setHasEditAccess(false);
      }
    } catch (e) {
      setHasEditAccess(false);
      setIsAssignedUser(false);
    }
  };
  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex p-1 flex-col space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-4 shrink-0">
        <div className="px-1">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            Task Kanban Board
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Drag and drop task cards to transition their tracking status.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 text-xs font-bold mr-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm">Board Progress</h4>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{dataList.length} Tasks</span>
          </div>

          <div className="h-4 w-[1px] bg-primary/20 hidden md:block" />

          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-2 overflow-visible">
              {uniqueAssignees.slice(0, 6).map(usr => {
                const isSelected = selectedAssignees.includes(String(usr.id));
                return (
                  <button
                    key={usr.id}
                    onClick={() => toggleAssigneeFilter(String(usr.id))}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all cursor-pointer select-none shrink-0 shadow-sm",
                      isSelected ? "border-primary bg-primary text-primary-foreground scale-110 z-10" : "border-card bg-primary/20 text-foreground hover:scale-105"
                    )}
                    title={usr.username}
                  >
                    {getUserInitials(usr.username)}
                  </button>
                );
              })}

              <button
                onClick={() => toggleAssigneeFilter('unassigned')}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all cursor-pointer select-none shrink-0 shadow-sm",
                  selectedAssignees.includes('unassigned') ? "border-primary bg-primary text-primary-foreground scale-110 z-10" : "border-card bg-primary/20 text-foreground hover:scale-105"
                )}
                title="Unassigned Tasks"
              >
                UN
              </button>
            </div>

            {uniqueAssignees.length > 6 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-[10px] font-bold hover:text-primary transition px-1.5 py-1 rounded bg-primary/10 text-primary cursor-pointer">
                    +{uniqueAssignees.length - 6} More
                  </button>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-52 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uniqueAssignees.slice(6).map(usr => {
                      const isSelected = selectedAssignees.includes(String(usr.id));
                      return (
                        <button
                          key={usr.id}
                          onClick={() => toggleAssigneeFilter(String(usr.id))}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-primary/5 rounded cursor-pointer text-left text-foreground"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/20 text-foreground"
                          )}>
                            {getUserInitials(usr.username)}
                          </div>
                          <span className="truncate flex-1">{usr.username}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAssignees.length > 0 && (
                    <div className="border-t border-primary/10 pt-1.5 mt-1.5 flex justify-end">
                      <button 
                        onClick={() => setSelectedAssignees([])}
                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <MultiSelectUserPopover 
              data={teamsList}
              fullOptions={hierarchyOptions}
              selectedValues={selectedTeamsList}
              // onSelect={setSelectedTeamsList}
              onSelect={handleTeamSelectionChange}
              placeholder="All Teams"
            />
          </div>
          <div className={cn("grid gap-2 w-full sm:w-auto")}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-semibold text-xs border-primary/20 bg-background hover:bg-primary/5",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, yyyy")} -{" "}
                        {format(dateRange.to, "LLL dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
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
          <div className="relative w-full sm:w-75">
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-background border border-primary/20 rounded-lg pl-8 pr-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {tableLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading agile board...</p>
        </div>
      ) : (
        // <div className="flex-1 w-full overflow-x-auto pb-4">
        <div 
          ref={scrollContainerRef} 
          onDragOver={handleBoardDragOver} 
          className="flex-1 w-full overflow-x-auto pb-4"
        >
          <div className="flex gap-2 h-[calc(100vh-270px)] items-stretch w-full md:min-w-0">
            {statuses.map(col => {
              const columnTasks = dataList.filter(t => {
                const matchesStatus = t.StatusId === col.id || (!t.StatusId && col.name === 'To Do');
                if (selectedAssignees.length === 0) return matchesStatus;

                const assignedId = t.AssignedUserId;
                const isUnassigned = !assignedId;

                if (isUnassigned) {
                  return matchesStatus && selectedAssignees.includes('unassigned');
                }
                return matchesStatus && selectedAssignees.includes(String(assignedId));
              });

              return (
                <div 
                  key={col.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  // className="w-80 flex flex-col bg-card/40 border border-primary/10 rounded-2xl overflow-hidden shrink-0 animate-in fade-in duration-300"
                  className="w-[85vw] sm:w-80 md:flex-1 md:min-w-[250px] flex flex-col bg-card/40 border border-primary/10 rounded-2xl overflow-hidden shrink-0 md:shrink animate-in fade-in duration-300"
                >
                  <div className="p-3.5 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">{col.name}</span>
                    <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-background/20">
                    {columnTasks.length === 0 ? (
                      <div className="border border-dashed border-primary/10 rounded-xl p-6 text-center text-xs text-muted-foreground">
                        No tasks in this status
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const canDrag = isAdmin || task.IsTeamMember === 1 || task.IsTeamMember === true;
                        const isOverdue = task.DueDate && new Date(task.DueDate) < new Date() && task.StatusName !== 'Resolved';
                        return (
                          <div
                            key={task.Id}
                            // draggable="true"
                            draggable={canDrag ? "true" : "false"}
                            // onDragStart={(e) => handleDragStart(e, task)}
                            onDragStart={(e) => {
                              if (!canDrag) {
                                e.preventDefault();
                                return;
                              }
                              handleDragStart(e, task);
                            }}
                            onClick={() => handleOpenEditModal(task.Id)}
                            className={cn(
                              "bg-card border border-primary/15 hover:border-primary/40 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group flex flex-col justify-between min-h-[140px]",
                              canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-75" // 👈 యాక్సెస్ లేకపోతే కర్సర్ లాక్ అవుతుంది
                            )}
                            // className="bg-card border border-primary/15 hover:border-primary/40 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden group flex flex-col justify-between min-h-[140px]"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[8px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">{task.CategoryName}</span>
                              </div>
                              <h5 className="text-xs font-extrabold text-foreground leading-snug line-clamp-2">{task.SubcategoryName}</h5>
                              {task.Project && (
                                <p className="text-[10px] text-muted-foreground font-medium truncate">{task.Project}</p>
                              )}
                            </div>

                            <div className="border-t border-primary/5 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-primary opacity-60" />
                                <span>{task.DisplayHours} hrs</span>
                              </div>
                              
                              {task.DueDate && (
                                <span className={cn(isOverdue ? "text-red-500 font-bold" : "opacity-80")}>
                                  {task.DueDate.split('T')[0]}
                                </span>
                              )}

                              <div className="flex items-center gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button 
                                      onClick={(e) => e.stopPropagation()} 
                                      className="text-[9px] uppercase tracking-wider bg-primary/15 hover:bg-primary/25 text-primary font-bold px-1.5 py-0.5 rounded cursor-pointer transition"
                                    >
                                      {task.StatusName || 'To Do'}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="z-50 w-36 bg-card border border-primary/20 rounded-xl shadow-xl p-1" sideOffset={5} align="end">
                                    <div className="space-y-0.5">
                                      {statuses.map(st => (
                                        <button
                                          key={st.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await executeStatusChange(task.Id, st.id);
                                          }}
                                          className="w-full text-left rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase hover:bg-primary/10 text-foreground transition"
                                        >
                                          {st.name}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow bg-primary text-primary-foreground select-none"
                                  title={task.AssignedUsername || 'Unassigned'}
                                >
                                  {getUserInitials(task.AssignedUsername)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
          <div className={cn(
            "bg-card rounded-2xl p-6 shadow-2xl relative border border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-y-auto z-[9999]",
            modalFullscreen 
              ? "fixed inset-0 w-screen h-screen rounded-none p-4 md:p-6" 
              : "fixed w-[95vw] md:w-full md:max-w-4xl max-h-[90vh] rounded-2xl p-4 md:p-6"
          )}>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button 
                onClick={() => setModalFullscreen(!modalFullscreen)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                {modalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
              {modalMode === 'edit' ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              <span>{modalMode === 'edit' ? 'Update Task Parameters' : 'Create New Task'}</span>
            </h3>

            {loadingDetail && modalMode === 'edit' ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading task assignment parameters...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">    
                {modalMode === 'create' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Task / Subcategory Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter task description..."
                        value={formState.name}
                        onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold placeholder:text-muted-foreground/60 transition focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Project Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter parent project..."
                        value={formState.project}
                        onChange={e => setFormState(prev => ({ ...prev, project: e.target.value }))}
                        className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold placeholder:text-muted-foreground/60 transition focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Assigned Category Location</label>
                      <CustomCategorySelector
                        data={categoryCatalog}
                        selectedValue={formState.categoryId}
                        onSelect={val => setFormState(prev => ({ ...prev, categoryId: val }))}
                        placeholder="-- Search and Select Target Category --"
                      />
                    </div>

                    <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-primary/10 pb-2">
                        <Clock className="w-4 h-4 text-primary animate-pulse" />
                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-primary">Severity Classification Metrics</label>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-primary">Low (Hrs.)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.0"
                            value={formState.minHours}
                            onChange={e => setFormState(prev => ({ ...prev, minHours: e.target.value }))}
                            className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-primary">Medium (Hrs.)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.0"
                            value={formState.mediumHours}
                            onChange={e => setFormState(prev => ({ ...prev, mediumHours: e.target.value }))}
                            className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-primary">High (Hrs.)</label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.0"
                            value={formState.maxHours}
                            onChange={e => setFormState(prev => ({ ...prev, maxHours: e.target.value }))}
                            className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-primary/5 border border-primary/10 p-4 rounded-xl shadow-inner relative overflow-hidden">
                      <div className="col-span-2 border-b border-primary/5 pb-2 mb-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Subcategory Name</label>
                        <p className="text-sm font-extrabold text-foreground mt-0.5">{taskDetail?.SubcategoryName}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Project</label>
                        <p className="text-xs font-bold text-foreground mt-0.5">{taskDetail?.Project}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Assigned Category</label>
                        <p className="text-xs font-semibold text-foreground mt-0.5">{taskDetail?.CategoryName}</p>
                      </div>
                      <div className="col-span-2 border-t border-primary/5 pt-2 mt-1.5 grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[7px] font-bold uppercase tracking-wider text-primary">Group</label>
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{taskDetail?.GroupName}</p>
                        </div>
                        <div>
                          <label className="text-[7px] font-bold uppercase tracking-wider text-primary">Dept</label>
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{taskDetail?.DeptName}</p>
                        </div>
                        <div>
                          <label className="text-[7px] font-bold uppercase tracking-wider text-primary">Section</label>
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{taskDetail?.SectionName}</p>
                        </div>
                        <div>
                          <label className="text-[7px] font-bold uppercase tracking-wider text-primary">Team</label>
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{taskDetail?.TeamName}</p>
                        </div>
                      </div>
                    </div>

                    {!hasEditAccess && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center gap-2 text-xs font-semibold border border-yellow-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Read-only: You must be an administrator or a member of the mapped team to modify this assignment.</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-primary/5 pb-2 mb-2">Section 1: Assignment & Severity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Assign To</label>
                          <PopoverDropdown 
                            data={teamUsers}
                            selectedValue={formState.assignedUserId}
                            onSelect={val => setFormState(prev => ({ ...prev, assignedUserId: val }))}
                            placeholder="-- Select User --"
                            disabled={!hasEditAccess}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Work Date</label>
                            <input
                              type="date"
                              required
                              disabled={!hasEditAccess}
                              value={formState.workDate}
                              onChange={e => setFormState(prev => ({ ...prev, workDate: e.target.value }))}
                              className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Due Date</label>
                            <input
                              type="date"
                              required
                              disabled={!hasEditAccess}
                              value={formState.dueDate}
                              onChange={e => setFormState(prev => ({ ...prev, dueDate: e.target.value }))}
                              className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Severity</label>
                          <PopoverDropdown 
                            data={severityOptions}
                            selectedValue={formState.severity}
                            onSelect={handleSeverityChange}
                            placeholder="-- Select Severity --"
                            disabled={!hasEditAccess}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Target Standard Hours</label>
                          <input
                            type="text"
                            disabled
                            value={formState.targetStandardHours ? `${formState.targetStandardHours} Hours` : ''}
                            className="w-full text-xs rounded p-2.5 focus:outline-none bg-primary/5 border border-primary/10 text-muted-foreground font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Task Details</label>
                        <textarea
                          required
                          rows={3}
                          disabled={!hasEditAccess}
                          placeholder="Provide specific instructions, details, or comments regarding this task..."
                          value={formState.taskDetails}
                          onChange={e => setFormState(prev => ({ ...prev, taskDetails: e.target.value }))}
                          className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                        />
                      </div>
                    </div>
                    {!!(taskDetail?.AssignedUserId && taskDetail?.StatusName === 'In Progress') && (
                      <div className="space-y-4 border-t border-primary/10 pt-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-primary/5 pb-2 mb-2">Section 2: Work Update & Status</h4>
                        
                        {!isAssignedUser && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center gap-2 text-xs font-semibold border border-yellow-500/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Only the assigned user can update hours, progress status, and reasons in this section.</span>
                          </div>
                        )}
                        <div className="space-y-3 pt-1 pb-3 px-3">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              Completion Progress
                            </label>
                            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full shadow-sm">
                              {formState.progressPct}%
                            </span>
                          </div>
                          <div className="relative flex items-center w-full h-8 group">
                            <div className="absolute w-full h-2.5 bg-muted-foreground/20 rounded-full overflow-hidden shadow-inner" />
                            <div className="absolute w-full h-2.5 pointer-events-none z-0">
                              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(dot => (
                                <div 
                                  key={dot} 
                                  className="absolute top-0 w-[2px] h-full bg-background/60" 
                                  style={{ left: `calc(${dot}% - 1px)` }} 
                                />
                              ))}
                            </div>
                            <div 
                              className="absolute h-2.5 bg-gradient-to-r from-blue-500 via-primary to-indigo-500 rounded-full z-0"
                              style={{ width: `${formState.progressPct}%` }}
                            />
                            <div 
                              className="absolute h-5 w-5 bg-background border-2 border-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] z-10 pointer-events-none flex items-center justify-center"
                              style={{ left: `calc(${formState.progressPct}% - 10px)` }}
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="10"
                              disabled={!isAssignedUser}
                              value={formState.progressPct}
                              onChange={e => handleProgressChange(e.target.value)}
                              className="absolute z-20 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-extrabold text-muted-foreground uppercase px-1">
                            <span>Started</span>
                            <span>Halfway</span>
                            <span>Done</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* {taskDetail?.AssignedUserId && ( */}
                    {!!taskDetail?.AssignedUserId && (
                      <div className="space-y-4 border-t border-primary/10 pt-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-primary/5 pb-2 mb-2">Section 2: Work Update & Status</h4>
                        
                        {!isAssignedUser && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center gap-2 text-xs font-semibold border border-yellow-500/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Only the assigned user can update hours, progress status, and reasons in this section.</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Actual Standard Hours</label>
                            <input
                              type="number"
                              step="any"
                              required
                              disabled={!isAssignedUser}
                              value={formState.actualHours}
                              onChange={e => setFormState(prev => ({ ...prev, actualHours: e.target.value }))}
                              className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Status</label>
                            <PopoverDropdown 
                              data={statuses}
                              selectedValue={formState.statusId}
                              onSelect={val => setFormState(prev => ({ ...prev, statusId: val }))}
                              placeholder="-- Select Status --"
                              disabled={!isAssignedUser}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Reason</label>
                          <textarea
                            required
                            rows={3}
                            disabled={!isAssignedUser}
                            placeholder="State the reason/comments for this update, current status, or roadblocks..."
                            value={formState.reason}
                            onChange={e => setFormState(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {feedback && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0 animate-bounce" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{feedback.text}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    hidden={!hasEditAccess}
                    className="flex-1 py-3 text-xs font-bold uppercase rounded-xl border border-primary/20 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition cursor-pointer"
                  >
                    Clear Form
                  </button>
                  
                  <button
                    type="submit"
                    hidden={!hasEditAccess}
                    disabled={submitState !== 'idle' || (modalMode === 'edit' && !hasEditAccess)}
                    className="flex-1 py-3 text-xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: submitState === 'error' ? '#ef4444' : submitState === 'success' ? '#10b981' : 'var(--primary, #6366f1)',
                      color: '#ffffff',
                      cursor: submitState === 'idle' ? 'pointer' : 'not-allowed',
                      filter: submitState === 'idle' ? 'none' : 'brightness(0.95)'
                    }}
                  >
                    {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitState === 'success' && <Check className="w-4 h-4 animate-bounce" />}
                    {submitState === 'error' && <X className="w-4 h-4" />}
                    {submitState === 'idle' && <Check className="w-4 h-4" />}
                    <span>
                      {submitState === 'loading' ? 'Processing...' : submitState === 'success' ? 'Success' : submitState === 'error' ? 'Failed' : modalMode === 'create' ? 'Save Task' : 'Submit Changes'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}