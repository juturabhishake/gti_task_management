"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Network, FolderTree, Search, Globe } from 'lucide-react';
import HierarchyCards from './HierarchyCards';
import HierarchyTables from './HierarchyTables';
import TreeView3D from './TreeView3D';
import { useAdminAccessCheck } from '@/lib/useAdminAccessCheck';
export default function HierarchyPage() {
  const PAGE_ID_FOR_THIS_FORM = 2034;
  const { isLoading: isAccessLoading, hasAccess } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [activeMode, setActiveMode] = useState('tree'); 
  const [activeTableTabs, setActiveTableTabs] = useState(['groups', 'departments', 'sections', 'teams']);
  const [options, setOptions] = useState([]);
  
  const [groupsData, setGroupsData] = useState([]);
  const [deptsData, setDeptsData] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [treeData, setTreeData] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);

  const [highlightedNodePath, setHighlightedNodePath] = useState(null);

  const [autoSelections, setAutoSelections] = useState({
    deptGroupId: '',
    sectionDeptId: '',
    teamSectionId: ''
  });

  const [pagination, setPagination] = useState({
    groups: { page: 1, size: 100 },
    departments: { page: 1, size: 100 },
    sections: { page: 1, size: 100 },
    teams: { page: 1, size: 100 }
  });

  const fetchDropdownOptions = async () => {
    try {
      const response = await fetch('/api/hierarchy?action=options');
      const res = await response.json();
      if (response.ok && res.data) {
        setOptions(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTreeAndTables = async () => {
    try {
      const treeResponse = await fetch(`/api/hierarchy?action=tree&search=${searchTerm}`);
      const treeJson = await treeResponse.json();
      if (treeResponse.ok && treeJson.data) {
        setTreeData(treeJson.data);
      }

      const groupsResponse = await fetch(`/api/hierarchy?action=groups&page=${pagination.groups.page}&size=${pagination.groups.size}&search=${searchTerm}`);
      const groupsJson = await groupsResponse.json();
      if (groupsResponse.ok && groupsJson.data) {
        setGroupsData(groupsJson.data);
      }

      const deptsResponse = await fetch(`/api/hierarchy?action=departments&page=${pagination.departments.page}&size=${pagination.departments.size}&search=${searchTerm}`);
      const deptsJson = await deptsResponse.json();
      if (deptsResponse.ok && deptsJson.data) {
        setDeptsData(deptsJson.data);
      }

      const sectionsResponse = await fetch(`/api/hierarchy?action=sections&page=${pagination.sections.page}&size=${pagination.sections.size}&search=${searchTerm}`);
      const sectionsJson = await sectionsResponse.json();
      if (sectionsResponse.ok && sectionsJson.data) {
        setSectionsData(sectionsJson.data);
      }

      const teamsResponse = await fetch(`/api/hierarchy?action=teams&page=${pagination.teams.page}&size=${pagination.teams.size}&search=${searchTerm}`);
      const teamsJson = await teamsResponse.json();
      if (teamsResponse.ok && teamsJson.data) {
        setTeamsData(teamsJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    fetchTreeAndTables();
  }, [
    pagination.groups.page, pagination.groups.size,
    pagination.departments.page, pagination.departments.size,
    pagination.sections.page, pagination.sections.size,
    pagination.teams.page, pagination.teams.size,
    searchTerm
  ]);

  const handleEntitySaved = () => {
    fetchDropdownOptions();
    fetchTreeAndTables();
  };

  const toggleTableTab = (tab) => {
    if (activeTableTabs.includes(tab)) {
      setActiveTableTabs(prev => prev.filter(t => t !== tab));
    } else {
      setActiveTableTabs(prev => [...prev, tab]);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = [];
    const grps = options.filter(o => o.Type === 'Group' || o.type === 'Group');
    const depts = options.filter(o => o.Type === 'Department' || o.type === 'Department');
    const secs = options.filter(o => o.Type === 'Section' || o.type === 'Section');
    const teams = options.filter(o => o.Type === 'Team' || o.type === 'Team');

    grps.forEach(g => {
      if (g.Name?.toLowerCase().includes(val.toLowerCase()) || g.name?.toLowerCase().includes(val.toLowerCase())) {
        filtered.push({
          type: 'Group',
          name: g.Name || g.name,
          details: 'Top Level Group Node',
          path: { groupId: g.Id }
        });
      }
    });

    depts.forEach(d => {
      if (d.Name?.toLowerCase().includes(val.toLowerCase()) || d.name?.toLowerCase().includes(val.toLowerCase())) {
        const grp = grps.find(g => g.Id === d.ParentId || g.id === d.ParentId);
        filtered.push({
          type: 'Department',
          name: d.Name || d.name,
          details: `Belongs To: ${grp?.Name || 'Group'}`,
          path: { groupId: d.ParentId, deptId: d.Id }
        });
      }
    });

    secs.forEach(s => {
      if (s.Name?.toLowerCase().includes(val.toLowerCase()) || s.name?.toLowerCase().includes(val.toLowerCase())) {
        const dep = depts.find(d => d.Id === s.ParentId || d.id === s.ParentId);
        const grp = dep ? grps.find(g => g.Id === dep.ParentId || g.id === dep.ParentId) : null;
        filtered.push({
          type: 'Section',
          name: s.Name || s.name,
          details: `${grp?.Name || 'Group'} → ${dep?.Name || 'Dept'}`,
          path: { groupId: grp?.Id, deptId: dep?.Id, sectionId: s.Id }
        });
      }
    });

    teams.forEach(t => {
      if (t.Name?.toLowerCase().includes(val.toLowerCase()) || t.name?.toLowerCase().includes(val.toLowerCase())) {
        const sec = secs.find(s => s.Id === t.ParentId || s.id === t.ParentId);
        const dep = sec ? depts.find(d => d.Id === sec.ParentId || d.id === sec.ParentId) : null;
        const grp = dep ? grps.find(g => g.Id === dep.ParentId || g.id === dep.ParentId) : null;
        filtered.push({
          type: 'Team',
          name: t.Name || t.name,
          details: `${grp?.Name || 'Group'} → ${dep?.Name || 'Dept'} → ${sec?.Name || 'Section'}`,
          path: { groupId: grp?.Id, deptId: dep?.Id, sectionId: sec?.Id, teamId: t.Id }
        });
      }
    });

    setSearchResults(filtered.slice(0, 10));
    setSearchIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => {
        const next = Math.min(prev + 1, searchResults.length - 1);
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => {
        const next = Math.max(prev - 1, 0);
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchIndex >= 0 && searchIndex < searchResults.length) {
        selectSearchResult(searchResults[searchIndex]);
      }
    }
  };

  const scrollIntoView = (index) => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.children;
    if (items[index]) {
      items[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  const selectSearchResult = (result) => {
    setHighlightedNodePath(result.path);
    setSearchTerm(result.name);
    setSearchResults([]);
    setSearchFocused(false);
    setActiveMode('tree');
  };

  const transformTreeFromFlatData = () => {
    const uniqueGroups = [];
    const uniqueDepts = [];
    const uniqueSections = [];
    const uniqueTeams = [];

    treeData.forEach(row => {
      if (row.GroupId && !uniqueGroups.some(g => g.Id === row.GroupId)) {
        uniqueGroups.push({ Id: row.GroupId, Name: row.GroupName });
      }
      if (row.DeptId && !uniqueDepts.some(d => d.Id === row.DeptId)) {
        uniqueDepts.push({ Id: row.DeptId, Name: row.DeptName, GroupId: row.GroupId });
      }
      if (row.SectionId && !uniqueSections.some(s => s.Id === row.SectionId)) {
        uniqueSections.push({ Id: row.SectionId, Name: row.SectionName, DeptId: row.DeptId });
      }
      if (row.TeamId && !uniqueTeams.some(t => t.Id === row.TeamId)) {
        uniqueTeams.push({ Id: row.TeamId, Name: row.TeamName, SectionId: row.SectionId });
      }
    });

    return {
      groups: uniqueGroups,
      depts: uniqueDepts,
      sections: uniqueSections,
      teams: uniqueTeams
    };
  };

  const processedTree = transformTreeFromFlatData();

  const handlePaginationChange = (tableKey, newPagination) => {
    setPagination(prev => ({
      ...prev,
      [tableKey]: newPagination
    }));
  };

  return (
    <div className="@container/main min-h-screen bg-background text-foreground flex flex-col items-center p-3 space-y-4 w-full mx-auto">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Network className="text-primary w-7 h-7" />
            Manage Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create and structure your groups, departments, sections, and teams.
          </p>
        </div>
      </div>

      <HierarchyCards 
        options={options} 
        onSaveSuccess={handleEntitySaved} 
        autoSelections={autoSelections}
        setAutoSelections={setAutoSelections}
      />

      <div className="w-full flex flex-wrap md:items-center justify-between gap-4 pt-6 border-t border-primary/10">
        <div className="flex items-center gap-1 p-1 bg-primary/5 rounded-xl border border-primary/10 self-start">
          <button 
            onClick={() => setActiveMode('tree')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${activeMode === 'tree' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FolderTree className="w-4 h-4" />
            Interactive Tree
          </button>
          <button 
            onClick={() => setActiveMode('tables')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${activeMode === 'tables' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Globe className="w-4 h-4" />
            Grid Tables View
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search hierarchy..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full text-sm bg-card border border-primary/20 rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          </div>

          {searchFocused && searchResults.length > 0 && (
            <div 
              ref={listContainerRef}
              className="absolute top-11 left-0 w-full bg-card border border-primary/20 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto p-1.5 space-y-1"
            >
              {searchResults.map((res, index) => (
                <button
                  key={index}
                  onMouseDown={() => selectSearchResult(res)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col cursor-pointer ${index === searchIndex ? 'bg-primary/10 text-foreground font-semibold border border-primary/30' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-foreground text-[11px] truncate max-w-[170px]">{res.name}</span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{res.type}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 truncate w-full">{res.details}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeMode === 'tables' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {['groups', 'departments', 'sections', 'teams'].map(tab => (
              <button
                key={tab}
                onClick={() => toggleTableTab(tab)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${activeTableTabs.includes(tab) ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-primary/10 text-muted-foreground hover:text-foreground'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        {activeMode === 'tree' ? (
          <TreeView3D 
            groups={processedTree.groups} 
            depts={processedTree.depts} 
            sections={processedTree.sections} 
            teams={processedTree.teams}
            highlightedPath={highlightedNodePath}
          />
        ) : (
          <HierarchyTables 
            groups={groupsData}
            depts={deptsData}
            sections={sectionsData}
            teams={teamsData}
            activeTabs={activeTableTabs}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
          />
        )}
      </div>
    </div>
  );
}