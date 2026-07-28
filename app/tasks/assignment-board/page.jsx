"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Check, Clock, Layers, Calendar as CalendarIcon, 
  UserPlus, Loader2, AlertCircle, CheckCircle2, ChevronDown, AlignLeft, ArrowRight 
} from 'lucide-react';
import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from "@/lib/utils";

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
            "w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm font-semibold text-left",
            (disabled || loading) && "opacity-60 cursor-not-allowed bg-muted/30"
          )}
        >
          <span className="truncate">
            {loading ? "Loading users..." : selectedItem ? (selectedItem.employeeId ? `${selectedItem.employeeId} - ${selectedItem.username}` : selectedItem.name) : placeholder}
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
            className="w-full text-xs bg-muted/50 border border-border/60 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-3">No users found in this team</p>
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
                      "w-full text-left rounded-lg px-3 py-2.5 flex items-center justify-between transition-colors text-xs cursor-pointer",
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

export default function AssignmentPage() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [submitState, setSubmitState] = useState('idle');
  const [feedback, setFeedback] = useState(null);

  const [formState, setFormState] = useState({
    assignedUserId: '',
    severity: '',
    project: '',
    workDate: '',
    dueDate: '',
    taskDetails: ''
  });

  const fetchUnassignedTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch('/api/tasks/assignment-board?action=unassigned');
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
  }, []);

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.Id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (selectedTask) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const res = await fetch(`/api/tasks/assignment-board?action=usersByTeam&teamId=${selectedTask.TeamId}`);
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
      setFormState({
        assignedUserId: '',
        severity: '',
        project: selectedTask.Project || '',
        workDate: '',
        dueDate: '',
        taskDetails: ''
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

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(t => 
      (t.SubcategoryName || '').toLowerCase().includes(query) ||
      (t.GroupName || '').toLowerCase().includes(query) ||
      (t.DeptName || '').toLowerCase().includes(query) ||
      (t.SectionName || '').toLowerCase().includes(query) ||
      (t.TeamName || '').toLowerCase().includes(query) ||
      (t.Project || '').toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

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
    { id: 'Min', label: 'Low', hours: selectedTask.MinHours || 0, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20' },
    { id: 'Medium', label: 'Medium', hours: selectedTask.MediumHours || 0, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20' },
    { id: 'Max', label: 'High', hours: selectedTask.MaxHours || 0, color: 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/20' }
  ] : [];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-background text-foreground flex flex-col p-4 md:p-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-primary" />
            Task Assignment Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Select a pending task to configure and assign to team members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        <div className="lg:col-span-4 flex flex-col space-y-5 bg-card border border-border/60 rounded-3xl p-6 shadow-xl sticky top-6 transition-all">
          <div className="border-b border-border/50 pb-4 mb-2">
            <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2 uppercase tracking-wide">
              <AlignLeft className="w-5 h-5 text-primary" />
              Assignment Parameters
            </h3>
            {!selectedTask && (
              <p className="text-xs text-muted-foreground mt-2 font-medium">Please select a task from the list to configure assignment parameters.</p>
            )}
          </div>

          <div className={cn("space-y-6 transition-opacity duration-300", !selectedTask ? "opacity-40 pointer-events-none select-none filter blur-[1px]" : "opacity-100")}>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
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

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-primary">Task Severity</label>
              <div className="grid grid-cols-3 gap-3">
                {severityOptions.map((sev) => {
                  const isActive = formState.severity === sev.id;
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => handleSeverityChange(sev.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                        sev.color,
                        isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 border-transparent shadow-lg font-black" : "border-dashed"
                      )}
                    >
                      <span className="text-sm">{sev.label}</span>
                      <span className="text-[10px] font-bold mt-1 opacity-80">{sev.hours} Hrs</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary">Project Alignment</label>
              <input 
                type="text"
                placeholder="e.g. Core Infrastructure"
                value={formState.project}
                onChange={e => setFormState(prev => ({ ...prev, project: e.target.value }))}
                className="w-full text-sm bg-muted/30 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" /> Work Date
                </label>
                <input 
                  type="date"
                  value={formState.workDate}
                  onChange={e => setFormState(prev => ({ ...prev, workDate: e.target.value }))}
                  className="w-full text-sm bg-muted/30 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" /> Due Date
                </label>
                <input 
                  type="date"
                  value={formState.dueDate}
                  onChange={e => setFormState(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full text-sm bg-muted/30 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary">Task Detail / Remark</label>
              <textarea 
                rows={4}
                placeholder="Provide comprehensive details or remarks for the assignee..."
                value={formState.taskDetails}
                onChange={e => setFormState(prev => ({ ...prev, taskDetails: e.target.value }))}
                className="w-full text-sm bg-muted/30 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground font-medium transition-all resize-none"
              />
            </div>

            {feedback && (
              <div className={cn(
                "p-3.5 rounded-xl flex items-start gap-3 text-xs font-bold border animate-in zoom-in-95",
                feedback.type === 'error' ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              )}>
                {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                <p>{feedback.text}</p>
              </div>
            )}

            <button 
              onClick={handleAssignTask}
              disabled={submitState !== 'idle' || !selectedTask}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitState === 'success' && <Check className="w-4 h-4" />}
              {submitState === 'idle' && <CheckCircle2 className="w-4 h-4" />}
              <span>{submitState === 'loading' ? 'Processing...' : submitState === 'success' ? 'Assigned' : 'Finalize Assignment'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Unassigned Tasks</h2>
                <p className="text-xs font-semibold text-muted-foreground">{filteredTasks.length} pending allocation</p>
              </div>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search tasks, teams, groups..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-muted/40 border border-border/80 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium transition-all"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 scrollbar-thin pb-10">
            {loadingTasks ? (
              <div className="w-full h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/60 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse">Retrieving pending tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="w-full h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/60 rounded-3xl text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 opacity-30" />
                <p className="text-sm font-bold">No tasks available for assignment.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selectedTaskId === task.Id;
                return (
                  <div 
                    key={task.Id}
                    onClick={() => setSelectedTaskId(task.Id)}
                    className={cn(
                      "group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card border rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer overflow-hidden relative shadow-sm",
                      isSelected ? "border-primary bg-primary/5 shadow-md scale-[1.01]" : "border-border/60 hover:border-primary/40 hover:shadow-md"
                    )}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                    
                    <div className="flex items-center justify-center w-6 sm:w-10 shrink-0">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                        isSelected ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "border-2 border-muted-foreground/30 text-transparent group-hover:border-primary/50"
                      )}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <h4 className={cn("text-base font-black truncate transition-colors", isSelected ? "text-primary" : "text-foreground")}>
                        {task.SubcategoryName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground tracking-wide border border-border/60 truncate max-w-[120px]">
                          {task.GroupName || 'Unassigned Group'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground tracking-wide border border-border/60 truncate max-w-[120px]">
                          {task.DeptName || 'Unassigned Dept'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground tracking-wide border border-border/60 truncate max-w-[120px]">
                          {task.SectionName || 'Unassigned Section'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-black tracking-wide truncate max-w-[120px]">
                          {task.TeamName || 'Unassigned Team'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 gap-2">
                      <div className="flex items-center gap-1.5 bg-background border border-border/80 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-extrabold text-foreground">{task.MinHours} - {task.MaxHours} Hrs</span>
                      </div>
                      {task.Project && (
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest max-w-[120px] truncate">
                          {task.Project}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}