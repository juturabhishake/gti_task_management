/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, GripHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import React from "react";

export type Equipment = {
    id: number;
    equipment_number: string;
    equipment_model: string;
    serial_no: string;
    frequency: string;
    customer: string;
    part: string;
    project: string;
    part_no: string;
    op: string;
    shop_location: string;
    fourth_fifth_axis: string | null;
    spindle_type: string;
    spindle_rpm: string | null;
    note: string | null;
    system_type: string;
    tool_capacity: string;
    lubrication_system: string;
    manufacturer: string;
    mfg_date: string;
    received_date: string;
    installation_date: string;
    inspected_date: string;
    created_by: string;
    created_at: string;
    UpdatedBy: string;
    UpdatedDate: string;
    [key: string]: any; 
};
export const VISIBLE_KEYS: (keyof Equipment)[] = [
    'equipment_number',
    'part',
    'project',
    'part_no',
    'op',
    'shop_location'
];
const formatHeaderTitle = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};
interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
    const sortedUniqueValues = React.useMemo(() => {
        const values = Array.from(column.getFacetedUniqueValues().keys());
        return values.map(v => v === null ? "N/A" : v).sort();
    }, [column.getFacetedUniqueValues()]);
    const selectedValues = new Set(column.getFilterValue() as (string | null)[]);
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
                    key="select-all"
                    onSelect={() => {
                      if (areAllSelected) {
                        column.setFilterValue(undefined);
                      } else {
                        const allValues = sortedUniqueValues.map(v => v === "N/A" ? null : v);
                        column.setFilterValue(allValues);
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
                    const originalValue = value === "N/A" ? null : value;
                    const isSelected = selectedValues.has(originalValue);
                    return (
                      <CommandItem
                        key={String(value)}
                        onSelect={() => {
                          if (isSelected) {
                            selectedValues.delete(originalValue);
                          } else {
                            selectedValues.add(originalValue);
                          }
                          const filterValues = Array.from(selectedValues);
                          column.setFilterValue(
                            filterValues.length ? filterValues : undefined
                          )
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

type ColumnsProps = {
  onEdit: (equipment: Equipment) => void;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-CA');
    } catch (e) {
        return "Invalid Date";
    }
}

const DATE_KEYS = new Set(['received_date', 'installation_date', 'inspected_date']);

export const generateColumns = ({ onEdit }: ColumnsProps): ColumnDef<Equipment>[] => {
  const actionsColumn: ColumnDef<Equipment> = {
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
    enableSorting: false,
  };

  const dynamicColumns = VISIBLE_KEYS
    .map((key): ColumnDef<Equipment> => ({
      accessorKey: key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={formatHeaderTitle(key as string)} />
      ),
      cell: ({ row }) => {
        const value = row.getValue(key as string);
        if (DATE_KEYS.has(key as string)) {
            return formatDate(value as string);
        }
        return value === null || value === '' ? '—' : String(value);
      },
      filterFn: "arrIncludes",
  }));
  return [actionsColumn, ...dynamicColumns];
};