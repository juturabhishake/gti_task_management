'use client'

import React, { useMemo, useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAdminAccessCheck } from '@/lib/useAdminAccessCheck';

const formatAccessText = (access) => {
    if (!access) return 'N/A';
    return access.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const ActionsCell = ({ row, onEdit, onDelete }) => {
  const role = row.original;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(role)} style={{ cursor: 'pointer' }}>Edit Access</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(role.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50" style={{ cursor: 'pointer' }}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const columns = ({ onEdit, onDelete }) => [
  { accessorKey: "empId", header: "Employee ID" },
  { accessorKey: "username", header: "Username" },
  { accessorKey: "page", header: "Page" },
  {
    accessorKey: "access_name",
    header: "Access",
    cell: ({ row }) => formatAccessText(row.original.access_name),
  },
  { id: "actions", cell: ({ row }) => <ActionsCell row={row} onEdit={onEdit} onDelete={onDelete} /> },
];

// const pageOptions = [
//     { value: 1, label: 'Dashboard' },
//     { value: 2, label: 'Equipment Maintenance Entry' },
//     { value: 3, label: 'Equipment Details' },
//     { value: 4, label: 'Equipment View' },
//     { value: 5, label: 'Equipment Breakdown and Repair Form' }
// ];
const Combobox = ({ options, value, onSelect, placeholder, disabled = false, searchPlaceholder = "Search..." }) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find(option => option.value === value?.value)?.label;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
                    {selectedLabel || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => {
                                    onSelect(option);
                                    setOpen(false);
                                }} style={{ cursor: 'pointer' }}>
                                    <Check className={cn("mr-2 h-4 w-4", value?.value === option.value ? "opacity-100" : "opacity-0")} />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const RoleManagementTable = () => {
    const PAGE_ID_FOR_THIS_FORM = 7;
    const { isLoading: isAccessLoading, hasAccess } = useAdminAccessCheck(PAGE_ID_FOR_THIS_FORM);
    const [data, setData] = useState([]);
    const [users, setUsers] = useState([]);
    const [accessTypes, setAccessTypes] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('idle');

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedPage, setSelectedPage] = useState(null);
    const [selectedAccess, setSelectedAccess] = useState(null);
    
    const [pageOptions, setPageOptions] = useState([]);
    
    const userOptions = useMemo(() => users.map(user => ({ value: user.EmployeeId, label: `${user.Username} (${user.EmployeeId})`, original: user })), [users]);
    const accessTypeOptions = useMemo(() => accessTypes.map(type => ({ value: type.id, label: formatAccessText(type.access_type) })), [accessTypes]);
    useEffect(() => {
        if (isAccessLoading) {
            return;
        }
    }, [isAccessLoading, hasAccess]);
    const fetchData = async () => {
        try {
            const [rolesRes, usersRes, accessTypesRes, pagesRes] = await Promise.all([
                fetch("/api/access/getAllAccess"),
                fetch('/api/access/getUsers'),
                fetch('/api/access/getAccessTypes'),
                fetch('/api/access/getPages')
            ]);
            const rolesData = await rolesRes.json();
            setData(rolesData);
            setUsers(await usersRes.json());
            setAccessTypes(await accessTypesRes.json());
            const pagesData = await pagesRes.json();
            const formattedPageOptions = pagesData.map(page => ({
                value: page.id,
                label: page.page
            }));
            setPageOptions(formattedPageOptions);
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const groupedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const sortedData = [...data].sort((a, b) => String(a.empId).localeCompare(String(b.empId)));
        let lastEmpId = null;
        let groupIndex = -1;
        return sortedData.map(row => {
            if (row.empId !== lastEmpId) {
                groupIndex++;
                lastEmpId = row.empId;
            }
            return { ...row, groupIndex };
        });
    }, [data]);

    const resetModalState = () => {
        setSelectedUser(null);
        setSelectedPage(null);
        setSelectedAccess(null);
    };

    const handleCreate = () => {
        setIsCreateMode(true);
        resetModalState();
        setIsModalOpen(true);
    };

    const handleEdit = (role) => {
        setIsCreateMode(false);
        setSelectedUser(userOptions.find(u => u.value === role.empId) || null);
        setSelectedPage(pageOptions.find(p => p.value === role.page_id) || null);
        setSelectedAccess(accessTypeOptions.find(a => a.value === role.access_id) || null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this role access?")) {
            try {
                await fetch("/api/access/deleteAccess", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });
                await fetchData();
            } catch (error) {
                console.error("Failed to delete role access:", error);
            }
        }
    };

    const handleSave = async () => {
        if (!selectedUser || !selectedPage || !selectedAccess) {
            alert("Please select an employee, page, and access type.");
            return;
        }
        setSaveStatus('loading');
        const payload = {
            empId: selectedUser.value,
            username: selectedUser.original.Username,
            modifiedBy: 'admin', 
            page_id: selectedPage.value,
            access: selectedAccess.value,
        };
        try {
            await fetch("/api/access/giveAccess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            setSaveStatus('success');
            await fetchData();
            setTimeout(() => {
                setIsModalOpen(false);
                setSaveStatus('idle');
            }, 1500);
        } catch (error) {
            console.error("Failed to save role access:", error);
            setSaveStatus('error');
        } finally {
            if (saveStatus !== 'success') {
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }
    };
    
    const table = useReactTable({
        data: groupedData,
        columns: columns({ onEdit: handleEdit, onDelete: handleDelete }),
        state: { globalFilter, columnFilters },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const [openFilterCombobox, setOpenFilterCombobox] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-card rounded-xl border text-zinc-800 dark:text-white">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-primary">Access Management</h1>
                <Button onClick={handleCreate} style={{ cursor: 'pointer' }}>Create Role Access</Button>
            </div>
            <div className="flex items-center py-4 space-x-4">
                <Input placeholder="Search all columns..." value={globalFilter ?? ''} onChange={(event) => setGlobalFilter(event.target.value)} className="max-w-sm"/>
                <Popover open={openFilterCombobox} onOpenChange={setOpenFilterCombobox}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-[250px] justify-between" style={{ cursor: 'pointer' }}>
                            {table.getColumn('empId')?.getFilterValue() ? userOptions.find(u => u.value === table.getColumn('empId')?.getFilterValue())?.label : "Select employee to filter..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                        <Command>
                            <CommandInput placeholder="Search by name or ID..." />
                            <CommandList>
                                <CommandEmpty>No employee found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem onSelect={() => { table.getColumn('empId')?.setFilterValue(undefined); setOpenFilterCombobox(false); }} style={{ cursor: 'pointer' }}>All Employees</CommandItem>
                                    {userOptions.map((user) => (
                                        <CommandItem key={user.value} value={`${user.label}`} onSelect={() => {
                                            table.getColumn('empId')?.setFilterValue(user.value === table.getColumn('empId')?.getFilterValue() ? undefined : user.value);
                                            setOpenFilterCombobox(false);
                                        }} style={{ cursor: 'pointer' }}>
                                            <Check className={cn("mr-2 h-4 w-4", table.getColumn('empId')?.getFilterValue() === user.value ? "opacity-100" : "opacity-0")} />
                                            {user.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="rounded-md border p-1">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-bold text-primary">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={cn(row.original.groupIndex % 2 === 0 ? "bg-primary/10" : "", "hover:bg-primary/5")}>
                                    {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                </TableRow>
                            ))
                        ) : (<TableRow><TableCell colSpan={columns({}).length} className="h-24 text-center">No results.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} style={{ cursor: 'pointer' }}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} style={{ cursor: 'pointer' }}>Next</Button>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCreateMode ? "Create Role Access" : "Edit Role Access"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="employee" className="text-right">Employee</Label>
                            <div className="col-span-3">
                                <Combobox options={userOptions} value={selectedUser} onSelect={setSelectedUser} placeholder="Select an employee" searchPlaceholder="Search by name or ID..." disabled={!isCreateMode} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="page" className="text-right">Page</Label>
                            <div className="col-span-3">
                                <Combobox options={pageOptions} value={selectedPage} onSelect={setSelectedPage} placeholder="Select a page" searchPlaceholder="Search page..." disabled={!isCreateMode} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="access" className="text-right">Access</Label>
                            <div className="col-span-3">
                                <Combobox options={accessTypeOptions} value={selectedAccess} onSelect={setSelectedAccess} placeholder="Select access type" searchPlaceholder="Search access type..." />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saveStatus === 'loading'} style={{ cursor: 'pointer' }}>
                            {saveStatus === 'loading' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Saving...</span></>}
                            {saveStatus === 'success' && <><Check className="mr-2 h-4 w-4" /><span>Saved</span></>}
                            {saveStatus === 'error' && <><X className="mr-2 h-4 w-4" /><span>Error</span></>}
                            {saveStatus === 'idle' && <span>Save</span>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RoleManagementTable;