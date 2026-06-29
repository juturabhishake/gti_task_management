"use client";
import React, { useState } from 'react';
import { Plus, Check, Loader2, AlertCircle, ChevronDown, CheckSquare } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
export default function HierarchyCards({ 
  options = [], 
  onSaveSuccess, 
  autoSelections, 
  setAutoSelections 
}) {
  const [loading, setLoading] = useState({ group: false, dept: false, section: false, team: false });
  const [feedback, setFeedback] = useState({ group: null, dept: null, section: null, team: null });
  const [names, setNames] = useState({ group: '', dept: '', section: '', team: '' });

  const groups = options.filter(o => o.Type === 'Group' || o.type === 'Group') || [];
  const depts = options.filter(o => o.Type === 'Department' || o.type === 'Department') || [];
  const sections = options.filter(o => o.Type === 'Section' || o.type === 'Section') || [];

  const triggerFeedback = (card, type, text) => {
    setFeedback(prev => ({ ...prev, [card]: { type, text } }));
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, [card]: null }));
    }, 4000);
  };

  const handleCreate = async (cardType, body) => {
    setLoading(prev => ({ ...prev, [cardType]: true }));
    try {
      const response = await fetch('/api/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (response.ok && result.message === 'Success') {
        triggerFeedback(cardType, 'success', 'Successfully saved');
        setNames(prev => ({ ...prev, [cardType]: '' }));
        if (cardType === 'group') {
          setAutoSelections(prev => ({ ...prev, deptGroupId: result.id }));
        } else if (cardType === 'dept') {
          setAutoSelections(prev => ({ ...prev, sectionDeptId: result.id }));
        } else if (cardType === 'section') {
          setAutoSelections(prev => ({ ...prev, teamSectionId: result.id }));
        }
        onSaveSuccess();
      } else {
        triggerFeedback(cardType, 'error', result.message || 'Error occurred');
      }
    } catch (e) {
      triggerFeedback(cardType, 'error', 'Network failure');
    } finally {
      setLoading(prev => ({ ...prev, [cardType]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      <div className="bg-card border border-primary/20 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-foreground">Add Group</h3>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Top level</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Add a top-level group for hierarchy organization.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Group Name</label>
              <input 
                type="text" 
                placeholder="Enter group name" 
                value={names.group}
                onChange={e => setNames(p => ({ ...p, group: e.target.value }))}
                className="w-full text-sm bg-background border border-primary/20 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {feedback.group && (
            <div className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.group.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {feedback.group.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{feedback.group.text}</span>
            </div>
          )}
          <button 
            disabled={loading.group || !names.group.trim()}
            onClick={() => handleCreate('group', { type: 'group', name: names.group })}
            className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            {loading.group ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Group
          </button>
        </div>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-foreground">Add Department</h3>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Under a group</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Add a department under an existing group.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Group Name</label>
              <ComboboxPopover 
                data={groups} 
                fullOptions={options}
                selectedValue={autoSelections.deptGroupId} 
                onSelect={val => setAutoSelections(p => ({ ...p, deptGroupId: val }))} 
                placeholder="Select group"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Department Name</label>
              <input 
                type="text" 
                placeholder="Enter department name" 
                value={names.dept}
                onChange={e => setNames(p => ({ ...p, dept: e.target.value }))}
                className="w-full text-sm bg-background border border-primary/20 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {feedback.dept && (
            <div className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.dept.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {feedback.dept.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{feedback.dept.text}</span>
            </div>
          )}
          <button 
            disabled={loading.dept || !names.dept.trim() || !autoSelections.deptGroupId}
            onClick={() => handleCreate('dept', { type: 'dept', name: names.dept, parentId: autoSelections.deptGroupId })}
            className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            {loading.dept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Department
          </button>
        </div>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-foreground">Add Section</h3>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Under a dept</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Add a section under an existing department.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Department</label>
              <ComboboxPopover 
                data={depts} 
                fullOptions={options}
                selectedValue={autoSelections.sectionDeptId} 
                onSelect={val => setAutoSelections(p => ({ ...p, sectionDeptId: val }))} 
                placeholder="Select department"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Section Name</label>
              <input 
                type="text" 
                placeholder="Enter section name" 
                value={names.section}
                onChange={e => setNames(p => ({ ...p, section: e.target.value }))}
                className="w-full text-sm bg-background border border-primary/20 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {feedback.section && (
            <div className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.section.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {feedback.section.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{feedback.section.text}</span>
            </div>
          )}
          <button 
            disabled={loading.section || !names.section.trim() || !autoSelections.sectionDeptId}
            onClick={() => handleCreate('section', { type: 'section', name: names.section, parentId: autoSelections.sectionDeptId })}
            className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            {loading.section ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Section
          </button>
        </div>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-foreground">Add Team</h3>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Under a section</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Add a team under an existing section.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Section</label>
              <ComboboxPopover 
                data={sections} 
                fullOptions={options}
                selectedValue={autoSelections.teamSectionId} 
                onSelect={val => setAutoSelections(p => ({ ...p, teamSectionId: val }))} 
                placeholder="Select section"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1">Team Name</label>
              <input 
                type="text" 
                placeholder="Enter team name" 
                value={names.team}
                onChange={e => setNames(p => ({ ...p, team: e.target.value }))}
                className="w-full text-sm bg-background border border-primary/20 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {feedback.team && (
            <div className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.team.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {feedback.team.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{feedback.team.text}</span>
            </div>
          )}
          <button 
            disabled={loading.team || !names.team.trim() || !autoSelections.teamSectionId}
            onClick={() => handleCreate('team', { type: 'team', name: names.team, parentId: autoSelections.teamSectionId })}
            className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs cursor-pointer"
          >
            {loading.team ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
}

// function ComboboxPopover({ data = [], selectedValue, onSelect, placeholder }) {
//   const [open, setOpen] = useState(false);
//   const [search, setSearch] = useState('');
  
//   const selectedItem = data.find(item => item.Id === selectedValue || item.id === selectedValue);
//   const filtered = data.filter(item => {
//     const name = item.Name || item.name || '';
//     return name.toLowerCase().includes(search.toLowerCase());
//   });

//   return (
//     <Popover.Root open={open} onOpenChange={setOpen}>
//       <Popover.Trigger asChild>
//         <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-9 cursor-pointer">
//           <span className="truncate">{selectedItem ? (selectedItem.Name || selectedItem.name) : placeholder}</span>
//           <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60" />
//         </button>
//       </Popover.Trigger>
//       <Popover.Portal>
//         <Popover.Content className="z-50 w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
//           <input 
//             type="text" 
//             placeholder="Search..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="w-full text-xs bg-background border border-primary/20 rounded-lg p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
//           />
//           <div className="max-h-48 overflow-y-auto space-y-1">
//             {filtered.length === 0 ? (
//               <p className="text-xs text-center text-muted-foreground py-2">No options found</p>
//             ) : (
//               filtered.map((item, idx) => {
//                 const itemId = item.Id ?? item.id;
//                 const itemName = item.Name ?? item.name;
//                 const isSelected = selectedValue === itemId;
//                 return (
//                   <button
//                     key={idx}
//                     onClick={() => {
//                       onSelect(itemId);
//                       setOpen(false);
//                     }}
//                     className={`w-full text-left text-xs px-2.5 py-2 rounded-md flex items-center justify-between transition cursor-pointer ${isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}`}
//                   >
//                     <span className="truncate">{itemName}</span>
//                     {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
//                   </button>
//                 );
//               })
//             )}
//           </div>
//         </Popover.Content>
//       </Popover.Portal>
//     </Popover.Root>
//   );
// }
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
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const triggerParts = selectedItem ? getHierarchyPathParts(selectedItem, fullOptions) : [];

  return (
    <div className="flex flex-col w-full gap-1.5">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-9 cursor-pointer">
            <span className="truncate font-semibold">
              {selectedItem ? (selectedItem.Name ?? selectedItem.name) : placeholder}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-60" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-50 w-64 bg-card border border-primary/20 rounded-xl shadow-xl p-2" sideOffset={5} align="start">
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
          <span className="text-[8px] uppercase tracking-wider bg-primary text-card px-1.5 py-0.5 rounded-md mr-1 select-none">
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