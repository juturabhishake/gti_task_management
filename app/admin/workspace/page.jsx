"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, ZoomIn, ZoomOut, Info, Maximize2, Minimize2,
  Search, Plus, Trash2, Pencil, Check, X
} from 'lucide-react';
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";
const PAGE_ID_FOR_THIS_FORM = 2035;
const CustomCombobox = ({ options, value, onChange, placeholder, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative w-full text-xs" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 border rounded cursor-pointer transition-colors bg-transparent border border-primary/30"
        style={{
          color: value ? (theme === 'dark' ? '#f1f5f9' : '#0f172a') : (theme === 'dark' ? '#94a3b8' : '#64748b')
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </div>
      {isOpen && (
        <div 
          className="absolute z-[999] w-full mt-1 border rounded shadow-2xl max-h-48 flex flex-col overflow-hidden bg-card border border-primary/30"
          // style={{
          //   backgroundColor: theme === 'dark' ? '#0a0e17' : '#ffffff',
          //   borderColor: theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)',
          // }}
        >
          <div className="p-1 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)' }}>
            <input
              type="text"
              autoFocus
              className="w-full p-1.5 rounded focus:outline-none bg-transparent"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>No results found.</div>
            ) : (
              filteredOptions.map(o => (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setIsOpen(false); setSearch(""); }}
                  className="p-2 cursor-pointer rounded flex items-center justify-between transition-colors"
                  style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="truncate pr-2">{o.label}</span>
                  {value === o.value && <Check className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--primary, #6366f1)' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SubmitButton = ({ state, defaultText }) => (
  <button
    type="submit"
    disabled={state !== 'idle'}
    className="w-full py-2 text-xs font-bold uppercase rounded transition flex items-center justify-center gap-2 shadow-lg"
    style={{
       backgroundColor: state === 'error' ? '#ef4444' : state === 'success' ? '#10b981' : 'var(--primary, #6366f1)',
       color: '#ffffff',
       cursor: state === 'idle' ? 'pointer' : 'not-allowed',
       filter: state === 'idle' ? 'none' : 'brightness(0.9)'
    }}
  >
    {state === 'loading' && <RefreshCw className="w-4 h-4 animate-spin" />}
    {state === 'success' && <Check className="w-4 h-4" />}
    {state === 'error' && <X className="w-4 h-4" />}
    {state === 'idle' && <Check className="w-4 h-4" />}
    <span>
      {state === 'loading' ? 'Processing...' : state === 'success' ? 'Success' : state === 'error' ? 'Failed' : defaultText}
    </span>
  </button>
);

export default function HierarchyExplorer() {
  const { isLoading: isAccessLoading, hasAccess, accessLevel } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: accessLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const level = Number(accessLevel || 0);
  const canViewHoverActions = level === 2 || level === 3; 
  const canAddNode = level === 2 || level === 3;          
  const canEditNode = level === 3;                        
  const canDeleteNode = level === 3;                      
  const canRightClickCreate = level === 3;
  const canModifyHierarchy = isAdmin;
  const [treeData, setTreeData] = useState([]);
  const [options, setOptions] = useState([]);
  const [userCatalog, setUserCatalog] = useState([]);
  const [shiftCatalog, setShiftCatalog] = useState([]);
  const [theme, setTheme] = useState('dark');
  
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [highlightedPath, setHighlightedPath] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [draftNodes, setDraftNodes] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [nodeToCenter, setNodeToCenter] = useState(null);

  // const [panOffset, setPanOffset] = useState({ x: typeof window !== 'undefined' && window.innerWidth > 768 ? window.innerWidth / 2.5 : typeof window !== 'undefined' ? window.innerWidth / 2 : 200, y: 150 });
  const [panOffset, setPanOffset] = useState({ x: 200, y: 150 });
  const [zoomScale, setZoomScale] = useState(0.85);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [activeModalNode, setActiveModalNode] = useState(null);
  const [submitState, setSubmitState] = useState('idle');

  const [inlineEditingNodeId, setInlineEditingNodeId] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [inlineHoursValue, setInlineHoursValue] = useState("");

  const [userForm, setUserForm] = useState({ userId: "", shiftId: "", designation: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [activeTab, setActiveTab] = useState("user");

  const [apiError, setApiError] = useState(null);
  const [selectedNodeMenuId, setSelectedNodeMenuId] = useState(null);
  const isPanning = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const dragStartPositions = useRef({});
  const listContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const touchStartDist = useRef(null);
  const longPressTimer = useRef(null);
  const [groupsPerRow, setGroupsPerRow] = useState(5);
  const nodesRef = useRef([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialX = window.innerWidth > 768 ? window.innerWidth / 2.5 : window.innerWidth / 2;
      setPanOffset({ x: initialX, y: 150 });
    }
    if (typeof window !== 'undefined') {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setGroupsPerRow(1); 
      else if (width < 1024) setGroupsPerRow(3);
      else setGroupsPerRow(5);                  
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }
  }, []);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (nodeToCenter && nodes.length > 0) {
      const matchNode = nodes.find(n => n.id === nodeToCenter);
      if (matchNode) {
        setTimeout(() => {
          centerOnNode(matchNode);
          setNodeToCenter(null);
        }, 100);
      }
    }
  }, [nodes, nodeToCenter]);

  useEffect(() => {
    fetchTreeAndTables();
    fetchOptions();
    fetchCatalogs();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        setZoomScale(prev => Math.min(prev + 0.1, 1.8));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoomScale(prev => Math.max(prev - 0.1, 0.4));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        triggerCreateRootGroup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerCreateRootGroup = () => {
    setInlineEditingNodeId("new-root-group");
    setInlineEditValue("");
    const defaultX = 0;
    const defaultY = 100;
    
    const rootDraft = {
      id: "new-root-group",
      label: "",
      type: "group",
      rawId: 0,
      x: defaultX,
      y: defaultY,
      countText: "New Group",
      isExpanded: false,
      isNew: true
    };
    
    setDraftNodes(prev => [...prev, rootDraft]);
    setNodeToCenter("new-root-group");
  };

  const fetchTreeAndTables = async (searchVal = '') => {
    try {
      const response = await fetch(`/api/directory?action=tree&search=${encodeURIComponent(searchVal)}`);
      const json = await response.json();
      if (response.ok && json.data) {
        setTreeData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/directory?action=tree');
      const json = await response.json();
      if (response.ok && json.data) {
        const flatOptions = [];
        const seen = new Set();
        json.data.forEach(row => {
          if (row.GroupId && !seen.has(`group-${row.GroupId}`)) {
            seen.add(`group-${row.GroupId}`);
            flatOptions.push({ Id: `group-${row.GroupId}`, rawId: row.GroupId, Name: row.GroupName, Type: 'Group', ParentId: null });
          }
          if (row.DeptId && !seen.has(`dept-${row.DeptId}`)) {
            seen.add(`dept-${row.DeptId}`);
            flatOptions.push({ Id: `dept-${row.DeptId}`, rawId: row.DeptId, Name: row.DeptName, Type: 'Department', ParentId: `group-${row.GroupId}` });
          }
          if (row.SectionId && !seen.has(`sec-${row.SectionId}`)) {
            seen.add(`sec-${row.SectionId}`);
            flatOptions.push({ Id: `sec-${row.SectionId}`, rawId: row.SectionId, Name: row.SectionName, Type: 'Section', ParentId: `dept-${row.DeptId}` });
          }
          if (row.TeamId && !seen.has(`team-${row.TeamId}`)) {
            seen.add(`team-${row.TeamId}`);
            flatOptions.push({ Id: `team-${row.TeamId}`, rawId: row.TeamId, Name: row.TeamName, Type: 'Team', ParentId: `sec-${row.SectionId}` });
          }
          if (row.CategoryId && !seen.has(`cat-${row.CategoryId}`)) {
            seen.add(`cat-${row.CategoryId}`);
            flatOptions.push({ Id: `cat-${row.CategoryId}`, rawId: row.CategoryId, Name: row.CategoryName, Type: 'Category', ParentId: `team-${row.TeamId}` });
          }
          if (row.SubcategoryId && !seen.has(`sub-${row.SubcategoryId}`)) {
            seen.add(`sub-${row.SubcategoryId}`);
            flatOptions.push({ Id: `sub-${row.SubcategoryId}`, rawId: row.SubcategoryId, Name: row.SubcategoryName, Type: 'Subcategory', ParentId: `cat-${row.CategoryId}` });
          }
          if (row.MapId && !seen.has(`user-${row.MapId}`)) {
            seen.add(`user-${row.MapId}`);
            flatOptions.push({ Id: `user-${row.MapId}`, rawId: row.MapId, Name: row.Username, Type: 'User', ParentId: `team-${row.TeamId}` });
          }
        });
        setOptions(flatOptions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const resUsers = await fetch('/api/directory?action=users');
      const resShifts = await fetch('/api/directory?action=shifts');
      if (resUsers.ok) {
        const d = await resUsers.json();
        setUserCatalog(d.data || []);
      }
      if (resShifts.ok) {
        const d = await resShifts.json();
        setShiftCatalog(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerPostAction = async (payload) => {
    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed execution of transaction.");
      }
      setApiError(null);
      await fetchTreeAndTables();
      await fetchOptions();
      return { success: true, id: data.id };
    } catch (err) {
      setApiError(err.message);
      return { success: false, error: err.message };
    }
  };

  const transformTreeFromFlatData = () => {
    const uniqueGroups = [];
    const uniqueDepts = [];
    const uniqueSections = [];
    const uniqueTeams = [];
    const uniqueCategories = [];
    const uniqueSubcategories = [];
    const uniqueUsers = [];

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
      if (row.CategoryId && !uniqueCategories.some(c => c.Id === row.CategoryId)) {
        uniqueCategories.push({ Id: row.CategoryId, Name: row.CategoryName, TeamId: row.TeamId });
      }
      if (row.SubcategoryId && !uniqueSubcategories.some(sc => sc.Id === row.SubcategoryId)) {
        uniqueSubcategories.push({ Id: row.SubcategoryId, Name: row.SubcategoryName, StandardHours: row.StandardHours, CategoryId: row.CategoryId });
      }
      if (row.MapId && !uniqueUsers.some(u => u.Id === row.MapId)) {
        uniqueUsers.push({
          Id: row.MapId,
          UserId: row.UserId,
          Username: row.Username,
          EmployeeId: row.EmployeeId,
          Designation: row.Designation,
          ShiftName: row.ShiftName,
          TeamId: row.TeamId
        });
      }
    });

    return {
      groups: uniqueGroups,
      depts: uniqueDepts,
      sections: uniqueSections,
      teams: uniqueTeams,
      categories: uniqueCategories,
      subcategories: uniqueSubcategories,
      users: uniqueUsers
    };
  };

  const tracePath = (nodeId, allOptions) => {
    const path = {};
    let current = allOptions.find(o => o.Id === nodeId);
    if (!current) return path;
    const visited = new Set();
    while (current && !visited.has(current.Id)) {
      visited.add(current.Id);
      if (current.Type === 'Group') path.groupId = current.rawId;
      else if (current.Type === 'Department') path.deptId = current.rawId;
      else if (current.Type === 'Section') path.sectionId = current.rawId;
      else if (current.Type === 'Team') path.teamId = current.rawId;
      else if (current.Type === 'Category') path.categoryId = current.rawId;
      else if (current.Type === 'Subcategory') path.subcategoryId = current.rawId;
      else if (current.Type === 'User') path.userMapId = current.rawId;
      current = allOptions.find(o => o.Id === current.ParentId);
    }
    return path;
  };

  useEffect(() => {
    const { groups, depts, sections, teams, categories, subcategories, users } = transformTreeFromFlatData();

    const layoutNodes = [];
    const layoutLinks = [];
    // const rootXGap = 450;
    let groupsToRender = [...groups];
    if (selectedGroupId) {
      groupsToRender = groups.filter(g => g.Id === selectedGroupId);
    } else if (highlightedPath && highlightedPath.groupId) {
      groupsToRender = groups.filter(g => g.Id === highlightedPath.groupId);
    }
    const rootXGap = groupsToRender.length > 5 ? 210 : 240; 
    const levelYGap = 160;
    const nodeSpacingX = 200;

    groupsToRender.forEach((group, gIdx) => {
      const gId = `group-${group.Id}`;
      const groupExpanded = expandedNodes[gId] === true;

      let groupNode = nodesRef.current.find(n => n.id === gId);
      const gx = groupNode ? groupNode.x : (groupsToRender.length === 1 ? 0 : gIdx * rootXGap - ((groupsToRender.length - 1) * rootXGap) / 2);
      const gy = groupNode ? groupNode.y : 100;

      const subDepts = depts.filter(d => d.GroupId === group.Id);

      layoutNodes.push({
        id: gId,
        label: group.Name,
        type: 'group',
        rawId: group.Id,
        x: gx,
        y: gy,
        countText: `${subDepts.length} Departments`,
        isExpanded: groupExpanded
      });

      if (groupExpanded) {
        subDepts.forEach((dept, dIdx) => {
          const dId = `dept-${dept.Id}`;
          const deptExpanded = expandedNodes[dId] === true;

          let deptNode = nodesRef.current.find(n => n.id === dId);
          const dx = deptNode ? deptNode.x : gx + (dIdx - (subDepts.length - 1) / 2) * nodeSpacingX;
          const dy = deptNode ? deptNode.y : gy + levelYGap;

          const subSections = sections.filter(s => s.DeptId === dept.Id);

          layoutNodes.push({
            id: dId,
            label: dept.Name,
            type: 'dept',
            rawId: dept.Id,
            parentId: gId,
            x: dx,
            y: dy,
            countText: `${subSections.length} Sections`,
            isExpanded: deptExpanded
          });

          layoutLinks.push({ source: gId, target: dId });

          if (deptExpanded) {
            subSections.forEach((sec, sIdx) => {
              const sId = `sec-${sec.Id}`;
              const secExpanded = expandedNodes[sId] === true;

              let secNode = nodesRef.current.find(n => n.id === sId);
              const sx = secNode ? secNode.x : dx + (sIdx - (subSections.length - 1) / 2) * nodeSpacingX;
              const sy = secNode ? secNode.y : dy + levelYGap;

              const subTeams = teams.filter(t => t.SectionId === sec.Id);

              layoutNodes.push({
                id: sId,
                label: sec.Name,
                type: 'section',
                rawId: sec.Id,
                parentId: dId,
                x: sx,
                y: sy,
                countText: `${subTeams.length} Teams`,
                isExpanded: secExpanded
              });

              layoutLinks.push({ source: dId, target: sId });

              if (secExpanded) {
                subTeams.forEach((team, tIdx) => {
                  const tId = `team-${team.Id}`;
                  const teamExpanded = expandedNodes[tId] === true;

                  let teamNode = nodesRef.current.find(n => n.id === tId);
                  const tx = teamNode ? teamNode.x : sx + (tIdx - (subTeams.length - 1) / 2) * nodeSpacingX;
                  const ty = teamNode ? teamNode.y : sy + levelYGap;

                  const subCats = categories.filter(c => c.TeamId === team.Id);
                  const subUsers = users.filter(u => u.TeamId === team.Id);
                  const totalChildren = subCats.length + subUsers.length;

                  layoutNodes.push({
                    id: tId,
                    label: team.Name,
                    type: 'team',
                    rawId: team.Id,
                    parentId: sId,
                    x: tx,
                    y: ty,
                    countText: `${subCats.length} Cat / ${subUsers.length} Users`,
                    isExpanded: teamExpanded
                  });

                  layoutLinks.push({ source: sId, target: tId });

                  if (teamExpanded) {
                    subCats.forEach((cat, cIdx) => {
                      const cId = `cat-${cat.Id}`;
                      const catExpanded = expandedNodes[cId] === true;

                      let catNode = nodesRef.current.find(n => n.id === cId);
                      const cx = catNode ? catNode.x : tx + (cIdx - (totalChildren - 1) / 2) * nodeSpacingX;
                      const cy = catNode ? catNode.y : ty + levelYGap;

                      const subSubCats = subcategories.filter(sc => sc.CategoryId === cat.Id);

                      layoutNodes.push({
                        id: cId,
                        label: cat.Name,
                        type: 'category',
                        rawId: cat.Id,
                        parentId: tId,
                        x: cx,
                        y: cy,
                        countText: `${subSubCats.length} Subcategories`,
                        isExpanded: catExpanded
                      });

                      layoutLinks.push({ source: tId, target: cId });

                      if (catExpanded) {
                        subSubCats.forEach((sub, scIdx) => {
                          const scId = `sub-${sub.Id}`;
                          let subNode = nodesRef.current.find(n => n.id === scId);
                          const scx = subNode ? subNode.x : cx + (scIdx - (subSubCats.length - 1) / 2) * nodeSpacingX;
                          const scy = subNode ? subNode.y : cy + levelYGap;

                          layoutNodes.push({
                            id: scId,
                            label: sub.Name,
                            type: 'subcategory',
                            rawId: sub.Id,
                            parentId: cId,
                            x: scx,
                            y: scy,
                            countText: `${sub.StandardHours} Hrs`,
                            isExpanded: false
                          });

                          layoutLinks.push({ source: cId, target: scId });
                        });
                      }
                    });

                    subUsers.forEach((usr, uIdx) => {
                      const uId = `user-${usr.Id}`;
                      let usrNode = nodesRef.current.find(n => n.id === uId);
                      const ux = usrNode ? usrNode.x : tx + ((subCats.length + uIdx) - (totalChildren - 1) / 2) * nodeSpacingX;
                      const uy = usrNode ? usrNode.y : ty + levelYGap;

                      layoutNodes.push({
                        id: uId,
                        label: usr.Username,
                        type: 'user',
                        rawId: usr.Id,
                        parentId: tId,
                        x: ux,
                        y: uy,
                        countText: `${usr.Designation || 'Staff'} (${usr.ShiftName || 'No Shift'})`,
                        isExpanded: false
                      });

                      layoutLinks.push({ source: tId, target: uId });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    draftNodes.forEach(draft => {
      const parentLayout = layoutNodes.find(n => n.id === draft.parentId);
      if (parentLayout) {
        const levelOffset = 160;
        layoutNodes.push({
          ...draft,
          x: parentLayout.x,
          y: parentLayout.y + levelOffset
        });
        layoutLinks.push({ source: draft.parentId, target: draft.id });
      } else if (!draft.parentId) {
        layoutNodes.push(draft);
      }
    });

    const getDescendants = (nodeId, links) => {
      const children = links.filter(l => l.source === nodeId).map(l => l.target);
      const desc = [...children];
      children.forEach(c => desc.push(...getDescendants(c, links)));
      return [...new Set(desc)];
    };

    const spacing = 200;
    const draftLayoutNodes = layoutNodes.filter(n => n.isNew);

    draftLayoutNodes.forEach(draft => {
      const overlaps = layoutNodes.filter(n => 
        !n.isNew && n.id !== draft.id &&
        Math.abs(n.x - draft.x) < spacing - 20 &&
        Math.abs(n.y - draft.y) < 70
      );
      
      if (overlaps.length === 0) return;
      
      const nodesRight = layoutNodes.filter(n => 
        !n.isNew && n.id !== draft.id &&
        Math.abs(n.y - draft.y) < 70 && n.x >= draft.x - 20
      ).sort((a, b) => a.x - b.x);
      
      if (nodesRight.length > 0) {
        const idsToShift = new Set();
        nodesRight.forEach(n => {
          idsToShift.add(n.id);
          getDescendants(n.id, layoutLinks).forEach(d => idsToShift.add(d));
        });
        
        for (let iter = 0; iter < 3; iter++) {
          const shiftedNodes = layoutNodes.filter(n => idsToShift.has(n.id));
          const otherNodes = layoutNodes.filter(n => !idsToShift.has(n.id) && n.id !== draft.id);
          
          let added = false;
          shiftedNodes.forEach(sNode => {
            otherNodes.forEach(oNode => {
              if (Math.abs((sNode.x + spacing) - oNode.x) < spacing - 20 && Math.abs(sNode.y - oNode.y) < 70) {
                if (!idsToShift.has(oNode.id)) {
                  idsToShift.add(oNode.id);
                  getDescendants(oNode.id, layoutLinks).forEach(d => idsToShift.add(d));
                  added = true;
                }
              }
            });
          });
          if (!added) break;
        }
        
        layoutNodes.forEach(n => {
          if (idsToShift.has(n.id)) {
            n.x += spacing;
          }
        });
      }
    });

    setNodes(layoutNodes);
    setLinks(layoutLinks);
  }, [treeData, expandedNodes, highlightedPath, selectedGroupId, draftNodes, groupsPerRow]);
  const getHierarchyPathParts = (option, allOptions) => {
    const pathNames = [];
    let current = allOptions.find(o => o.Id === option.Id);
    const visited = new Set();
    
    while (current && !visited.has(current.Id)) {
      visited.add(current.Id);
      pathNames.push(current.Name);
      current = allOptions.find(o => o.Id === current.ParentId);
    }

    return pathNames.reverse();
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = [];
    options.forEach(o => {
      // if (o.Name?.toLowerCase().includes(val.toLowerCase())) {
      //   let details = '';
      //   if (o.Type === 'Group') details = 'Root Group';
      //   else if (o.Type === 'Department') details = 'Department Level';
      //   else if (o.Type === 'Section') details = 'Section Level';
      //   else if (o.Type === 'Team') details = 'Team Level';
      //   else if (o.Type === 'Category') details = 'Category Configuration Unit';
      //   else if (o.Type === 'Subcategory') details = 'Subcategory Unit';
      //   else if (o.Type === 'User') details = 'Team Assigned Member';
        
      //   filtered.push({ type: o.Type, name: o.Name, details, path: tracePath(o.Id, options) });
      // }
      if (o.Name?.toLowerCase().includes(val.toLowerCase())) {
        const pathParts = getHierarchyPathParts(o, options);

        filtered.push({ 
          type: o.Type, 
          name: o.Name, 
          pathParts: pathParts,
          path: tracePath(o.Id, options) 
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
      items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const selectSearchResult = (result) => {
    setHighlightedPath(result.path);
    setSearchTerm(result.name);
    setSearchResults([]);
    setSearchFocused(false);

    const expandMap = { ...expandedNodes };
    if (result.path.groupId) expandMap[`group-${result.path.groupId}`] = true;
    if (result.path.deptId) expandMap[`dept-${result.path.deptId}`] = true;
    if (result.path.sectionId) expandMap[`sec-${result.path.sectionId}`] = true;
    if (result.path.teamId) expandMap[`team-${result.path.teamId}`] = true;
    if (result.path.categoryId) expandMap[`cat-${result.path.categoryId}`] = true;
    setExpandedNodes(expandMap);

    if (result.path.groupId) {
      setSelectedGroupId(result.path.groupId);
    }

    let targetId = '';
    if (result.type === 'User') targetId = `user-${result.path.userMapId}`;
    else if (result.type === 'Subcategory') targetId = `sub-${result.path.subcategoryId}`;
    else if (result.type === 'Category') targetId = `cat-${result.path.categoryId}`;
    else if (result.type === 'Team') targetId = `team-${result.path.teamId}`;
    else if (result.type === 'Section') targetId = `sec-${result.path.sectionId}`;
    else if (result.type === 'Department') targetId = `dept-${result.path.deptId}`;
    else if (result.type === 'Group') targetId = `group-${result.path.groupId}`;
    
    setNodeToCenter(targetId);
  };

  const centerOnNode = (node) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2 - node.x * zoomScale;
    const centerY = rect.height / 2 - node.y * zoomScale;
    setPanOffset({ x: centerX, y: centerY });
  };

  const getLinkPath = (link) => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);
    if (!sourceNode || !targetNode) return '';
    const sX = sourceNode.x;
    const sY = sourceNode.y + 24;
    const tX = targetNode.x;
    const tY = targetNode.y - 24;
    const midY = (sY + tY) / 2;
    return `M ${sX} ${sY} C ${sX} ${midY}, ${tX} ${midY}, ${tX} ${tY}`;
  };

  const handleDoubleClick = (node) => {
    if (node.type === 'subcategory' || node.type === 'user') return;
    setExpandedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }));
    setTimeout(() => centerOnNode(node), 100);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    if (e.cancelable && e.touches) e.preventDefault();
    if (e.button !== undefined && e.button !== 0) return; 
    setDraggedNodeId(node.id);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setDragOffset({
      x: (clientX / zoomScale) - node.x,
      y: (clientY / zoomScale) - node.y
    });

    const queue = [node.id];
    const descendants = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      const children = links.filter(l => l.source === curr).map(l => l.target);
      descendants.push(...children);
      queue.push(...children);
    }

    const startingPositions = {};
    [node.id, ...descendants].forEach(id => {
      const found = nodes.find(n => n.id === id);
      if (found) {
        startingPositions[id] = { x: found.x, y: found.y };
      }
    });
    dragStartPositions.current = startingPositions;
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button !== undefined && e.button === 2) return; 
    isPanning.current = true;
    setSelectedNodeMenuId(null);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    startPan.current = {
      x: clientX - panOffset.x,
      y: clientY - panOffset.y
    };
  };

  const handleMouseMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (draggedNodeId) {
      const currentMouseX = (clientX / zoomScale);
      const currentMouseY = (clientY / zoomScale);
      const initialNodePos = dragStartPositions.current[draggedNodeId];
      if (!initialNodePos) return;

      const targetX = currentMouseX - dragOffset.x;
      const targetY = currentMouseY - dragOffset.y;
      const dx = targetX - initialNodePos.x;
      const dy = targetY - initialNodePos.y;

      setNodes(prev => {
        let updatedNodes = prev.map(n => {
          if (dragStartPositions.current[n.id]) {
            return {
              ...n,
              x: dragStartPositions.current[n.id].x + dx,
              y: dragStartPositions.current[n.id].y + dy
            };
          }
          return { ...n };
        });

        const MIN_DIST_X = 200;
        const MIN_DIST_Y = 70;
        for (let iter = 0; iter < 4; iter++) {
          for (let i = 0; i < updatedNodes.length; i++) {
            for (let j = i + 1; j < updatedNodes.length; j++) {
              let n1 = updatedNodes[i];
              let n2 = updatedNodes[j];
              const diffX = n1.x - n2.x;
              const diffY = n1.y - n2.y;
              const absX = Math.abs(diffX);
              const absY = Math.abs(diffY);

              if (absX < MIN_DIST_X && absY < MIN_DIST_Y) {
                const overlapX = MIN_DIST_X - absX;
                const overlapY = MIN_DIST_Y - absY;
                const n1Dragged = dragStartPositions.current[n1.id];
                const n2Dragged = dragStartPositions.current[n2.id];

                if (overlapX < overlapY) {
                  const pushX = overlapX / 2 + 1;
                  const signX = diffX >= 0 ? 1 : -1;
                  if (n1Dragged && !n2Dragged) {
                    n2.x -= signX * (overlapX + 1);
                  } else if (!n1Dragged && n2Dragged) {
                    n1.x += signX * (overlapX + 1);
                  } else if (!n1Dragged && !n2Dragged) {
                    n1.x += signX * pushX;
                    n2.x -= signX * pushX;
                  }
                } else {
                  const pushY = overlapY / 2 + 1;
                  const signY = diffY >= 0 ? 1 : -1;
                  if (n1Dragged && !n2Dragged) {
                    n2.y -= signY * (overlapY + 1);
                  } else if (!n1Dragged && n2Dragged) {
                    n1.y += signY * (overlapY + 1);
                  } else if (!n1Dragged && !n2Dragged) {
                    n1.y += signY * pushY;
                    n2.y -= signY * pushY;
                  }
                }
              }
            }
          }
        }
        return updatedNodes;
      });
    } else if (isPanning.current) {
      setPanOffset({
        x: clientX - startPan.current.x,
        y: clientY - startPan.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    isPanning.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    const mouseX = e.clientX - svgRef.current.getBoundingClientRect().left;
    const mouseY = e.clientY - svgRef.current.getBoundingClientRect().top;

    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);

    const newScale = Math.min(Math.max(zoomScale * zoomFactor, 0.35), 2.0);

    setPanOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / zoomScale),
      y: mouseY - (mouseY - prev.y) * (newScale / zoomScale)
    }));
    setZoomScale(newScale);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else {
      if (e.cancelable) e.preventDefault();
      handleCanvasMouseDown(e);
      const touch = e.touches[0];
      longPressTimer.current = setTimeout(() => {
        triggerContextMenu(touch.clientX, touch.clientY);
      }, 700);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist / touchStartDist.current;
      setZoomScale(prev => Math.min(Math.max(prev * (diff > 1 ? 1.03 : 0.97), 0.35), 1.8));
      touchStartDist.current = dist;
    } else {
      clearTimeout(longPressTimer.current);
      if (e.cancelable) e.preventDefault();
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    handleMouseUp();
    touchStartDist.current = null;
  };

  const triggerContextMenu = (x, y) => {
    setContextMenu({ x, y });
  };

  const handleContextMenuAction = (e) => {
    e.preventDefault();
    triggerContextMenu(e.clientX, e.clientY);
  };

  const handleCreateNodeInline = (parent) => {
    // const childTypeMap = {
    //   group: 'dept',
    //   dept: 'sec',
    //   sec: 'team',
    //   team: 'cat-usr',
    //   category: 'sub'
    // };
    const childTypeMap = {
      group: 'dept',
      dept: 'section',       
      section: 'team',       
      team: 'cat-usr',
      category: 'subcategory'
    };
    const cType = childTypeMap[parent.type];
    if (cType === 'cat-usr') {
      setActiveModalNode(parent);
      setModalType('assign-team');
      return;
    }
    const siblings = nodes.filter(n => n.parentId === parent.id);
    let newX = parent.x;
    if (siblings.length > 0) {
      const maxSiblingX = Math.max(...siblings.map(s => s.x));
      newX = maxSiblingX + 220; 
    } else {
      newX = parent.x; 
    }
    const tempId = `temp-${Date.now()}`;
    const levelYGap = 160;
    const childNode = {
      id: tempId,
      label: "",
      // type: cType === 'dept' ? 'dept' : cType === 'sec' ? 'section' : cType === 'team' ? 'team' : 'subcategory',
      type: cType,
      rawId: 0,
      parentId: parent.id,
      // x: parent.x,
      x: newX,
      y: parent.y + levelYGap,
      countText: "Drafting...",
      isExpanded: false,
      isNew: true
    };

    setDraftNodes(prev => [...prev, childNode]);
    setExpandedNodes(prev => ({ ...prev, [parent.id]: true }));
    setInlineEditingNodeId(tempId);
    setInlineEditValue("");
    setInlineHoursValue("");
    setNodeToCenter(tempId);
  };

  const handleSaveInline = async (node) => {
    if (!inlineEditValue.trim()) {
      handleCancelInline(node);
      return;
    }

    let typeStr = "";
    let parentId = 0;
    if (node.id === "new-root-group") {
      typeStr = "Group";
    } else {
      const parentNode = nodes.find(n => n.id === node.parentId);
      parentId = parentNode ? Number(parentNode.rawId) : 0;
      if (node.type === 'dept') typeStr = "Department";
      else if (node.type === 'section') typeStr = "Section";
      else if (node.type === 'team') typeStr = "Team";
      else if (node.type === 'subcategory') typeStr = "Subcategory";
    }

    const payload = {
      command: "CREATE",
      type: typeStr,
      parentId: parentId,
      name: inlineEditValue,
      hours: parseFloat(inlineHoursValue) || 0
    };

    const res = await triggerPostAction(payload);
    if (res.success) {
      setDraftNodes(prev => prev.filter(d => d.id !== node.id));
      setInlineEditingNodeId(null);
    } else {
      setDraftNodes(prev => prev.filter(d => d.id !== node.id));
      setInlineEditingNodeId(null);
    }
  };

  const handleEditInit = (node) => {
    if (node.type === 'user') {
      setActiveModalNode(node);
      const usrObj = userCatalog.find(u => String(u.id) === String(node.rawId)) || {};
      // setUserForm({ userId: String(node.rawId), shiftId: String(usrObj.shiftId || ""), designation: usrObj.designation || "" });
      const row = treeData.find(r => String(r.MapId) === String(node.rawId));
      const u = userCatalog.find(u => String(u.id) === String(row?.UserId)) || {};
      const shiftId = String(row?.ShiftName ? (shiftCatalog.find(s => s.name === row.ShiftName)?.id || "") : (usrObj.shiftId || ""));
      setUserForm({ userId: String(row?.UserId || ""), shiftId: shiftId, designation: row?.Designation || u.designation || "" });
      setModalType('update-user');
      return;
    }
    setInlineEditingNodeId(node.id);
    setInlineEditValue(node.label);
    if (node.type === 'subcategory') {
      setInlineHoursValue(node.countText?.replace(" Hrs", "") || "");
    }
  };

  const handleUpdateInlineSave = async (node) => {
    let typeStr = "";
    if (node.type === 'group') typeStr = "Group";
    else if (node.type === 'dept') typeStr = "Department";
    else if (node.type === 'section') typeStr = "Section";
    else if (node.type === 'team') typeStr = "Team";
    else if (node.type === 'category') typeStr = "Category";
    else if (node.type === 'subcategory') typeStr = "Subcategory";

    const payload = {
      command: "UPDATE",
      type: typeStr,
      targetId: parseInt(node.rawId),
      name: inlineEditValue,
      hours: parseFloat(inlineHoursValue) || 0
    };

    const res = await triggerPostAction(payload);
    if (res.success) {
      setInlineEditingNodeId(null);
    }
  };

  const handleCancelInline = (node) => {
    setDraftNodes(prev => prev.filter(d => d.id !== node.id));
    setInlineEditingNodeId(null);
  };

  const handleDeleteNode = async (node) => {
    // const confirmDelete = window.confirm(`Are you sure you want to delete this ${node.type === 'dept' ? 'department' : node.type}?`);
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${node.type === 'dept' ? 'Department' : node.type.toUpperCase()}?\n\nName: ${node.label || "(Empty)"}${node.countText ? `\nDetails: ${node.countText}` : ""}`);
    if (!confirmDelete) return;
    let typeStr = "";
    if (node.type === 'group') typeStr = "Group";
    else if (node.type === 'dept') typeStr = "Department";
    else if (node.type === 'section') typeStr = "Section";
    else if (node.type === 'team') typeStr = "Team";
    else if (node.type === 'category') typeStr = "Category";
    else if (node.type === 'subcategory') typeStr = "Subcategory";
    else if (node.type === 'user') typeStr = "User";

    const payload = {
      command: "DELETE",
      type: typeStr,
      targetId: parseInt(node.rawId)
    };

    await triggerPostAction(payload);
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalNode) return;
    setSubmitState('loading');

    if (activeTab === "user") {
      const parentTeam = activeModalNode; 
      const { depts, sections, teams } = transformTreeFromFlatData();
      const parentTeamData = teams.find(t => t.Id === parentTeam.rawId);
      const parentSecData = parentTeamData ? sections.find(s => s.Id === parentTeamData.SectionId) : null;
      const parentDeptData = parentSecData ? depts.find(d => d.Id === parentSecData.DeptId) : null;

      const payload = {
        command: "CREATE",
        type: "User",
        userId: parseInt(userForm.userId),
        shiftId: parseInt(userForm.shiftId),
        groupId: parentDeptData ? Number(parentDeptData.GroupId) : 0,
        deptId: parentDeptData ? Number(parentDeptData.Id) : 0,
        sectionId: parentSecData ? Number(parentSecData.Id) : 0,
        teamId: Number(parentTeam.rawId)
      };

      const res = await triggerPostAction(payload);
      if (res.success) {
        setSubmitState('success');
        setTimeout(() => {
          setSubmitState('idle');
          setModalType(null);
          setUserForm({ userId: "", shiftId: "", designation: "" });
        }, 3000);
      } else {
        setSubmitState('error');
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } else {
      const payload = {
        command: "CREATE",
        type: "Category",
        parentId: Number(activeModalNode.rawId),
        name: categoryForm.name
      };

      const res = await triggerPostAction(payload);
      if (res.success) {
        setSubmitState('success');
        setTimeout(() => {
          setSubmitState('idle');
          setModalType(null);
          setCategoryForm({ name: "" });
        }, 3000);
      } else {
        setSubmitState('error');
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    }
  };

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalNode) return;
    setSubmitState('loading');

    const payload = {
      command: "UPDATE",
      type: "User",
      targetId: parseInt(activeModalNode.rawId), 
      shiftId: parseInt(userForm.shiftId)
    };

    const res = await triggerPostAction(payload);
    if (res.success) {
      setSubmitState('success');
      setTimeout(() => {
        setSubmitState('idle');
        setModalType(null);
        setUserForm({ userId: "", shiftId: "", designation: "" });
      }, 3000);
    } else {
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const resetView = () => {
    setZoomScale(0.85);
    setExpandedNodes({});
    setSelectedGroupId(null);
    setHighlightedPath(null);
    setSearchTerm('');
    setPanOffset({ x: typeof window !== 'undefined' && window.innerWidth > 768 ? window.innerWidth / 2.5 : typeof window !== 'undefined' ? window.innerWidth / 2 : 200, y: 150 });
    fetchTreeAndTables();
  };

  const handleSelectedUserChange = (val) => {
    const selected = userCatalog.find(u => String(u.id) === val);
    setUserForm(prev => ({
      ...prev,
      userId: val,
      designation: selected ? selected.designation : ""
    }));
  };

  const nodeTypeStyles = {
    group: { dark: { fill: 'rgba(234, 90, 12, 0.42)', stroke: '#ea580c' }, light: { fill: 'rgba(246, 92, 9, 0.1)', stroke: '#c2410c' } },
    dept: { dark: { fill: 'rgba(78, 70, 229, 0.46)', stroke: '#4f46e5' }, light: { fill: 'rgba(79, 70, 229, 0.1)', stroke: '#4338ca' } },
    section: { dark: { fill: 'rgba(5, 150, 104, 0.36)', stroke: '#059669' }, light: { fill: 'rgba(5, 150, 105, 0.1)', stroke: '#047857' } },
    team: { dark: { fill: 'rgba(138, 92, 246, 0.4)', stroke: '#8b5cf6' }, light: { fill: 'rgba(139, 92, 246, 0.1)', stroke: '#7c3aed' } },
    category: { dark: { fill: 'rgba(13, 148, 137, 0.41)', stroke: '#0d9488' }, light: { fill: 'rgba(13, 148, 136, 0.1)', stroke: '#0f766e' } },
    subcategory: { dark: { fill: 'rgba(2, 133, 199, 0.4)', stroke: '#0284c7' }, light: { fill: 'rgba(2, 132, 199, 0.1)', stroke: '#0369a1' } },
    user: { dark: { fill: 'rgba(219, 39, 120, 0.35)', stroke: '#db2777' }, light: { fill: 'rgba(219, 39, 119, 0.1)', stroke: '#be185d' } },
  };

  const mainText = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const mutedText = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)';

  const userComboboxOptions = userCatalog.map(u => ({ value: String(u.id), label: `${u.employeeId} | ${u.username}` }));
  const shiftComboboxOptions = shiftCatalog.map(s => ({ value: String(s.id), label: s.name }));
  const getPlaceholderText = (node) => {
    if (node.id === "new-root-group" || node.type === 'group') return "Enter Group Name...";
    if (node.type === 'dept') return "Enter Department Name...";
    if (node.type === 'section') return "Enter Section Name...";
    if (node.type === 'team') return "Enter Team Name...";
    if (node.type === 'category') return "Enter Category Name...";
    if (node.type === 'subcategory') return "Enter Subcategory Name...";
    return "Enter Name...";
  };
  return (
    <div 
      className={isFullscreen ? "fixed inset-0 z-[99999] w-screen h-screen flex flex-col font-sans transition-colors duration-300 bg-card" : "h-screen w-full flex flex-col font-sans overflow-hidden transition-colors duration-300 rounded-xl"}
    >
      
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{
        backgroundImage: `radial-gradient(${gridColor} 0.8px, transparent 0.8px)`,
        backgroundSize: '24px 24px'
      }} />

      <div className="p-3 md:p-4 backdrop-blur-md border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3 z-10 w-full border-b border-primary/10">
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
          <Info className="w-4 h-4 shrink-0 animate-pulse" style={{ color: 'var(--primary, #6366f1)' }} />
          <span className="text-[11px] font-medium tracking-wide truncate" style={{ color: mutedText }}>
            Double-click to expand. Right Click: Add Group. Drag to pan. Context menu: Add Group.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--primary, #6366f1)' }} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search hierarchy..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full bg-transparent pl-8 pr-4 py-1.5 rounded-lg focus:outline-none transition-colors text-xs border border-primary/30"
                style={{ 
                  color: mainText
                }}
              />
            </div>

            {searchFocused && searchResults.length > 0 && (
              <div 
                ref={listContainerRef}
                className="absolute top-10 left-0 w-full rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto p-1 space-y-0.5 backdrop-blur-lg bg-card border border-primary/20"
                // style={{ 
                //   backgroundColor: theme === 'dark' ? '#0b0f19' : '#ffffff', 
                //   border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)'}` 
                // }}
              >
                {searchResults.map((res, index) => (
                  <button
                    key={index}
                    onMouseDown={() => selectSearchResult(res)}
                    className="w-full text-left p-1.5 rounded text-xs transition flex flex-col cursor-pointer"
                    style={{
                      backgroundColor: index === searchIndex ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      color: index === searchIndex ? mainText : mutedText
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index === searchIndex ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-[10px] truncate max-w-[150px]" style={{ color: index === searchIndex ? mainText : theme === 'dark' ? '#e2e8f0' : '#334155' }}>{res.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded font-black uppercase" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary, #6366f1)' }}>{res.type}</span>
                    </div>
                    {res.pathParts && (
                      <div className="text-[8px] mt-1 opacity-75 block text-left whitespace-normal">
                        {res.pathParts.map((part, pIdx) => (
                          <span key={pIdx} className="inline-block whitespace-nowrap">
                            {pIdx > 0 && " ➔\u00A0"}
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setZoomScale(p => Math.min(p + 0.1, 1.8))} 
              className="p-1.5 rounded transition cursor-pointer hover:bg-opacity-80 border border-primary/30 rounded-xl"
              // style={{ backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)', border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)'}` }}
            >
              <ZoomIn className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} />
            </button>
            <button 
              onClick={() => setZoomScale(p => Math.max(p - 0.1, 0.4))} 
              className="p-1.5 rounded transition cursor-pointer hover:bg-opacity-80 border border-primary/30 rounded-xl"
              // style={{ backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)', border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)'}` }}
            >
              <ZoomOut className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} />
            </button>
            <button 
              onClick={resetView} 
              className="p-1.5 rounded transition flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:bg-opacity-80 border border-primary/30 rounded-xl"
              // style={{ backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)', border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)'}` }}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" style={{ color: 'var(--primary, #6366f1)' }} />
              <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--primary, #6366f1)' }}>Reset</span>
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded transition cursor-pointer hover:bg-opacity-80 border border-primary/30 rounded-xl"
              // style={{ backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)', border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)'}` }}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} /> : <Maximize2 className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} />}
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="border-b px-4 py-3 text-xs font-semibold flex justify-between items-center z-10 backdrop-blur-md animate-bounce" style={{ backgroundColor: theme === 'dark' ? '#0b0f19' : '#ffffff', borderColor: theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)', color: '#ef4444' }}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" style={{ color: '#ef4444' }} />
            <span className="uppercase tracking-wider">Action Failed: {apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="transition p-1" style={{ color: '#ef4444' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div 
        ref={svgRef}
        className="flex-1 w-full relative overflow-hidden bg-transparent"
        style={{ touchAction: 'none' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={handleContextMenuAction}
      >
        <svg 
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: '0 0',
            overflow: 'visible',
            touchAction: 'none',
            transition: draggedNodeId ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          <g>
            {links.map((link, idx) => {
              const targetNode = nodes.find(n => n.id === link.target);
              const isHighlighted = highlightedPath && (
                (targetNode?.type === 'group' && targetNode.rawId === highlightedPath.groupId) ||
                (targetNode?.type === 'dept' && targetNode.rawId === highlightedPath.deptId) ||
                (targetNode?.type === 'section' && targetNode.rawId === highlightedPath.sectionId) ||
                (targetNode?.type === 'team' && targetNode.rawId === highlightedPath.teamId) ||
                (targetNode?.type === 'category' && targetNode.rawId === highlightedPath.categoryId) ||
                (targetNode?.type === 'subcategory' && targetNode.rawId === highlightedPath.subcategoryId) ||
                (targetNode?.type === 'user' && targetNode.rawId === highlightedPath.userMapId)
              );

              return (
                <path
                  key={idx}
                  d={getLinkPath(link)}
                  fill="none"
                  // stroke={isHighlighted ? 'var(--primary, #6366f1)' : theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.25)'}
                  // strokeWidth={isHighlighted ? 3 : 1.5}
                  stroke={isHighlighted ? 'var(--primary, #6366f1)' : 'var(--primary, #6366f1)'}
                  strokeOpacity={isHighlighted ? 1 : 0.4}
                  strokeWidth={isHighlighted ? 3 : 2}
                  // style={{ transition: 'all 0.3s ease' }}
                  style={{ transition: draggedNodeId ? 'none' : 'all 0.2s ease' }}
                />
              );
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const isHighPath = highlightedPath && (
                (node.type === 'group' && node.rawId === highlightedPath.groupId) ||
                (node.type === 'dept' && node.rawId === highlightedPath.deptId) ||
                (node.type === 'section' && node.rawId === highlightedPath.sectionId) ||
                (node.type === 'team' && node.rawId === highlightedPath.teamId) ||
                (node.type === 'category' && node.rawId === highlightedPath.categoryId) ||
                (node.type === 'subcategory' && node.rawId === highlightedPath.subcategoryId) ||
                (node.type === 'user' && node.rawId === highlightedPath.userMapId)
              );

              const style = nodeTypeStyles[node.type]?.[theme] || nodeTypeStyles.group.dark;
              const isEditing = inlineEditingNodeId === node.id;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="group cursor-pointer"
                  onDoubleClick={() => handleDoubleClick(node)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onTouchStart={(e) => handleNodeMouseDown(e, node)}
                  // onMouseEnter={() => setHoveredNodeId(node.id)}
                  // onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeMenuId(prev => prev === node.id ? null : node.id);
                  }}
                  // style={{ transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  style={{ transition: draggedNodeId ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                  <rect
                    x={-90}
                    // y={-24}
                    y={isEditing && node.type === 'subcategory' ? -42 : -24}
                    width={180}
                    // height={48}
                    height={isEditing && node.type === 'subcategory' ? 84 : 48}
                    rx={12}
                    fill={style.fill}
                    stroke={isEditing ? style.stroke : isHighPath ? style.stroke : style.stroke + (theme === 'dark' ? '40' : '60')}
                    strokeWidth={isEditing ? 2 : isHighPath ? 2.5 : 1}
                    style={{ transition: 'all 0.3s ease' }}
                  />

                  {isEditing ? (
                    // <foreignObject x={-80} y={-18} width={160} height={36}>
                    <foreignObject 
                      x={-80} 
                      y={node.type === 'subcategory' ? -36 : -18} 
                      width={160} 
                      height={node.type === 'subcategory' ? 72 : 36}
                    >
                      <div className="flex flex-col gap-1 items-center justify-center h-full w-full">
                        <input
                          type="text"
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (node.isNew) handleSaveInline(node);
                              else handleUpdateInlineSave(node);
                            }
                          }}
                          autoFocus
                          placeholder={getPlaceholderText(node)}
                          className="w-full text-[11px] font-semibold border rounded px-2 py-1.5 focus:outline-none bg-transparent"
                          style={{ 
                            color: mainText, 
                            borderColor: 'rgba(99, 102, 241, 0.3)'
                          }}
                        />
                        {node.type === 'subcategory' && (
                          <input
                            type="number"
                            step="0.1"
                            value={inlineHoursValue}
                            onChange={(e) => setInlineHoursValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (node.isNew) handleSaveInline(node);
                                else handleUpdateInlineSave(node);
                              }
                            }}
                            placeholder="Standard Hours (e.g. 8)"
                            className="w-full text-[10px] font-medium border rounded px-2 py-1 focus:outline-none bg-transparent"
                            style={{ 
                              color: mainText, 
                              borderColor: 'rgba(99, 102, 241, 0.3)'
                            }}
                          />
                        )}
                      </div>
                    </foreignObject>
                  ) : (
                    <>
                      <text
                        textAnchor="middle"
                        className="text-[11px] font-bold pointer-events-none select-none font-sans transition-colors"
                        fill={mainText}
                        y={-2}
                      >
                        {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label || "(Empty)"}
                      </text>
                      {node.countText && (
                        <text
                          textAnchor="middle"
                          className="text-[9px] font-medium pointer-events-none select-none font-sans transition-colors"
                          fill={mutedText}
                          y={11}
                        >
                          {node.countText}
                        </text>
                      )}
                    </>
                  )}

                  {/* {canViewHoverActions && hoveredNodeId === node.id && !isEditing && !node.isNew && ( */}
                  {canViewHoverActions && selectedNodeMenuId === node.id && !isEditing && !node.isNew && (
                    <foreignObject x={-60} y={-65} width={120} height={40}>
                      <div 
                        className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 border shadow-xl mx-auto w-fit"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                          animation: 'fadeIn 0.2s ease-out'
                        }}
                      >
                        {canEditNode && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditInit(node); }} 
                            className="p-1 transition-colors hover:text-blue-500 cursor-pointer"
                            style={{ color: mutedText }}
                          >
                            <Pencil size={14} />
                          </button>
                          )}
                        {canAddNode && node.type !== 'subcategory' && node.type !== 'user' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCreateNodeInline(node); }} 
                            className="p-1 transition-colors hover:text-green-500 cursor-pointer"
                            style={{ color: mutedText }}
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {canDeleteNode && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node); }} 
                            className="p-1 transition-colors hover:text-red-500 cursor-pointer"
                            style={{ color: mutedText }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </foreignObject>
                  )}

                  {isEditing && (
                    // <foreignObject x={-40} y={30} width={80} height={40}>
                    <foreignObject x={-40} y={node.type === 'subcategory' ? 48 : 30} width={80} height={40}>
                      <div 
                        className="flex items-center justify-center gap-2 rounded-full px-2 py-1 border shadow-xl mx-auto w-fit"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                          animation: 'fadeIn 0.2s ease-out'
                        }}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (node.isNew) handleSaveInline(node); else handleUpdateInlineSave(node); }} 
                          className="p-1 transition-colors hover:text-green-500 cursor-pointer"
                          style={{ color: mutedText }}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancelInline(node); }} 
                          className="p-1 transition-colors hover:text-red-500 cursor-pointer"
                          style={{ color: mutedText }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* {canModifyHierarchy && contextMenu && ( */}
        {canRightClickCreate && contextMenu && (
          <div 
            className="absolute rounded-lg p-1.5 shadow-2xl z-50 w-44"
            style={{ 
              top: contextMenu.y - svgRef.current.getBoundingClientRect().top, 
              left: contextMenu.x - svgRef.current.getBoundingClientRect().left,
              backgroundColor: theme === 'dark' ? '#0a0e17' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.25)'}`,
              color: 'var(--primary, #6366f1)'
            }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button 
              onClick={() => { triggerCreateRootGroup(); setContextMenu(null); }}
              className="w-full text-left p-1.5 hover:bg-opacity-10 text-xs font-semibold flex items-center gap-2 cursor-pointer rounded transition-colors"
              style={{ color: 'var(--primary, #6366f1)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Group</span>
            </button>
            <button 
              onClick={() => setContextMenu(null)}
              className="w-full text-left p-1.5 text-xs rounded font-medium flex items-center gap-2 cursor-pointer border-t mt-1 transition-colors"
              style={{ color: mutedText, borderColor: theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)' }}
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        )}
      </div>

      {modalType === 'assign-team' && activeModalNode && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="rounded-xl p-5 w-full max-w-sm shadow-2xl relative bg-card border border-primary/50">
            <button 
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-1 rounded-lg transition"
              style={{ color: 'var(--primary, #6366f1)' }}
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: mainText }}>
              <Plus className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} />
              <span>Assign: {activeModalNode.label}</span>
            </h3>

            <div className="flex border-b mb-4" style={{ borderColor: theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)' }}>
              <button
                type="button"
                onClick={() => setActiveTab("user")}
                className="flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition"
                style={{
                  borderBottom: activeTab === "user" ? '2px solid var(--primary, #6366f1)' : 'none',
                  color: activeTab === "user" ? 'var(--primary, #6366f1)' : mutedText
                }}
              >
                Assign User
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("category")}
                className="flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition"
                style={{
                  borderBottom: activeTab === "category" ? '2px solid var(--primary, #6366f1)' : 'none',
                  color: activeTab === "category" ? 'var(--primary, #6366f1)' : mutedText
                }}
              >
                Create Category
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="space-y-4">
              {activeTab === "user" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary, #6366f1)' }}>Select Member</label>
                    <CustomCombobox 
                      options={userComboboxOptions} 
                      value={userForm.userId} 
                      onChange={handleSelectedUserChange} 
                      placeholder="-- Select --" 
                      theme={theme} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary, #6366f1)' }}>Designation</label>
                    <input
                      type="text"
                      disabled
                      value={userForm.designation || ""}
                      className="w-full text-xs rounded p-2 focus:outline-none"
                      style={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(7, 9, 14, 0.6)' : '#f1f5f9', 
                        border: `1px solid ${theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)'}`,
                        color: mutedText
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary, #6366f1)' }}>Shift</label>
                    <CustomCombobox 
                      options={shiftComboboxOptions} 
                      value={userForm.shiftId} 
                      onChange={(val) => setUserForm(prev => ({ ...prev, shiftId: val }))} 
                      placeholder="-- Select --" 
                      theme={theme} 
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary, #6366f1)' }}>Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter category description..."
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ name: e.target.value })}
                    className="w-full text-xs rounded p-2 focus:outline-none bg-transparent border border-primary/30"
                  />
                </div>
              )}

              <SubmitButton state={submitState} defaultText="Save" />
            </form>
          </div>
        </div>
      )}

      {modalType === 'update-user' && activeModalNode && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4" >
          <div className="rounded-xl p-5 w-full max-w-sm shadow-2xl relative bg-card border border-primary/50" >
            <button 
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-1 rounded-lg"
              style={{ color: 'var(--primary, #6366f1)' }}
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: mainText }}>
              <Pencil className="w-4 h-4" style={{ color: 'var(--primary, #6366f1)' }} />
              <span>Update User: {activeModalNode.label}</span>
            </h3>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary, #6366f1)' }}>Assigned Shift</label>
                <CustomCombobox 
                  options={shiftComboboxOptions} 
                  value={userForm.shiftId} 
                  onChange={(val) => setUserForm(prev => ({ ...prev, shiftId: val }))} 
                  placeholder="-- Select Shift --" 
                  theme={theme} 
                />
              </div>

              <SubmitButton state={submitState} defaultText="Commit Update" />
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}