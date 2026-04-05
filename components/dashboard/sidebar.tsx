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
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { logoutAction } from "@/lib/auth-actions";
import { categories } from "@/mock-data/locations";
import { useMapsStore } from "@/store/maps-store";
import {
  Bed,
  ChevronsUpDown,
  Coffee,
  Dumbbell,
  FileBarChart2,
  Heart,
  Landmark,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  Trees,
  Utensils,
  Wine
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavMain } from "../ui/nav-main";

import { fetchCurrentUser } from "@/lib/api";
import { UserRequestResponse } from "@/lib/types";
import { useVehicleStore } from "@/store/location-store";
import {
  UserCircle
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { id: "all", title: "All Locations", icon: MapPin, href: "/" },
  { id: "favorites", title: "Favorites", icon: Heart, href: "/favorite" },
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

  const [isOpenSidebar, setIsOpenSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserRequestResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser).catch(() => { })
  }, [])

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "Loading..."

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}`.toUpperCase()
    : "?"

  const typeColors: Record<string, string> = {
    SUPER: "bg-red-100 text-red-700",
    ORG: "bg-blue-100 text-blue-700",
    SUB_ORG: "bg-purple-100 text-purple-700",
    DRIVER: "bg-green-100 text-green-700",
    SUPERVISOR: "bg-orange-100 text-orange-700",
  }

  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (e) {
      console.error(e);
    } finally {
      router.push("/login");
    }
  };

  const vehicles = useVehicleStore((s) => s.vehicles)

  const favoriteCount = 0;
  const recentCount = 0;

  // const getCategoryCount = (categoryId: string) => {
  //   if (categoryId === "all") return locations.length;
  //   return locations.filter((l) => l.categoryId === categoryId).length;
  // };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-2.5 py-3 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">

        <div className="group-data-[collapsible=icon]:hidden min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 hover:bg-sidebar-accent rounded-md p-1.5 -m-1 transition-colors shrink-0 min-w-0">

                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background shrink-0 text-xs font-bold">
                  {initials}
                </div>

                <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold leading-tight truncate max-w-[120px]">{displayName}</span>
                    <ChevronsUpDown className="size-3 text-muted-foreground shrink-0" />
                  </div>
                  {currentUser?.type && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none mt-0.5 ${typeColors[currentUser.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {currentUser.type.replace("_", " ")}
                    </span>
                  )}
                </div>

              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">

              {/* User info header */}
              <div className="px-3 py-2.5 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                    {currentUser?.type && (
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none mt-1 ${typeColors[currentUser.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {currentUser.type.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="size-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="size-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>

          </DropdownMenu>
        </div>

        <SidebarTrigger className="me-0 size-7 shrink-0" onClick={() => setIsOpenSidebar(val => !val)} />

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

        {/* <SidebarGroup className="p-0 mt-4">
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
        </SidebarGroup> */}

        <SidebarGroup className="p-0 mt-4">
          <NavMain items={[]} />
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
