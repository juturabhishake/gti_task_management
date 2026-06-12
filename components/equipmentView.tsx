/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/data-tables";
import { generateColumns, type Equipment, VISIBLE_KEYS } from "@/components/columns_details";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface ProjectResponseItem {
  Project: string;
}

export default function EquipmentViewTable({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editedEquipment, setEditedEquipment] = useState<Equipment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState<ProjectResponseItem[]>([]);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [locations, setLocations] = useState<{ LocationName: string }[]>([]);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/equipment/equipmentMaster/get_projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        console.log(response);
        const projectData = await response.json() as { Project: string }[];
        console.log(projectData);
        
        const uniqueProjectNames: string[] = [...new Set(projectData.map((p) => p.Project.trim()))].sort();
        const uniqueProjects = uniqueProjectNames.map((name) => ({ Project: name }));
        console.log(uniqueProjects);

        setProjects(uniqueProjects);
      } catch (err: any) {
        console.error("Error fetching projects:", err.message);
      }
    }
    async function fetchLocations() {
      try {
        const response = await fetch('/api/equipment/equipmentMaster/get_locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const locationData = await response.json();
        setLocations(locationData);
      } catch (err: any) {
        console.error("Error fetching locations:", err.message);
      }
    }
    fetchProjects();
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/equipment/equipmentMaster/get_equipment_master');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  const handleEdit = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEditedEquipment({ ...equipment });
    setIsEditDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!selectedEquipment) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/equipment/equipmentMaster/DeleteEquipmentMaster?equipment_number=${selectedEquipment.equipment_number}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete equipment');
      }
      setData((prevData) =>
        prevData.filter((item) => item.id !== selectedEquipment.id)
      );
      setIsDeleteDialogOpen(false);
      setSelectedEquipment(null);
    } catch (error: any) {
      console.error('Failed to delete equipment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editedEquipment) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editedEquipment,
        UpdatedBy: 'CurrentUser',
      };
      const response = await fetch('/api/equipment/equipmentMaster/update_equipment_master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update equipment');
      }
      const updatedData = { ...editedEquipment, UpdatedBy: payload.UpdatedBy, UpdatedDate: new Date().toISOString() };
      setData((prevData) =>
        prevData.map((item) =>
          item.id === editedEquipment.id ? updatedData : item
        )
      );
      setIsEditDialogOpen(false);
      setSelectedEquipment(null);
      setEditedEquipment(null);
    } catch (error: any) {
      console.error('Failed to save equipment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedEquipment) {
      setEditedEquipment({
        ...editedEquipment,
        [e.target.name]: e.target.value,
      });
    }
  };

  const columns = useMemo(() => generateColumns({ onEdit: handleEdit }), [handleEdit]);

  if (loading) return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500">Error fetching data: {error}</div>;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 md:p-6 flex flex-col h-full">
        <h1 className="text-xl md:text-2xl font-bold mb-4">
          Equipment Details View
        </h1>
        <div className="flex-1 min-h-0">
          <DataTable columns={columns} data={data} />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[70vh] flex flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl">Edit Equipment Details</DialogTitle>
            <DialogDescription>
              Modify the record. Click Update to save changes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {editedEquipment && VISIBLE_KEYS.map((key) => {
                if (key === 'project') {
                  const currentProjectValue = editedEquipment.project;
                  const getDisplayText = (value: string | null | undefined) => {
                    if (!value) {
                      return "Select project...";
                    }
                    if (value.length > 15) {
                      return `${value.substring(0, 15)}...`;
                    }
                    return value;
                  };
                  return (
                    <div className="grid w-full items-center gap-1.5" key={key}>
                      <Label htmlFor="project" className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        Project
                      </Label>
                      <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="project"
                            variant="outline"
                            role="combobox"
                            aria-expanded={projectPopoverOpen}
                            className="w-full justify-between font-normal text-left"
                          >
                            <span className="block truncate">
                                {getDisplayText(currentProjectValue) || "Select project..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search project..." />
                            <CommandList>
                              <CommandEmpty>No project found.</CommandEmpty>
                              <CommandGroup>
                                {projects.map((p) => (
                                  <CommandItem
                                    key={p.Project}
                                    value={p.Project}
                                    onSelect={(selectedValue) => {
                                      if (editedEquipment) {
                                        setEditedEquipment({
                                          ...editedEquipment,
                                          project: selectedValue,
                                        });
                                      }
                                      setProjectPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        currentProjectValue?.toLowerCase() === p.Project.toLowerCase() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {p.Project}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                }
                if (key === 'shop_location') {
                  const currentShopLocation = editedEquipment.shop_location;
                  return (
                    <div className="grid w-full items-center gap-1.5" key={key}>
                      <Label htmlFor="shop_location" className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        Shop Location
                      </Label>
                      <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="shop_location"
                            variant="outline"
                            role="combobox"
                            aria-expanded={locationPopoverOpen}
                            className="w-full justify-between font-normal text-left"
                          >
                            <span>
                              {currentShopLocation || "Select location..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search location..." />
                            <CommandList>
                              <CommandEmpty>No location found.</CommandEmpty>
                              <CommandGroup>
                                {locations.map((loc) => (
                                  <CommandItem
                                    key={loc.LocationName}
                                    value={loc.LocationName}
                                    onSelect={(selectedValue) => {
                                      if (editedEquipment) {
                                        setEditedEquipment({
                                          ...editedEquipment,
                                          shop_location: selectedValue,
                                        });
                                      }
                                      setLocationPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        currentShopLocation?.toLowerCase() === loc.LocationName.toLowerCase() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {loc.LocationName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                }
                return (
                  <div className="grid w-full items-center gap-1.5" key={key}>
                    <Label htmlFor={String(key)} className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {String(key).replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={String(key)}
                      name={String(key)}
                      value={String(editedEquipment[key as keyof Equipment] ?? '')}
                      onChange={handleInputChange}
                      className="w-full"
                      disabled={key === 'equipment_number' || key === 'part_no'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 rounded-b-lg border-t dark:border-gray-700">
            <Button type="button" className="cursor-pointer" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="button" className="cursor-pointer" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the equipment record for &quot;{selectedEquipment?.equipment_number}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 cursor-pointer" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}