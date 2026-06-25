/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  IconChartBar,
  IconTicket,
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconChevronRight,
  IconTree,
  IconHierarchy2,
  IconStatusChange,
  IconPresentationAnalytics,
  IconChevronDown,
} from "@tabler/icons-react";

// import { NavDocuments } from "@/components/nav-documents";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SecureLS from "secure-ls";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    // {
    //   title: "Product Matrix",
    //   url: "/product_matrix/create",
    //   icon: IconFileWord,
    // },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Initial Release Staging",
      url: "#",
      icon: IconFolder,
      items: [
        {
          title: "Create",
          icon: IconFileWord,
          url: "/product_matrix/create",
        },
        {
          title: "View",
          icon: IconFolder,
          url: "#",
          items: [
            {
              title: "All Lists",
              icon: IconDatabase,
              url: "/product_matrix/view/all_list",
            },
            {
              title: "My Work List",
              icon: IconDatabase,
              url: "/product_matrix/view/my_work_list",
            },
          ],
        },
      ],
    },
    {
      title: "Hierarchy",
      url: "/admin/hierarchy",
      icon: IconHierarchy2,
    },
    //   title: "Equipment Breakdown and Repair Form",
    //   url: "#",
    //   icon: IconTicket,
    //   items: [
    //     {
    //       title: "Form",
    //       url: "/Equipment_Breakdown_and_RepairForm",
    //     },
    //     {
    //       title: "Add Spare Parts",
    //       url: "/Equipment_Breakdown_and_RepairForm/spareParts",
    //     },
    //   ]
    // },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Access Management",
      url: "/AccessManagement",
      icon: IconSettings,
    },
    // {
    //   title: "Equipment Master status",
    //   url: "/equipment/status",
    //   icon: IconReport,
    // },
    // {
    //   title: "Admin Equipment Breakdown and Repair Details",
    //   url: "/Equipment_Breakdown_and_RepairForm/admin",
    //   icon: IconTicket,
    // },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

function NavMainItem({
  item,
  level = 0,
}: {
  item: any;
  level?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState<string>('/dashboard');
  const hasChildren = item.items && item.items.length > 0;
  // window.location.reload();
  // const currentPath = window.location.pathname || '/dashboard';
  React.useEffect(() => {
  if (typeof window !== 'undefined') {
    setCurrentPath(window.location.pathname);
  }
  }, []);
  const isActive = currentPath === item.url || hasAnyActiveChild(item, currentPath);
  //const isActive = currentPath === item.url || hasAnyActiveChild(item, currentPath);

  React.useEffect(() => {
    if (isActive && hasChildren) {
      setOpen(true);
    }
  }, [isActive, hasChildren]);

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setOpen((prev) => !prev);
    }
  };

  const handleLinkClick = () => {
    // If needed: setOpen(false);
  };

  return (
    <div className={`pl-${level * 4} mb-1`}>
      <div
        className={`flex items-center justify-between cursor-pointer px-2 py-1 rounded transition-colors duration-300 ${
          isActive
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold"
            : "hover:bg-[var(--primary)/20] hover:text-[var(--primary)]"
        }`}
        onClick={handleItemClick}
      >
        <div className="pl-1 flex items-center gap-6">
          {item.icon && <item.icon className="size-4" />}
          <a
            href={item.url}
            className="text-sm truncate whitespace-nowrap overflow-hidden max-w-[160px]"
            onClick={(e) => {
              e.stopPropagation();
              handleLinkClick();
            }}
          >
            {item.title || item.name}
          </a>
        </div>
        {hasChildren &&
          (open ? (
            <IconChevronDown className="size-4" />
          ) : (
            <IconChevronRight className="size-4" />
          ))}
      </div>
      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-1 ml-2 border-l border-gray-200 dark:border-gray-700 pl-4">
            {item.items.map((child: any, childIndex: number) => (
              <NavMainItem key={childIndex} item={child} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function hasAnyActiveChild(item: any, currentPath: string): boolean {
  if (!item.items) return false;
  return item.items.some((child: any) => {
    if (child.url === currentPath) return true;
    if (child.items) return hasAnyActiveChild(child, currentPath);
    return false;
  });
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const ls = new SecureLS({ encodingType: "aes" });
  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [userAccess, setUserAccess] = React.useState<any[]>([]);
  const [filteredNavMain, setFilteredNavMain] = React.useState<any[]>([]);
  const [filteredNavSecondary, setFilteredNavSecondary] = React.useState<any[]>([]);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    // if (!containerRef.current) return;
    // if (typeof window === "undefined") return;
    if (containerRef.current) return;

    try {
      const ls = new SecureLS({ encodingType: "aes" });
      const fullName = ls.get("full_name");
      const employeeId = ls.get("employee_id");
      console.log("Sidebar SecureLS data:", fullName, employeeId);
      // alert(fullName + " " + employeeId);

      if (!fullName || !employeeId) {
        throw new Error("Missing login data");
      }

      setUserData({
        name: fullName,
        email: employeeId,
        avatar: "", // icon-only avatar
      });
    } catch (err) {
      console.warn("SecureLS or login data error → redirecting to login page", err);
      alert("secureLS or login data error...");
      window.location.href = "/";
    }
    const fetchUserAccess = async () => {
      let employeeId = '';
      try {
        const ls = new SecureLS({ encodingType: "aes" });
        const fullName = ls.get("full_name");
        employeeId = ls.get("employee_id");
        console.log("Sidebar SecureLS data:", fullName, employeeId);
        const response = await fetch(`/api/access/user-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ empId: employeeId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch access data');
        }

        const accessData = await response.json();
        console.log("Access data fetched:", accessData);
        setUserAccess(accessData);
      } catch (error) {
        console.error('User access error:', error);
        setUserAccess([]);
      }
    };

    fetchUserAccess();

  }, []);
React.useEffect(() => {
    if (userAccess.length > 0) {
      const accessibleUrls = new Set(
        userAccess
          .filter(p => p.access !== 4) 
          .map(p => p.url)            
      );
      
      console.log("Accessible URLs from API:", accessibleUrls);
      const filterNavItems = (items: any[]): any[] => {
        return items.reduce((acc: any[], item) => {
          if (item.items && item.items.length > 0) {
            const accessibleChildren = filterNavItems(item.items);
            if (accessibleChildren.length > 0) {
              acc.push({ ...item, items: accessibleChildren });
            }
          } 
          else if (accessibleUrls.has(item.url)) {
            acc.push(item);
          }
          return acc;
        }, []);
      };
      const filtered = filterNavItems(data.navMain);
      setFilteredNavMain(filtered);
      
      console.log("Filtered Nav Items (by URL):", filtered);
      const filteredSecondary = data.navSecondary.filter(item => {
        if (item.url !== "/AccessManagement" && item.url !== "/processAudit/qa_direct_nc_list" && item.url !== "/processAudit/qa_admin_direct_nc_list") {
          return true;
        }
        const accessEntry = userAccess.find(access => access.url === item.url);
        return accessEntry && accessEntry.access === 3;
      });
      setFilteredNavSecondary(filteredSecondary);
      
    } else {
        setFilteredNavMain([]);
        setFilteredNavSecondary(data.navSecondary.filter(item => item.url !== "/AccessManagement"));
    }
  }, [userAccess]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                {/* <IconInnerShadowTop className="!size-5" /> */}
                <img src="/icon.png" alt="gti-logo" className="size-5 w-6" />
                <span className="text-base text-primary font-bold">
                  Greentech Industries
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent 
      style={{
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="pr-2"
      >
        <div className="mt-4 pl-2 word-wrap">
          {/* {data.navMain.map((item, index) => (
            <NavMainItem key={index} item={item} />
          ))} */}
          {filteredNavMain.map((item, index) => (
            <NavMainItem key={index} item={item} />
          ))}
        </div>
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
