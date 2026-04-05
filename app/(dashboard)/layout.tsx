"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LocationsSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-full">  {/* 👈 override min-h-svh */}
      <LocationsSidebar />
      <SidebarInset className="overflow-hidden h-full">  {/* 👈 fixed height */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

