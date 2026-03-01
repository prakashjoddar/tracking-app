"use client"

import { ChevronRight, LucideBellRing, Route, type LucideIcon } from "lucide-react";

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
import { AiTwotoneCar } from "react-icons/ai";
import { FaUsersCog } from "react-icons/fa";
import { ImStatsDots } from "react-icons/im";
import { MdOutlineMessage } from "react-icons/md";
import { RiDashboardLine, RiParentLine, RiRoadMapLine } from "react-icons/ri";
import { BsFillGeoFill } from "react-icons/bs";

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
                        { name: "Dashboard", icon: <RiDashboardLine className="size-4 mr-1" style={{ color: menuColors[0] }} /> },
                        { name: "Location History", icon: <Route className="size-4 mr-1" style={{ color: menuColors[1] }} /> },
                        { name: "Vehicle Details", icon: <AiTwotoneCar className="size-4 mr-1" style={{ color: menuColors[2] }} /> },
                        { name: "Alerts", icon: <LucideBellRing className="size-4 mr-1" style={{ color: menuColors[3] }} /> },
                        { name: "Messages", icon: <MdOutlineMessage className="size-4 mr-1" style={{ color: menuColors[4] }} /> },
                        { name: "Reports", icon: <ImStatsDots className="size-4 mr-1" style={{ color: menuColors[5] }} /> },
                        { name: "Geo Fence", icon: <BsFillGeoFill className="size-4 mr-1" style={{ color: menuColors[7] }} /> },
                        { name: "Trip", icon: <RiRoadMapLine className="size-4 mr-1" style={{ color: menuColors[6] }} /> },
                        { name: "Accounts", icon: <RiParentLine className="size-4 mr-1" style={{ color: menuColors[9] }} /> },
                        { name: "Sub Login", icon: <FaUsersCog className="size-4 mr-1" style={{ color: menuColors[8] }} /> },
                    ].map((item) => <SidebarMenuItem>
                        <SidebarMenuButton
                            // isActive={selectedCategory === "all"}
                            // onClick={() => setSelectedCategory("all")}
                            className="h-7"
                        >
                            {item.icon}
                            <span className="text-sm" >{item.name}</span>
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
