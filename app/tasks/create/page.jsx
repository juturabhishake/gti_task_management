"use client";

import React, { useState, useEffect } from 'react';
import { 
  Check, X, AlertCircle, Loader2, Calendar, Folder, Clock, Layers, ChevronDown, CheckSquare, ArrowRight
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2040;
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
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-xl p-3.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-12 cursor-pointer shadow-sm transition hover:border-primary/40">
            <span className="truncate font-semibold text-xs text-muted-foreground">
              {selectedItem ? selectedItem.name : placeholder}
            </span>
            <ChevronDown className="w-5 h-5 ml-2 shrink-0 opacity-60 text-primary" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content 
            className="z-[9999] bg-card border border-primary/20 rounded-xl shadow-2xl p-3 w-[var(--radix-popover-trigger-width)] max-w-[95vw] md:max-w-2xl" 
            sideOffset={5} 
            align="start"
          >
            <input 
              type="text" 
              placeholder="Search by category, team, section..."
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
                          <span className="text-[9px] text-muted-foreground mt-0.5科学 whitespace-normal opacity-85 leading-relaxed">
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
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

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

export default function CreateTaskFormPage() {
  const { isLoading: isAccessLoading, hasAccess, accessLevel } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const canModify = isAdmin;
  const level = Number(accessLevel || 0);
  const canCreate = level > 1;
  const [categoryCatalog, setCategoryCatalog] = useState([]);
  const [submitState, setSubmitState] = useState('idle');
  const [feedback, setFeedback] = useState(null);

  const [formState, setFormState] = useState({
    name: '',
    project: '',
    categoryId: '',
    maxHours: '',
    mediumHours: '',
    minHours: ''
  });

  useEffect(() => {
    fetchCategoryCatalog();
  }, []);

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

  const handleResetForm = () => {
    setFormState({
      name: '',
      project: '',
      categoryId: '',
      maxHours: '',
      mediumHours: '',
      minHours: ''
    });
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.project || !formState.categoryId || !formState.maxHours || !formState.mediumHours || !formState.minHours) {
      setFeedback({ type: 'error', text: 'All form configuration fields are required' });
      return;
    }

    setSubmitState('loading');
    setFeedback(null);

    try {
      const res = await fetch('/api/directory', {
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

      const result = await res.json();
      if (res.ok && result.message === 'Success') {
        setSubmitState('success');
        setFeedback({ type: 'success', text: 'Task parameters configured and saved successfully' });
        setTimeout(() => {
          setSubmitState('idle');
          handleResetForm();
        }, 2000);
      } else {
        setSubmitState('error');
        setFeedback({ type: 'error', text: result.message || 'Failed to submit task parameters' });
        setTimeout(() => setSubmitState('idle'), 3000);
      }
    } catch (err) {
      setSubmitState('error');
      setFeedback({ type: 'error', text: 'Network connection failure' });
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex p-1 justify-center items-start">
      <div className="w-full bg-card border border-primary/10 rounded-xl shadow-2xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        <div className="border-b border-primary/10 pb-5 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Folder className="w-6 h-6 text-primary" />
            <span>Create New Task</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure subcategory attributes, map structural categories, and establish standard baseline hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Task</label>
              <input
                type="text"
                required
                placeholder="Enter Task"
                value={formState.name}
                onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
                className="w-full text-xs rounded-xl p-3.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold placeholder:text-muted-foreground/60 transition focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Project Name</label>
              <input
                type="text"
                required
                placeholder="Enter parent project..."
                value={formState.project}
                onChange={e => setFormState(p => ({ ...p, project: e.target.value }))}
                className="w-full text-xs rounded-xl p-3.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold placeholder:text-muted-foreground/60 transition focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Assigned Category Location</label>
            <CustomCategorySelector
              data={categoryCatalog}
              selectedValue={formState.categoryId}
              onSelect={val => setFormState(p => ({ ...p, categoryId: val }))}
              placeholder="-- Search and Select Target Category --"
            />
          </div>

          <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl space-y-4">
            <div className="flex items-center gap-1.5 border-b border-primary/10 pb-2">
              <Clock className="w-4 h-4 text-primary animate-pulse" />
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-primary">Severity Classification Metrics</label>
            </div>
            
            <div className="grid lg:grid-cols-3 sm:grid-cols-1 gap-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-primary">Min Hours</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.0"
                  value={formState.minHours}
                  onChange={e => setFormState(p => ({ ...p, minHours: e.target.value }))}
                  className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-primary">Medium Hours</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.0"
                  value={formState.mediumHours}
                  onChange={e => setFormState(p => ({ ...p, mediumHours: e.target.value }))}
                  className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-primary">Max Hours</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.0"
                  value={formState.maxHours}
                  onChange={e => setFormState(p => ({ ...p, maxHours: e.target.value }))}
                  className="w-full text-xs rounded-xl p-3 focus:outline-none bg-background border border-primary/20 text-foreground font-bold placeholder:text-muted-foreground/60 transition focus:border-primary"
                />
              </div>
            </div>
          </div>

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
              className="flex-1 py-3.5 text-xs font-bold uppercase rounded-xl border border-primary/20 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition cursor-pointer"
            >
              Clear Form
            </button>
            
            <button
              type="submit"
              disabled={submitState !== 'idle'}
              className="flex-1 py-3.5 text-xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-xl"
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
                {submitState === 'loading' ? 'Saving Task...' : submitState === 'success' ? 'Success' : submitState === 'error' ? 'Failed' : 'Save Task'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}