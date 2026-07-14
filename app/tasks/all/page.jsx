"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Filter, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import EditForm from './editform';
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2038;
function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => 
    String(opt ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="p-1 hover:bg-primary/10 rounded transition text-muted-foreground hover:text-foreground cursor-pointer">
          <Filter className={`w-3.5 h-3.5 ${selected.length > 0 ? 'text-primary fill-primary/20' : ''}`} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 w-56 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
          <input 
            type="text" 
            placeholder="Search filters..."
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function SubcategoryTaskView() {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [dataList, setDataList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [view, setView] = useState('list');

  const [pagination, setPagination] = useState({ page: 1, size: 100 });
  const [searchTerm, setSearchTerm] = useState('');

  const [columnFilters, setColumnFilters] = useState({
    SubcategoryName: [],
    DisplayHours: [],
    CategoryName: [],
    TeamName: [],
    SectionName: [],
    DeptName: [],
    GroupName: [],
    StatusName: [],
    AssignedUsername: []
  });

  const [sorting, setSorting] = useState({ column: null, direction: 'none' });

  useEffect(() => {
    if (view === 'list') {
      fetchData();
    }
  }, [pagination.page, pagination.size, searchTerm, view]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tasks/task-assignments?action=list&page=${pagination.page}&size=${pagination.size}&search=${searchTerm}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setDataList(json.data);
        setTotalCount(json.data?.[0]?.TotalCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (id) => {
    setSelectedSubcategoryId(id);
    setView('edit');
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
    return Array.from(new Set(dataList.map(item => item[key]).filter(Boolean)));
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

  const applyFilters = (data) => {
    let output = [...data];
    Object.keys(columnFilters).forEach(col => {
      const selectedFilters = columnFilters[col];
      if (selectedFilters && selectedFilters.length > 0) {
        output = output.filter(item => selectedFilters.includes(item[col]));
      }
    });
    return applySorting(output);
  };

  const SortIcon = ({ column }) => {
    if (sorting.column !== column || sorting.direction === 'none') {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 shrink-0 ml-1" />;
    }
    if (sorting.direction === 'asc') {
      return <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />;
    }
    return <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />;
  };

  const totalPages = Math.ceil(totalCount / pagination.size) || 1;

  const setPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      setPagination(prev => ({ ...prev, page: p }));
    }
  };

  const setSize = (s) => {
    setPagination({ page: 1, size: s });
  };

  if (view === 'edit') {
    return (
      <EditForm 
        subcategoryId={selectedSubcategoryId} 
        onBack={() => setView('list')} 
      />
    );
  }

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex p-1 flex-col space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-4 shrink-0">
        <div className="px-1">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            Task Grid
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse and manage allocations across multiple structural units.
          </p>
        </div>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-160px)] w-full">
        <div className="p-4 bg-primary/5 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm">Tasks Assigned</h4>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 rounded-full">{totalCount} Total</span>
          </div>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-background border border-primary/20 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left text-sm border-collapse relative">
              <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
                <tr className="bg-primary/5 text-foreground font-semibold text-xs">
                  <th className="p-3 whitespace-nowrap">View</th>
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('SubcategoryName')}>
                        <span>Task</span>
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('DisplayHours')}>
                        <span>Standard Hours</span>
                        <SortIcon column="DisplayHours" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('DisplayHours')} 
                        selected={columnFilters.DisplayHours} 
                        onChange={val => toggleFilterValue('DisplayHours', val)} 
                        onClear={() => clearColumnFilter('DisplayHours')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
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
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('AssignedUsername')}>
                        <span>Assigned To</span>
                        <SortIcon column="AssignedUsername" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('AssignedUsername')} 
                        selected={columnFilters.AssignedUsername} 
                        onChange={val => toggleFilterValue('AssignedUsername', val)} 
                        onClear={() => clearColumnFilter('AssignedUsername')}
                      />
                    </div>
                  </th>
                  <th className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('StatusName')}>
                        <span>Status</span>
                        <SortIcon column="StatusName" />
                      </div>
                      <FilterPopover 
                        options={getUniqueValues('StatusName')} 
                        selected={columnFilters.StatusName} 
                        onChange={val => toggleFilterValue('StatusName', val)} 
                        onClear={() => clearColumnFilter('StatusName')}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {applyFilters(dataList).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records found</td>
                  </tr>
                ) : (
                  applyFilters(dataList).map((row, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                      <td className="p-3 whitespace-nowrap">
                        <button 
                          onClick={() => handleNavigate(row.Id)}
                          className="p-1 hover:bg-primary/10 rounded text-primary hover:text-indigo-400 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-foreground whitespace-nowrap">{row.SubcategoryName}</td>
                      <td className="p-3 whitespace-nowrap font-bold text-primary">{row.DisplayHours} Hours</td>
                      <td className="p-3 whitespace-nowrap font-medium text-foreground">{row.CategoryName}</td>
                      <td className="p-3 whitespace-nowrap font-medium text-foreground">{row.TeamName}</td>
                      <td className="p-3 whitespace-nowrap">{row.SectionName}</td>
                      <td className="p-3 whitespace-nowrap">{row.DeptName}</td>
                      <td className="p-3 whitespace-nowrap">{row.GroupName}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-foreground">{row.AssignedUsername || 'Unassigned'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px]">{row.StatusName || 'Unassigned'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 bg-primary/5 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select 
              value={pagination.size} 
              onChange={e => setSize(parseInt(e.target.value))}
              className="bg-card border border-primary/20 rounded-lg p-1 focus:outline-none text-foreground font-semibold cursor-pointer"
            >
              {[100, 200, 500, 1000].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
              <option value={999999}>All</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page <= 1} 
              onClick={() => setPage(1)}
              className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              disabled={pagination.page <= 1} 
              onClick={() => setPage(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <input 
                type="number" 
                value={pagination.page}
                min={1}
                max={totalPages}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setPage(val);
                }}
                className="w-10 text-center bg-card border border-primary/20 rounded p-0.5 text-foreground focus:outline-none text-xs"
              />
              <span className="opacity-80">/ {totalPages}</span>
            </div>
            <button 
              disabled={pagination.page >= totalPages} 
              onClick={() => setPage(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              disabled={pagination.page >= totalPages} 
              onClick={() => setPage(totalPages)}
              className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}