"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, CheckSquare, ChevronLeft, Check, X, AlertCircle, Loader2
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import SecureLS from 'secure-ls';
import { useAccessCheck } from '@/lib/useAccessCheck';
import { useAdminAccessCheck } from "@/lib/checkAdmin";

const PAGE_ID_FOR_THIS_FORM = 2038;

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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button 
          disabled={disabled}
          className="w-full flex items-center justify-between text-sm bg-background border border-primary/20 rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="truncate font-semibold text-xs text-left">
            {selectedItem ? (selectedItem.employeeId ? `${selectedItem.employeeId} | ${selectedItem.username}` : selectedItem.name) : placeholder}
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function EditForm({ subcategoryId, onBack }) {
  const { isLoading: isAccessLoading } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const { hasAccess: isAdmin, isLoading: isAdminLoading } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);

  const [loading, setLoading] = useState(true);
  const [hasEditAccess, setHasEditAccess] = useState(false);
  const [isAssignedUser, setIsAssignedUser] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [formState, setFormState] = useState({
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

  const [feedback, setFeedback] = useState(null);
  const [submitState, setSubmitState] = useState('idle');

  useEffect(() => {
    loadInitialData();
  }, [subcategoryId]);

  useEffect(() => {
    if (taskDetail) {
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
          const employeeId = getSecureLSValue('employee_id');
          if (!employeeId) {
            setHasEditAccess(false);
            setIsAssignedUser(false);
            return;
          }

          if (taskDetail.AssignedEmployeeId && String(taskDetail.AssignedEmployeeId) === String(employeeId)) {
            setIsAssignedUser(true);
          } else {
            setIsAssignedUser(false);
          }

          const resVerify = await fetch(`/api/tasks/task-assignments?action=verifyUser&employeeId=${employeeId}&teamId=${taskDetail.TeamId}`);
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const resDetail = await fetch(`/api/tasks/task-assignments?action=single&subcategoryId=${subcategoryId}`);
      const jsonDetail = await resDetail.json();
      if (resDetail.ok && jsonDetail.data) {
        const detail = jsonDetail.data;
        setTaskDetail(detail);
        setFormState({
          assignedUserId: detail.AssignedUserId || '',
          actualHours: detail.ActualHours !== null ? String(detail.ActualHours) : '',
          statusId: detail.StatusId || '',
          reason: detail.Reason || '',
          taskDetails: detail.TaskDetails || '',
          workDate: detail.WorkDate ? detail.WorkDate.split('T')[0] : '',
          dueDate: detail.DueDate ? detail.DueDate.split('T')[0] : '',
          severity: detail.Severity || '',
          // targetStandardHours: detail.TargetStandardHours !== null ? String(detail.TargetStandardHours) : ''
          targetStandardHours: detail.ExpectedHours !== null ? String(detail.ExpectedHours) : ''
        });

        const resUsers = await fetch(`/api/tasks/task-assignments?action=usersByTeam&teamId=${detail.TeamId}`);
        const jsonUsers = await resUsers.json();
        if (resUsers.ok && jsonUsers.data) {
          setTeamUsers(jsonUsers.data);
        }

        const resStatus = await fetch('/api/tasks/task-assignments?action=statuses');
        const jsonStatus = await resStatus.json();
        if (resStatus.ok && jsonStatus.data) {
          setStatuses(jsonStatus.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.assignedUserId || !formState.workDate || !formState.dueDate || !formState.taskDetails || !formState.severity) {
      setFeedback({ type: 'error', text: 'All assignment details are required' });
      return;
    }

    if (taskDetail?.AssignedUserId && (!formState.actualHours || !formState.statusId || !formState.reason)) {
      setFeedback({ type: 'error', text: 'All work update fields are required' });
      return;
    }

    setSubmitState('loading');
    setFeedback(null);

    try {
      const res = await fetch('/api/tasks/task-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryId: parseInt(subcategoryId),
          assignedUserId: parseInt(formState.assignedUserId),
          actualHours: formState.actualHours ? parseFloat(formState.actualHours) : null,
          statusId: formState.statusId ? parseInt(formState.statusId) : null,
          reason: formState.reason,
          taskDetails: formState.taskDetails,
          workDate: formState.workDate,
          dueDate: formState.dueDate,
          severity: formState.severity,
          targetStandardHours: formState.targetStandardHours ? parseFloat(formState.targetStandardHours) : null
        })
      });

      const result = await res.json();
      if (res.ok && result.message === 'Success') {
        setSubmitState('success');
        setFeedback({ type: 'success', text: 'Task parameters configured successfully' });
        setTimeout(() => {
          setSubmitState('idle');
          onBack();
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

  if (loading || isAccessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading task parameters...</p>
      </div>
    );
  }

  const severityOptions = [
    { id: 'Min', name: `Min (${taskDetail?.MinHours || 0} Hours)` },
    { id: 'Medium', name: `Medium (${taskDetail?.MediumHours || 0} Hours)` },
    { id: 'Max', name: `Max (${taskDetail?.MaxHours || 0} Hours)` }
  ];

  return (
    <div className="w-full p-1 space-y-4">
      <div className="flex items-center gap-2 border-b border-primary/10 pb-4">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">Task Details</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Subcategory Configuration Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-card border border-primary/10 p-4 rounded-xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="col-span-2 border-b border-primary/5 pb-2.5 mb-2.5">
          <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Subcategory Name</label>
          <p className="text-base font-extrabold text-foreground mt-0.5">{taskDetail?.SubcategoryName}</p>
        </div>

        <div>
          <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Project</label>
          <p className="text-sm font-bold text-foreground mt-0.5">{taskDetail?.Project}</p>
        </div>

        <div>
          <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Assigned Category</label>
          <p className="text-sm font-semibold text-foreground mt-0.5">{taskDetail?.CategoryName}</p>
        </div>

        <div className="col-span-2 border-t border-primary/5 pt-3 mt-1.5 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Group</label>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{taskDetail?.GroupName}</p>
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Department</label>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{taskDetail?.DeptName}</p>
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Section</label>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{taskDetail?.SectionName}</p>
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-wider text-primary">Team</label>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{taskDetail?.TeamName}</p>
          </div>
        </div>
      </div>

      {!hasEditAccess && (
        <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center gap-2 text-xs font-semibold border border-yellow-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Read-only: You must be an administrator or a member of the mapped team to modify this assignment.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-5 bg-card border border-primary/10 p-5 rounded-xl shadow-lg relative">
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-primary/5 pb-2.5 mb-2.5">Section 1: Assignment & Severity</h4>
          
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
              className="w-full text-xs rounded p-2.5 focus:outline-none bg-background border border-primary/20 text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {taskDetail?.AssignedUserId && (
          <div className="space-y-4 border-t border-primary/10 pt-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-primary/5 pb-2.5 mb-2.5">Section 2: Work Update & Status</h4>
            
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

        {feedback && (
          <div className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="truncate">{feedback.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!hasEditAccess || submitState !== 'idle'}
          className="w-full py-2.5 text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: submitState === 'error' ? '#ef4444' : submitState === 'success' ? '#10b981' : 'var(--primary, #6366f1)',
            color: '#ffffff',
            cursor: hasEditAccess && submitState === 'idle' ? 'pointer' : 'not-allowed',
            filter: submitState === 'idle' ? 'none' : 'brightness(0.95)'
          }}
        >
          {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitState === 'success' && <Check className="w-4 h-4 animate-bounce" />}
          {submitState === 'error' && <X className="w-4 h-4" />}
          {submitState === 'idle' && <Check className="w-4 h-4" />}
          <span>
            {submitState === 'loading' ? 'Processing...' : submitState === 'success' ? 'Success' : submitState === 'error' ? 'Failed' : 'Submit Changes'}
          </span>
        </button>
      </form>
    </div>
  );
}