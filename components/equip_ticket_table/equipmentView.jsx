'use client'

import React, { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MoreHorizontal,
  GripHorizontal,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListFilter,
} from "lucide-react"
import { cn } from "@/lib/utils"

const VISIBLE_KEYS = [
    'id', 'equipment_number', 'equipment_model', 'problem_description',
    'type_of_work', 'breakdown_date', 'shift', 'down_time_start',
    'team_leader', 'project', 'shop_location'
];

const formatHeaderTitle = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const multiSelectFilter = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) {
    return true;
  }
  const rowValue = row.getValue(columnId);
  const valueToCompare = (rowValue === null || rowValue === undefined || rowValue === '') ? "N/A" : String(rowValue);
  return filterValue.includes(valueToCompare);
};

function DataTableColumnHeader({ column, title, className }) {
    const sortedUniqueValues = useMemo(() => {
        const uniqueValues = Array.from(column.getFacetedUniqueValues().keys());
        const mappedValues = uniqueValues.map(v => (v === null || v === '' || v === undefined) ? "N/A" : v);
        return [...new Set(mappedValues)].sort();
    }, [column.getFacetedUniqueValues()]);

    const selectedValues = new Set(column.getFilterValue());
    const areAllSelected = sortedUniqueValues.length > 0 && selectedValues.size === sortedUniqueValues.length;

  return (
    <div className={cn("flex items-center", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span className="font-semibold">{title}</span>
            {selectedValues.size > 0 && <GripHorizontal className="ml-2 h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Filter ${title}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      if (areAllSelected) {
                        column.setFilterValue(undefined);
                      } else {
                        column.setFilterValue(sortedUniqueValues);
                      }
                    }}
                  >
                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      areAllSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>Select All</span>
                  </CommandItem>
                  <CommandSeparator />
                  {sortedUniqueValues.map((value) => {
                    const isSelected = selectedValues.has(value);
                    return (
                      <CommandItem
                        key={String(value)}
                        onSelect={() => {
                          const newSelectedValues = new Set(selectedValues);
                          if (isSelected) {
                            newSelectedValues.delete(value);
                          } else {
                            newSelectedValues.add(value);
                          }
                          const filterValues = Array.from(newSelectedValues);
                          column.setFilterValue(
                            filterValues.length ? filterValues : undefined
                          );
                        }}
                      >
                         <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                           isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                         )}>
                           <Check className={cn("h-4 w-4")} />
                         </div>
                         <span>{value}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {selectedValues.size > 0 && (
                   <>
                    <CommandSeparator />
                    <CommandGroup>
                        <CommandItem onSelect={() => column.setFilterValue(undefined)} className="justify-center text-center">
                            Clear filters
                        </CommandItem>
                    </CommandGroup>
                   </>
                )}
              </CommandList>
            </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const generateColumns = ({ onEdit, onDelete }) => {
  const actionsColumn = {
    id: "actions",
    header: () => <div className="pl-1">Actions</div>,
    cell: ({ row }) => {
      const equipment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 w-7 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(equipment)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(equipment);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
    enableSorting: false,
  };

  const dynamicColumns = VISIBLE_KEYS.map((key) => {
    if (key === 'id') {
      return {
        accessorKey: 'id',
        accessorFn: row => row.id ? `INC000${row.id}` : 'N/A', 
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={formatHeaderTitle(key)} />
        ),
        cell: ({ getValue }) => getValue(),
        filterFn: 'multiSelectFilter',
      };
    }

    return {
      accessorKey: key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={formatHeaderTitle(key)} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(key);
        return value === null || value === '' || value === undefined ? '—' : String(value);
      },
      filterFn: 'multiSelectFilter',
    };
  });
  return [actionsColumn, ...dynamicColumns];
};

function DataTable({ columns, data, onRowClick, onEdit, onDelete }) {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ 
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      multiSelectFilter: multiSelectFilter,
    },
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between space-x-2">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-8 max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8 px-2.5">
              <ListFilter className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {formatHeaderTitle(column.id)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="relative w-full overflow-auto rounded-md border h-[57vh]">
        <Table>
          <TableHeader className="bg-primary/90 sticky top-0 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap px-2.5 py-2 text-xs text-white font-semibold sticky top-0 z-20">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="overflow-auto">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"} 
                    className="cursor-pointer even:bg-white odd:bg-muted/50 hover:bg-muted dark:even:bg-background dark:odd:bg-muted/20 dark:hover:bg-muted/40"
                    onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap px-2.5 py-1.5 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No breakdown reports submitted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-1.5">
        <div className="flex-1 text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="flex items-center space-x-1.5">
                <p className="text-xs font-medium">Rows:</p>
                <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                  <SelectTrigger className="h-7 w-[65px] text-xs"><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
                  <SelectContent side="top">{[10, 20, 50, 100].map((pageSize) => (<SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-1">
                <Button variant="outline" className="hidden h-7 w-7 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><span className="sr-only">Go to first page</span><ChevronsLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="h-7 w-7 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><span className="sr-only">Go to previous page</span><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="h-7 w-7 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><span className="sr-only">Go to next page</span><ChevronRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="hidden h-7 w-7 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><span className="sr-only">Go to last page</span><ChevronsRight className="h-3.5 w-3.5" /></Button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function EquipmentViewTable({ data, onEdit, onDelete, onRowClick }) {
  const columns = useMemo(() => generateColumns({ onEdit, onDelete }), [onEdit, onDelete]);

  return (
    <div className="@container/main bg-card text-card-foreground rounded-lg border shadow-sm p-4 md:p-6 flex flex-col h-full">
      <h1 className="text-xl md:text-2xl font-bold mb-4">
        Breakdown History
      </h1>
      <div className="flex-1 min-h-0">
        <DataTable columns={columns} data={data} onRowClick={onRowClick} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}