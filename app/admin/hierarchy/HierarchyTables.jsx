"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, ChevronDown, CheckSquare, ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

export default function HierarchyTables({ 
  groups = [], 
  depts = [], 
  sections = [], 
  teams = [], 
  activeTabs = [], 
  pagination, 
  onPaginationChange 
}) {
  const [columnFilters, setColumnFilters] = useState({
    group: { name: [] },
    dept: { name: [], groupName: [] },
    section: { name: [], deptName: [] },
    team: { name: [], sectionName: [] }
  });

  const [sorting, setSorting] = useState({
    group: { column: null, direction: 'none' },
    dept: { column: null, direction: 'none' },
    section: { column: null, direction: 'none' },
    team: { column: null, direction: 'none' }
  });

  const [localSearch, setLocalSearch] = useState({
    group: '',
    dept: '',
    section: '',
    team: ''
  });

  const handleSortCycle = (tableKey, column) => {
    setSorting(prev => {
      const current = prev[tableKey];
      let nextDirection = 'none';
      if (current.column === column) {
        if (current.direction === 'none') nextDirection = 'asc';
        else if (current.direction === 'asc') nextDirection = 'desc';
        else nextDirection = 'none';
      } else {
        nextDirection = 'asc';
      }
      return {
        ...prev,
        [tableKey]: { column: nextDirection === 'none' ? null : column, direction: nextDirection }
      };
    });
  };

  const applySorting = (data, tableKey) => {
    const { column, direction } = sorting[tableKey];
    if (!column || direction === 'none') return data;
    return [...data].sort((a, b) => {
      const valA = String(a[column] || '').toLowerCase();
      const valB = String(b[column] || '').toLowerCase();
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getUniqueValues = (data, key) => {
    return Array.from(new Set(data.map(item => item[key]).filter(Boolean)));
  };

  const toggleFilterValue = (table, column, value) => {
    setColumnFilters(prev => {
      const active = prev[table][column];
      const next = active.includes(value) ? active.filter(v => v !== value) : [...active, value];
      return { ...prev, [table]: { ...prev[table], [column]: next } };
    });
  };

  const clearColumnFilter = (table, column) => {
    setColumnFilters(prev => ({
      ...prev,
      [table]: { ...prev[table], [column]: [] }
    }));
  };

  const applyFilters = (data, tableKey, mappings) => {
    let output = [...data];
    const searchTerm = localSearch[tableKey].toLowerCase();
    if (searchTerm) {
      output = output.filter(item => {
        return Object.values(item).some(val => 
          String(val || '').toLowerCase().includes(searchTerm)
        );
      });
    }
    Object.keys(mappings).forEach(col => {
      const selectedFilters = columnFilters[tableKey][col];
      if (selectedFilters && selectedFilters.length > 0) {
        output = output.filter(item => selectedFilters.includes(item[mappings[col]] || item[col]));
      }
    });
    return applySorting(output, tableKey);
  };

  const SortIcon = ({ tableKey, column }) => {
    const activeSort = sorting[tableKey];
    if (activeSort.column !== column || activeSort.direction === 'none') {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 shrink-0 ml-1" />;
    }
    if (activeSort.direction === 'asc') {
      return <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />;
    }
    return <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />;
  };

  return (
    <div className="space-y-8 w-full">
      {activeTabs.includes('groups') && (
        <TableWithPagination
          title="Groups"
          count={groups.length}
          paginationKey="groups"
          pagination={pagination.groups}
          onPaginationChange={(val) => onPaginationChange('groups', val)}
          searchValue={localSearch.group}
          onSearchValueChange={(val) => setLocalSearch(prev => ({ ...prev, group: val }))}
        >
          <table className="w-full text-left text-sm border-collapse relative">
            <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
              <tr className="bg-primary/5 text-foreground font-semibold">
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('group', 'Id')}>
                    <span>ID</span>
                    <SortIcon tableKey="group" column="Id" />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('group', 'Name')}>
                      <span>Group Name</span>
                      <SortIcon tableKey="group" column="Name" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(groups, 'Name')} 
                      selected={columnFilters.group.name} 
                      onChange={val => toggleFilterValue('group', 'name', val)} 
                      onClear={() => clearColumnFilter('group', 'name')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">Departments Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {applyFilters(groups, 'group', { name: 'Name' }).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records</td>
                </tr>
              ) : (
                applyFilters(groups, 'group', { name: 'Name' }).map((g, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                    <td className="p-3 font-medium whitespace-nowrap">{g.Id}</td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">{g.Name}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-primary/10 text-primary font-semibold text-xs px-2.5 py-1 rounded-md">{g.DeptCount || 0} Departments</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWithPagination>
      )}

      {activeTabs.includes('departments') && (
        <TableWithPagination
          title="Departments"
          count={depts.length}
          paginationKey="departments"
          pagination={pagination.departments}
          onPaginationChange={(val) => onPaginationChange('departments', val)}
          searchValue={localSearch.dept}
          onSearchValueChange={(val) => setLocalSearch(prev => ({ ...prev, dept: val }))}
        >
          <table className="w-full text-left text-sm border-collapse relative">
            <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
              <tr className="bg-primary/5 text-foreground font-semibold">
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('dept', 'Id')}>
                    <span>ID</span>
                    <SortIcon tableKey="dept" column="Id" />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('dept', 'Name')}>
                      <span>Department Name</span>
                      <SortIcon tableKey="dept" column="Name" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(depts, 'Name')} 
                      selected={columnFilters.dept.name} 
                      onChange={val => toggleFilterValue('dept', 'name', val)} 
                      onClear={() => clearColumnFilter('dept', 'name')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('dept', 'GroupName')}>
                      <span>Belongs To Group</span>
                      <SortIcon tableKey="dept" column="GroupName" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(depts, 'GroupName')} 
                      selected={columnFilters.dept.groupName} 
                      onChange={val => toggleFilterValue('dept', 'groupName', val)} 
                      onClear={() => clearColumnFilter('dept', 'groupName')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">Sections Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {applyFilters(depts, 'dept', { name: 'Name', groupName: 'GroupName' }).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records</td>
                </tr>
              ) : (
                applyFilters(depts, 'dept', { name: 'Name', groupName: 'GroupName' }).map((d, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                    <td className="p-3 font-medium whitespace-nowrap">{d.Id}</td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">{d.Name}</td>
                    <td className="p-3 whitespace-nowrap">{d.GroupName}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-primary/10 text-primary font-semibold text-xs px-2.5 py-1 rounded-md">{d.SectionCount || 0} Sections</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWithPagination>
      )}

      {activeTabs.includes('sections') && (
        <TableWithPagination
          title="Sections"
          count={sections.length}
          paginationKey="sections"
          pagination={pagination.sections}
          onPaginationChange={(val) => onPaginationChange('sections', val)}
          searchValue={localSearch.section}
          onSearchValueChange={(val) => setLocalSearch(prev => ({ ...prev, section: val }))}
        >
          <table className="w-full text-left text-sm border-collapse relative">
            <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
              <tr className="bg-primary/5 text-foreground font-semibold">
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('section', 'Id')}>
                    <span>ID</span>
                    <SortIcon tableKey="section" column="Id" />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('section', 'Name')}>
                      <span>Section Name</span>
                      <SortIcon tableKey="section" column="Name" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(sections, 'Name')} 
                      selected={columnFilters.section.name} 
                      onChange={val => toggleFilterValue('section', 'name', val)} 
                      onClear={() => clearColumnFilter('section', 'name')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('section', 'DeptName')}>
                      <span>Belongs To Dept</span>
                      <SortIcon tableKey="section" column="DeptName" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(sections, 'DeptName')} 
                      selected={columnFilters.section.deptName} 
                      onChange={val => toggleFilterValue('section', 'deptName', val)} 
                      onClear={() => clearColumnFilter('section', 'deptName')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">Teams Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {applyFilters(sections, 'section', { name: 'Name', deptName: 'DeptName' }).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records</td>
                </tr>
              ) : (
                applyFilters(sections, 'section', { name: 'Name', deptName: 'DeptName' }).map((s, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                    <td className="p-3 font-medium whitespace-nowrap">{s.Id}</td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">{s.Name}</td>
                    <td className="p-3 whitespace-nowrap">{s.DeptName}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-primary/10 text-primary font-semibold text-xs px-2.5 py-1 rounded-md">{s.TeamCount || 0} Teams</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWithPagination>
      )}

      {activeTabs.includes('teams') && (
        <TableWithPagination
          title="Teams"
          count={teams.length}
          paginationKey="teams"
          pagination={pagination.teams}
          onPaginationChange={(val) => onPaginationChange('teams', val)}
          searchValue={localSearch.team}
          onSearchValueChange={(val) => setLocalSearch(prev => ({ ...prev, team: val }))}
        >
          <table className="w-full text-left text-sm border-collapse relative">
            <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
              <tr className="bg-primary/5 text-foreground font-semibold">
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('team', 'Id')}>
                    <span>ID</span>
                    <SortIcon tableKey="team" column="Id" />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('team', 'Name')}>
                      <span>Team Name</span>
                      <SortIcon tableKey="team" column="Name" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(teams, 'Name')} 
                      selected={columnFilters.team.name} 
                      onChange={val => toggleFilterValue('team', 'name', val)} 
                      onClear={() => clearColumnFilter('team', 'name')}
                    />
                  </div>
                </th>
                <th className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('team', 'SectionName')}>
                      <span>Belongs To Section</span>
                      <SortIcon tableKey="team" column="SectionName" />
                    </div>
                    <FilterPopover 
                      options={getUniqueValues(teams, 'SectionName')} 
                      selected={columnFilters.team.sectionName} 
                      onChange={val => toggleFilterValue('team', 'sectionName', val)} 
                      onClear={() => clearColumnFilter('team', 'sectionName')}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {applyFilters(teams, 'team', { name: 'Name', sectionName: 'SectionName' }).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records</td>
                </tr>
              ) : (
                applyFilters(teams, 'team', { name: 'Name', sectionName: 'SectionName' }).map((t, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                    <td className="p-3 font-medium whitespace-nowrap">{t.Id}</td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">{t.Name}</td>
                    <td className="p-3 whitespace-nowrap">{t.SectionName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWithPagination>
      )}
    </div>
  );
}

function TableWithPagination({ title, count, children, pagination, onPaginationChange, searchValue, onSearchValueChange }) {
  const page = pagination.page;
  const size = pagination.size;
  const totalPages = Math.ceil(count / size) || 1;

  const setPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      onPaginationChange({ ...pagination, page: p });
    }
  };
  const setSize = (s) => onPaginationChange({ ...pagination, page: 1, size: s });

  return (
    <div className="bg-card border border-primary/20 rounded-xl overflow-hidden flex flex-col h-96 w-full">
      <div className="p-4 bg-primary/5 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-foreground text-sm">{title}</h4>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 rounded-full">{count} Total</span>
        </div>
        <div className="relative w-full sm:w-48">
          <input 
            type="text" 
            placeholder="Search table..."
            value={searchValue}
            onChange={e => onSearchValueChange(e.target.value)}
            className="w-full text-xs bg-background border border-primary/20 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="inline-block min-w-full align-middle">
          {children}
        </div>
      </div>
      <div className="p-3 bg-primary/5 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select 
            value={size} 
            onChange={e => setSize(parseInt(e.target.value))}
            className="bg-card border border-primary/20 rounded-lg p-1 focus:outline-none text-foreground font-semibold cursor-pointer"
          >
            {[100, 200, 500, 1000].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(1)}
            className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(page - 1)}
            className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <input 
              type="number" 
              value={page}
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
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
            className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(totalPages)}
            className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterPopover({ options = [], selected = [], onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

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
                    <span className="truncate">{opt}</span>
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