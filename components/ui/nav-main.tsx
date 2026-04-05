"use client"

import { ChevronRight, GraduationCap, LucideBellRing, Route, type LucideIcon } from "lucide-react";

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
    SidebarMenuSubItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import { AiTwotoneCar } from "react-icons/ai";
import { BsFillGeoFill } from "react-icons/bs";
import { FaUsersCog } from "react-icons/fa";
import { ImStatsDots } from "react-icons/im";
import { MdOutlineMessage } from "react-icons/md";
import { RiDashboardLine, RiParentLine, RiRoadMapLine } from "react-icons/ri";

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
]


export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    return (
        <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-0 h-6">
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    Menu
                </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {[
                        { name: "Dashboard", icon: <RiDashboardLine className="size-4 mr-1" style={{ color: menuColors[0] }} />, url: "/" },
                        { name: "Location History", icon: <Route className="size-4 mr-1" style={{ color: menuColors[1] }} />, url: "/location-history" },
                        { name: "Vehicle Details", icon: <AiTwotoneCar className="size-4 mr-1" style={{ color: menuColors[2] }} />, url: "/vehicle" },
                        { name: "Alerts", icon: <LucideBellRing className="size-4 mr-1" style={{ color: menuColors[3] }} />, url: "/alert" },
                        { name: "Messages", icon: <MdOutlineMessage className="size-4 mr-1" style={{ color: menuColors[4] }} />, url: "/message" },
                        { name: "Reports", icon: <ImStatsDots className="size-4 mr-1" style={{ color: menuColors[5] }} />, url: "/report" },

                        { name: "Geo Fence", icon: <BsFillGeoFill className="size-4 mr-1" style={{ color: menuColors[7] }} />, url: "/geofence" },
                        { name: "Trips", icon: <RiRoadMapLine className="size-4 mr-1" style={{ color: menuColors[6] }} />, url: "/trip" },
                        { name: "Driver & Supervisor", icon: <RiParentLine className="size-4 mr-1" style={{ color: menuColors[9] }} />, url: "/driver-supervisor" },
                        { name: "Students", icon: <GraduationCap className="size-4 mr-1" style={{ color: menuColors[11] }} />, url: "/student" },
                        { name: "Sub Login", icon: <FaUsersCog className="size-4 mr-1" style={{ color: menuColors[8] }} />, url: "/user" },
                        { name: "Exchange Vehicles", icon: <FaUsersCog className="size-4 mr-1" style={{ color: menuColors[8] }} />, url: "/vehicle-replacement" },
                    ].map((item) => <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            // isActive={selectedCategory === "all"}
                            // onClick={() => setSelectedCategory("all")}
                            asChild className="h-7"
                        >
                            <Link href={item.url}>
                                {item.icon}
                                <span className="text-sm" >{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                        {/* <SidebarMenuBadge>""</SidebarMenuBadge> */}
                    </SidebarMenuItem>)}

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
    )
}
