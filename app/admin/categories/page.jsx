"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Check, X, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, 
  ChevronDown, CheckSquare, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, AlertCircle, Loader2
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2037;

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

function ComboboxPopover({ data = [], fullOptions = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => (item.Id ?? item.id) === selectedValue);
  const filtered = data.filter(item => {
    const name = item.Name || item.name || '';
    if (name.toLowerCase().includes(search.toLowerCase())) return true;
  
    const parts = getHierarchyPathParts(item, fullOptions);
    return parts.some(part => part.toLowerCase().includes(search.toLowerCase()));
  });

  const triggerParts = selectedItem ? getHierarchyPathParts(selectedItem, fullOptions) : [];

  return (
    <div className="flex flex-col w-full gap-1.5">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-9 cursor-pointer">
            <span className="truncate font-semibold text-xs">
              {selectedItem ? (selectedItem.Name ?? selectedItem.name) : placeholder}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-[9999] w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
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
                  const itemId = item.Id ?? item.id;
                  const itemName = item.Name ?? item.name;
                  const isSelected = selectedValue === itemId;
                  
                  const parts = getHierarchyPathParts(item, fullOptions);

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelect(itemId);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-md px-2.5 py-1.5 flex items-center justify-between transition cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                        <span className="font-bold text-xs truncate">{itemName}</span>
                        {parts.length > 1 && (
                          <div className="text-[9px] text-muted-foreground mt-0.5 whitespace-normal opacity-80 leading-tight">
                            {parts.map((part, pIdx) => (
                              <span key={pIdx} className="inline-block whitespace-nowrap">
                                {pIdx > 0 && " ➔\u00A0"}
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {selectedItem && triggerParts.length > 1 && (
        <div className="text-[10px] font-bold px-1 mt-0.5 flex flex-wrap gap-x-1 items-center animate-in fade-in duration-200" style={{ color: 'var(--primary, #6366f1)' }}>
          <span className="text-[8px] uppercase tracking-wider bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded-md mr-1 select-none">
            Branch Path:
          </span>
          {triggerParts.slice(0, -1).map((part, pIdx) => (
            <span key={pIdx} className="inline-block whitespace-nowrap">
              {pIdx > 0 && " ➔\u00A0"}
              {part}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomSelectorPopover({ data = [], selectedValue, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedItem = data.find(item => item.id === selectedValue);
  const filtered = data.filter(item => {
    const name = item.name || '';
    const path = item.path || '';
    return name.toLowerCase().includes(search.toLowerCase()) || path.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col w-full gap-1.5">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-9 cursor-pointer">
            <span className="truncate font-semibold text-xs">
              {selectedItem ? selectedItem.name : placeholder}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-[9999] w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
            <input 
              type="text" 
              placeholder="Search by category, team, section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-background border border-primary/20 rounded-lg p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-2">No items found</p>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = selectedValue === item.id;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelect(item.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-md px-2.5 py-1.5 flex items-center justify-between transition cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className="flex flex-col text-left py-0.5 max-w-[85%]">
                        <span className="font-bold text-xs truncate">{item.name}</span>
                        {item.path && (
                          <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-normal opacity-80 leading-tight">
                            {item.path}
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {selectedItem && selectedItem.path && (
        <div className="text-[10px] font-bold px-1 mt-0.5 flex flex-wrap gap-x-1 items-center animate-in fade-in duration-200" style={{ color: 'var(--primary, #6366f1)' }}>
          <span className="text-[8px] uppercase tracking-wider bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded-md mr-1 select-none">
            Branch Path:
          </span>
          <span className="text-[9px]">{selectedItem.path}</span>
        </div>
      )}
    </div>
  );
}

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

export default function CategoriesSubcategoriesPage() {
  const { isLoading: isAccessLoading, hasAccess, accessLevel } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const canModify = isAdmin;
  const level = Number(accessLevel || 0);
  const canCreate = level > 1;

  const [activeTab, setActiveTab] = useState('categories');
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [options, setOptions] = useState([]);
  const [categoryCatalog, setCategoryCatalog] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitState, setSubmitState] = useState('idle');

  const [formState, setFormState] = useState({
    name: '',
    teamId: '',
    categoryId: '',
    hours: ''
  });

  const [pagination, setPagination] = useState({ page: 1, size: 100 });
  const [searchTerm, setSearchTerm] = useState('');

  const [categoryFilters, setCategoryFilters] = useState({
    CategoryName: [],
    TeamName: [],
    SectionName: [],
    DeptName: [],
    GroupName: []
  });

  const [subcategoryFilters, setSubcategoryFilters] = useState({
    SubcategoryName: [],
    StandardHours: [],
    CategoryName: [],
    TeamName: [],
    SectionName: [],
    DeptName: [],
    GroupName: []
  });

  const [sorting, setSorting] = useState({ column: null, direction: 'none' });

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page, pagination.size, searchTerm]);

  useEffect(() => {
    fetchOptions();
    fetchCategoryCatalog();
  }, []);

  const fetchData = async () => {
    try {
      const typeParam = activeTab === 'categories' ? 'Category' : 'Subcategory';
      const res = await fetch(`/api/category-subcategory-update?type=${typeParam}&page=${pagination.page}&size=${pagination.size}&search=${searchTerm}`);
      const json = await res.json();
      if (res.ok && json.data) {
        if (activeTab === 'categories') {
          setCategoriesList(json.data);
        } else {
          setSubcategoriesList(json.data);
        }
        setTotalCount(json.data?.[0]?.TotalCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/user-hierarchy?action=options');
      const json = await res.json();
      if (res.ok && json.data) {
        setOptions(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleOpenAddModal = () => {
    setFeedback(null);
    setFormState({ name: '', teamId: '', categoryId: '', hours: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (row) => {
    setFeedback(null);
    setActiveId(row.Id);
    if (activeTab === 'categories') {
      setFormState({
        name: row.CategoryName,
        teamId: row.TeamId,
        categoryId: '',
        hours: ''
      });
    } else {
      setFormState({
        name: row.SubcategoryName,
        teamId: row.TeamId,
        categoryId: row.CategoryId,
        hours: String(row.StandardHours)
      });
    }
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    const itemName = activeTab === 'categories' ? row.CategoryName : row.SubcategoryName;
    const isConfirmed = window.confirm(`Are you sure you want to delete ${itemName}?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/user-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'DELETE',
          type: activeTab === 'categories' ? 'Category' : 'Subcategory',
          targetId: row.Id
        })
      });
      if (res.ok) {
        fetchData();
        fetchCategoryCatalog();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'categories' && (!formState.name || !formState.teamId)) {
      setFeedback({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (activeTab === 'subcategories' && (!formState.name || !formState.categoryId || !formState.hours)) {
      setFeedback({ type: 'error', text: 'All fields are required' });
      return;
    }

    setSubmitState('loading');
    setFeedback(null);

    let res;
    try {
      if (isEditing) {
        res = await fetch('/api/category-subcategory-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: activeTab === 'categories' ? 'Category' : 'Subcategory',
            targetId: activeId,
            name: formState.name,
            parentId: activeTab === 'categories' ? parseInt(formState.teamId) : parseInt(formState.categoryId),
            hours: activeTab === 'subcategories' ? parseFloat(formState.hours) : 0
          })
        });
      } else {
        res = await fetch('/api/user-hierarchy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: 'CREATE',
            type: activeTab === 'categories' ? 'Category' : 'Subcategory',
            name: formState.name,
            parentId: activeTab === 'categories' ? parseInt(formState.teamId) : parseInt(formState.categoryId),
            hours: activeTab === 'subcategories' ? parseFloat(formState.hours) : 0
          })
        });
      }

      const result = await res.json();
      if (res.ok && result.message === 'Success') {
        setSubmitState('success');
        setFeedback({ type: 'success', text: isEditing ? 'Update completed' : 'Created successfully' });
        setTimeout(() => {
          setSubmitState('idle');
          setIsModalOpen(false);
          fetchData();
          fetchCategoryCatalog();
        }, 1500);
      } else {
        setSubmitState('error');
        setFeedback({ type: 'error', text: result.message || 'Action execution failed' });
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } catch (err) {
      setSubmitState('error');
      setFeedback({ type: 'error', text: 'Network failure' });
      setTimeout(() => setSubmitState('idle'), 3000);
    }
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
    const targetList = activeTab === 'categories' ? categoriesList : subcategoriesList;
    return Array.from(new Set(targetList.map(item => item[key]).filter(Boolean)));
  };

  const toggleFilterValue = (column, value) => {
    if (activeTab === 'categories') {
      setCategoryFilters(prev => {
        const active = prev[column];
        const next = active.includes(value) ? active.filter(v => v !== value) : [...active, value];
        return { ...prev, [column]: next };
      });
    } else {
      setSubcategoryFilters(prev => {
        const active = prev[column];
        const next = active.includes(value) ? active.filter(v => v !== value) : [...active, value];
        return { ...prev, [column]: next };
      });
    }
  };

  const clearColumnFilter = (column) => {
    if (activeTab === 'categories') {
      setCategoryFilters(prev => ({ ...prev, [column]: [] }));
    } else {
      setSubcategoryFilters(prev => ({ ...prev, [column]: [] }));
    }
  };

  const applyFilters = (data) => {
    let output = [...data];
    const targetFilters = activeTab === 'categories' ? categoryFilters : subcategoryFilters;
    Object.keys(targetFilters).forEach(col => {
      const selectedFilters = targetFilters[col];
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination({ page: 1, size: 100 });
    setSearchTerm('');
    setSorting({ column: null, direction: 'none' });
  };

  const filteredTeams = options.filter(o => o.Type === 'Team' || o.type === 'Team');

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex p-1 flex-col space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-4 shrink-0">
        <div className="px-1">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            Categories & Subcategories Setup
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure hierarchy components and map tasks accordingly.
          </p>
        </div>
        <button
          hidden={!canCreate}
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 text-xs font-bold mr-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'categories' ? 'Add Category' : 'Add Subcategory'}
        </button>
      </div>

      <div className="flex border-b border-primary/10 gap-2 shrink-0">
        <button
          onClick={() => handleTabChange('categories')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Categories
        </button>
        <button
          onClick={() => handleTabChange('subcategories')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'subcategories' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Subcategories
        </button>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-210px)] w-full">
        <div className="p-4 bg-primary/5 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm">
              {activeTab === 'categories' ? 'Categories List' : 'Subcategories List'}
            </h4>
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
            {activeTab === 'categories' ? (
              <table className="w-full text-left text-sm border-collapse relative">
                <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
                  <tr className="bg-primary/5 text-foreground font-semibold text-xs">
                    <th className="p-3 whitespace-nowrap" hidden={!canModify}>Actions</th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('CategoryName')}>
                          <span>Category Name</span>
                          <SortIcon column="CategoryName" />
                        </div>
                        <FilterPopover 
                          options={getUniqueValues('CategoryName')} 
                          selected={categoryFilters.CategoryName} 
                          onChange={val => toggleFilterValue('CategoryName', val)} 
                          onClear={() => clearColumnFilter('CategoryName')}
                        />
                      </div>
                    </th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('TeamName')}>
                          <span>Assigned Team</span>
                          <SortIcon column="TeamName" />
                        </div>
                        <FilterPopover 
                          options={getUniqueValues('TeamName')} 
                          selected={categoryFilters.TeamName} 
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
                          selected={categoryFilters.SectionName} 
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
                          selected={categoryFilters.DeptName} 
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
                          selected={categoryFilters.GroupName} 
                          onChange={val => toggleFilterValue('GroupName', val)} 
                          onClear={() => clearColumnFilter('GroupName')}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {applyFilters(categoriesList).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records found</td>
                    </tr>
                  ) : (
                    applyFilters(categoriesList).map((row, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                        <td hidden={!canModify} className="p-3 whitespace-nowrap flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1 hover:bg-primary/10 rounded text-blue-500 hover:text-blue-400 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(row)}
                            className="p-1 hover:bg-primary/10 rounded text-red-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-foreground whitespace-nowrap">{row.CategoryName}</td>
                        <td className="p-3 font-medium text-foreground whitespace-nowrap">{row.TeamName}</td>
                        <td className="p-3 whitespace-nowrap">{row.SectionName}</td>
                        <td className="p-3 whitespace-nowrap">{row.DeptName}</td>
                        <td className="p-3 whitespace-nowrap">{row.GroupName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm border-collapse relative">
                <thead className="sticky top-0 z-10 bg-card border-b border-primary/20 shadow-sm">
                  <tr className="bg-primary/5 text-foreground font-semibold text-xs">
                    <th className="p-3 whitespace-nowrap" hidden={!canModify}>Actions</th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('SubcategoryName')}>
                          <span>Subcategory Name</span>
                          <SortIcon column="SubcategoryName" />
                        </div>
                        <FilterPopover 
                          options={getUniqueValues('SubcategoryName')} 
                          selected={subcategoryFilters.SubcategoryName} 
                          onChange={val => toggleFilterValue('SubcategoryName', val)} 
                          onClear={() => clearColumnFilter('SubcategoryName')}
                        />
                      </div>
                    </th>
                    <th className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center cursor-pointer select-none" onClick={() => handleSortCycle('StandardHours')}>
                          <span>Standard Hours</span>
                          <SortIcon column="StandardHours" />
                        </div>
                        <FilterPopover 
                          options={getUniqueValues('StandardHours')} 
                          selected={subcategoryFilters.StandardHours} 
                          onChange={val => toggleFilterValue('StandardHours', val)} 
                          onClear={() => clearColumnFilter('StandardHours')}
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
                          selected={subcategoryFilters.CategoryName} 
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
                          selected={subcategoryFilters.TeamName} 
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
                          selected={subcategoryFilters.SectionName} 
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
                          selected={subcategoryFilters.DeptName} 
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
                          selected={subcategoryFilters.GroupName} 
                          onChange={val => toggleFilterValue('GroupName', val)} 
                          onClear={() => clearColumnFilter('GroupName')}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {applyFilters(subcategoriesList).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-xs text-muted-foreground whitespace-nowrap">No records found</td>
                    </tr>
                  ) : (
                    applyFilters(subcategoriesList).map((row, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 text-muted-foreground hover:text-foreground transition text-xs">
                        <td hidden={!canModify} className="p-3 whitespace-nowrap flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1 hover:bg-primary/10 rounded text-blue-500 hover:text-blue-400 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(row)}
                            className="p-1 hover:bg-primary/10 rounded text-red-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-foreground whitespace-nowrap">{row.SubcategoryName}</td>
                        <td className="p-3 font-bold text-primary whitespace-nowrap">{row.StandardHours} Hours</td>
                        <td className="p-3 whitespace-nowrap font-medium text-foreground">{row.CategoryName}</td>
                        <td className="p-3 whitespace-nowrap">{row.TeamName}</td>
                        <td className="p-3 whitespace-nowrap">{row.SectionName}</td>
                        <td className="p-3 whitespace-nowrap">{row.DeptName}</td>
                        <td className="p-3 whitespace-nowrap">{row.GroupName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
          <div className="bg-card rounded-xl p-5 w-full max-w-sm shadow-2xl relative border border-primary/50">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
              {isEditing ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              <span>{isEditing ? `Update ${activeTab === 'categories' ? 'Category' : 'Subcategory'}` : `Create ${activeTab === 'categories' ? 'Category' : 'Subcategory'}`}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">    
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Name</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs rounded p-2 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold"
                />
              </div>

              {activeTab === 'categories' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Assigned Team</label>
                  <ComboboxPopover 
                    data={filteredTeams}
                    fullOptions={options}
                    selectedValue={formState.teamId}
                    onSelect={val => setFormState(prev => ({ ...prev, teamId: val }))}
                    placeholder="-- Select Team --"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Assigned Category</label>
                    <CustomSelectorPopover 
                      data={categoryCatalog}
                      selectedValue={formState.categoryId}
                      onSelect={val => setFormState(prev => ({ ...prev, categoryId: val }))}
                      placeholder="-- Select Category --"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Standard Hours</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formState.hours}
                      onChange={e => setFormState(prev => ({ ...prev, hours: e.target.value }))}
                      className="w-full text-xs rounded p-2 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold"
                    />
                  </div>
                </>
              )}

              {feedback && (
                <div className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{feedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitState !== 'idle'}
                className="w-full py-2.5 text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
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
                  {submitState === 'loading' ? 'Processing...' : submitState === 'success' ? 'Success' : submitState === 'error' ? 'Failed' : isEditing ? 'Commit Update' : 'Save'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}