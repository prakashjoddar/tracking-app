"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { categories } from "@/mock-data/locations";
import { useMapsStore } from "@/store/maps-store";
import {
  Bed,
  ChevronsUpDown,
  Clock,
  Coffee,
  Dumbbell,
  Heart,
  Landmark,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  Trees,
  Utensils,
  Wine,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavMain } from "../ui/nav-main";

import {
  Settings2
} from "lucide-react";
import { useVehicleStore } from "@/store/location-store";

const navItems = [
  { id: "all", title: "All Locations", icon: MapPin, href: "/" },
  { id: "favorites", title: "Favorites", icon: Heart, href: "/favorites" },
];

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  utensils: Utensils,
  coffee: Coffee,
  wine: Wine,
  trees: Trees,
  landmark: Landmark,
  "shopping-bag": ShoppingBag,
  bed: Bed,
  dumbbell: Dumbbell,
};

export function LocationsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const {
    locations,
    selectedCategory,
    setSelectedCategory,
    getRecentLocations,
  } = useMapsStore();

  const vehicles = useVehicleStore((s) => s.vehicles)

  const favoriteCount = 0;
  const recentCount = 0;

  // const getCategoryCount = (categoryId: string) => {
  //   if (categoryId === "all") return locations.length;
  //   return locations.filter((l) => l.categoryId === categoryId).length;
  // };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-2.5 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full hover:bg-sidebar-accent rounded-md p-1 -m-1 transition-colors shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background shrink-0">
                <MapPin className="size-4" />
              </div>
              <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Admin User</span>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </SidebarHeader>

      <SidebarContent className="px-2.5">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                let badge: number | undefined;
                if (item.id === "favorites") badge = favoriteCount;
                if (item.id === "all") badge = vehicles.length;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-8"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge !== undefined && badge > 0 && (
                      <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-4">
          <SidebarGroupLabel className="px-0 h-6">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Categories
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || MapPin;
                const count = 0;

                return (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton
                      isActive={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="h-7"
                    >
                      <Icon
                        className="size-3.5"
                        style={{ color: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </SidebarMenuButton>
                    {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-4">
          <NavMain items={[
            {
              title: "Settings",
              url: "#",
              icon: Settings2,
              items: [
                {
                  title: "Alert Configuration",
                  url: "#",
                },
                {
                  title: "Exchange Vehicles",
                  url: "#",
                },
                {
                  title: "Billing",
                  url: "#",
                },
                {
                  title: "Limits",
                  url: "#",
                },
              ],
            },
          ]} />
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
