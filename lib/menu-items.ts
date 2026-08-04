import type { MenuKey } from "./types";

export type MenuItemDef = {
    name: string;
    url: string;
    menuKey: MenuKey;
};

/** Single source of truth for name/url/menuKey — shared by nav-main.tsx (icons live there) and MenuAccessGuard. */
export const MENU_ITEMS: MenuItemDef[] = [
    { name: "Dashboard", url: "/", menuKey: "DASHBOARD" },
    { name: "Live Fleet", url: "/live-fleet", menuKey: "LIVE_FLEET" },
    { name: "Location History", url: "/location-history", menuKey: "LOCATION_HISTORY" },
    { name: "Vehicle Details", url: "/vehicle", menuKey: "VEHICLE_DETAILS" },
    { name: "Vehicle Groups", url: "/vehicle-group", menuKey: "VEHICLE_GROUPS" },
    { name: "Alerts", url: "/alert", menuKey: "ALERTS" },
    { name: "Announcements", url: "/announcement", menuKey: "ANNOUNCEMENTS" },
    { name: "Chat", url: "/chat", menuKey: "CHAT" },
    { name: "Reports", url: "/report", menuKey: "REPORTS" },
    { name: "Geo Fence", url: "/geofence", menuKey: "GEOFENCE" },
    { name: "Alert Settings", url: "/alert-config", menuKey: "ALERT_SETTINGS" },
    { name: "Trips", url: "/trip", menuKey: "TRIPS" },
    { name: "Stop Requests", url: "/stop-requests", menuKey: "TRIPS" },
    { name: "Driver & Supervisor", url: "/driver-supervisor", menuKey: "DRIVER_SUPERVISOR" },
    { name: "Students", url: "/student", menuKey: "STUDENTS" },
    { name: "Sub Login", url: "/user", menuKey: "SUB_LOGIN" },
    { name: "Vehicle Replacement", url: "/vehicle-replacement", menuKey: "VEHICLE_REPLACEMENT" },
];

/** Longest-prefix match so nested routes (e.g. /report/distance/daywise, /trip/stop) resolve to their owning menu. */
export function getMenuKeyForPath(pathname: string): MenuKey | null {
    if (pathname === "/") return "DASHBOARD";
    const match = MENU_ITEMS
        .filter((item) => item.url !== "/" && pathname.startsWith(item.url))
        .sort((a, b) => b.url.length - a.url.length)[0];
    return match?.menuKey ?? null;
}
