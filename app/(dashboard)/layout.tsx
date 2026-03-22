"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LocationsSidebar } from "@/components/dashboard/sidebar";
import { FloatingSidebarTrigger } from "@/components/dashboard/FloatingSidebarTrigger";

export default function DashboardLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-full">  {/* 👈 override min-h-svh */}
      <LocationsSidebar />
      <FloatingSidebarTrigger />
      <SidebarInset className="overflow-hidden h-full">  {/* 👈 fixed height */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

