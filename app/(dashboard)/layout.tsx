"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LocationsSidebar } from "@/components/dashboard/sidebar";
import { NotificationPanel } from "@/components/notification/NotificationPanel";
import { NotificationToggleButton } from "@/components/notification/NotificationToggleButton";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { MenuAccessGuard } from "@/components/auth/MenuAccessGuard";

export default function DashboardLayout({ children }: {
  children: React.ReactNode;
}) {
  useNotificationStream();

  return (
    <SidebarProvider className="h-full">  {/* 👈 override min-h-svh */}
      <LocationsSidebar />
      <SidebarInset className="overflow-hidden h-full">  {/* 👈 fixed height */}
        <MenuAccessGuard>{children}</MenuAccessGuard>
      </SidebarInset>
      <NotificationPanel />
      <NotificationToggleButton />
    </SidebarProvider>
  )
}

