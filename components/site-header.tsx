import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSelector } from "./theme-selector";
import { ModeSwitcher } from "./mode-switcher";

export function SiteHeader() {
  return (
    // <header className="
    //   bg-background sticky top-0 z-[1000] flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b 
    //   transition-[width,height] ease-linear 
    //   group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)] 
    //   rounded-tl-md rounded-tr-md
    // ">
    <header style={{borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit"}} className="bg-background sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* <h1 className="text-base font-medium">Internal Audit System</h1> */}
        <h1 className="text-base font-medium">
          <span className="md:hidden text-primary">GMS</span>
          <span className="hidden md:block text-primary">Gauge Management System</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
