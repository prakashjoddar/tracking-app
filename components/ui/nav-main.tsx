"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  GraduationCap,
  Layers,
  LucideBellRing,
  Map as MapIcon,
  MapPin,
  Route,
  Settings,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { AiTwotoneCar } from "react-icons/ai";
import { BsFillGeoFill } from "react-icons/bs";
import { FaUsersCog } from "react-icons/fa";
import { ImStatsDots } from "react-icons/im";
import { MdCampaign, MdChat } from "react-icons/md";
import { RiDashboardLine, RiParentLine, RiRoadMapLine } from "react-icons/ri";
import { getCurrentUserType } from "@/lib/utils";
import { useCurrentUserStore } from "@/store/current-user-store";
import type { MenuKey, UserType } from "@/lib/types";

const menuColors = [
  "#ef4444",
  "#f97316",
  "#8b5cf6",
  "#22c55e",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
  "#eab308",
  "#10b981",
  "#6366f1",
  "#f43f5e",
  "#0ea5e9",
  "#f59e0b",
];

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const currentUser = useCurrentUserStore((s) => s.user);
  const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce);

  useEffect(() => {
    setUserType(getCurrentUserType());
  }, []);

  useEffect(() => {
    if (userType === "SUB_ORG") fetchCurrentUserOnce();
  }, [userType, fetchCurrentUserOnce]);

  const allowedMenus = currentUser?.allowedMenus;
  const isRestricted = userType === "SUB_ORG" && !!allowedMenus?.length;

  const allItems: { name: string; icon: React.ReactNode; url: string; menuKey: MenuKey }[] = [
    {
      name: "Dashboard",
      icon: (
        <RiDashboardLine
          className="size-4 mr-1"
          style={{ color: menuColors[0] }}
        />
      ),
      url: "/",
      menuKey: "DASHBOARD",
    },
    {
      name: "Location History",
      icon: (
        <Route
          className="size-4 mr-1"
          style={{ color: menuColors[1] }}
        />
      ),
      url: "/location-history",
      menuKey: "LOCATION_HISTORY",
    },
    {
      name: "Vehicle Details",
      icon: (
        <AiTwotoneCar
          className="size-4 mr-1"
          style={{ color: menuColors[2] }}
        />
      ),
      url: "/vehicle",
      menuKey: "VEHICLE_DETAILS",
    },
    {
      name: "Vehicle Groups",
      icon: (
        <Layers
          className="size-4 mr-1"
          style={{ color: menuColors[12] }}
        />
      ),
      url: "/vehicle-group",
      menuKey: "VEHICLE_GROUPS",
    },
    {
      name: "Alerts",
      icon: (
        <LucideBellRing
          className="size-4 mr-1"
          style={{ color: menuColors[3] }}
        />
      ),
      url: "/alert",
      menuKey: "ALERTS",
    },
    {
      name: "Announcements",
      icon: (
        <MdCampaign
          className="size-4 mr-1"
          style={{ color: menuColors[4] }}
        />
      ),
      url: "/announcement",
      menuKey: "ANNOUNCEMENTS",
    },
    {
      name: "Chat",
      icon: (
        <MdChat
          className="size-4 mr-1"
          style={{ color: menuColors[2] }}
        />
      ),
      url: "/chat",
      menuKey: "CHAT",
    },
    {
      name: "Reports",
      icon: (
        <ImStatsDots
          className="size-4 mr-1"
          style={{ color: menuColors[5] }}
        />
      ),
      url: "/report",
      menuKey: "REPORTS",
    },

    {
      name: "Geo Fence",
      icon: (
        <BsFillGeoFill
          className="size-4 mr-1"
          style={{ color: menuColors[7] }}
        />
      ),
      url: "/geofence",
      menuKey: "GEOFENCE",
    },
    {
      name: "Alert Settings",
      icon: (
        <Settings
          className="size-4 mr-1"
          style={{ color: menuColors[10] }}
        />
      ),
      url: "/alert-config",
      menuKey: "ALERT_SETTINGS",
    },
    {
      name: "Trips",
      icon: (
        <RiRoadMapLine
          className="size-4 mr-1"
          style={{ color: menuColors[6] }}
        />
      ),
      url: "/trip",
      menuKey: "TRIPS",
    },
    {
      name: "Stop Requests",
      icon: (
        <MapPin
          className="size-4 mr-1"
          style={{ color: menuColors[6] }}
        />
      ),
      url: "/stop-requests",
      menuKey: "TRIPS",
    },
    {
      name: "Driver & Supervisor",
      icon: (
        <RiParentLine
          className="size-4 mr-1"
          style={{ color: menuColors[9] }}
        />
      ),
      url: "/driver-supervisor",
      menuKey: "DRIVER_SUPERVISOR",
    },
    {
      name: "Students",
      icon: (
        <GraduationCap
          className="size-4 mr-1"
          style={{ color: menuColors[11] }}
        />
      ),
      url: "/student",
      menuKey: "STUDENTS",
    },
    {
      name: "Sub Login",
      icon: (
        <FaUsersCog
          className="size-4 mr-1"
          style={{ color: menuColors[8] }}
        />
      ),
      url: "/user",
      menuKey: "SUB_LOGIN",
    },
    {
      name: "Vehicle Replacement",
      icon: (
        <FaUsersCog
          className="size-4 mr-1"
          style={{ color: menuColors[8] }}
        />
      ),
      url: "/vehicle-replacement",
      menuKey: "VEHICLE_REPLACEMENT",
    },
  ];

  const visibleItems = allItems.filter(
    (item) =>
      !isRestricted ||
      item.menuKey === "DASHBOARD" ||
      allowedMenus!.includes(item.menuKey),
  );

  // SUPER manages every organisation's map/place-search provider here — not a restrictable
  // MenuKey since it never applies to SUB_ORG and shouldn't appear as a Menu Access checkbox.
  const showMapSettings = userType === "SUPER";

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="px-0 h-6">
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          Menu
        </span>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                // isActive={selectedCategory === "all"}
                // onClick={() => setSelectedCategory("all")}
                asChild
                className="h-7"
              >
                <Link href={item.url}>
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </Link>
              </SidebarMenuButton>
              {/* <SidebarMenuBadge>""</SidebarMenuBadge> */}
            </SidebarMenuItem>
          ))}

          {showMapSettings && (
            <SidebarMenuItem key="Map Settings">
              <SidebarMenuButton asChild className="h-7">
                <Link href="/map-settings">
                  <MapIcon className="size-4 mr-1" style={{ color: menuColors[6] }} />
                  <span className="text-sm">Map Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {items.map((item) => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
