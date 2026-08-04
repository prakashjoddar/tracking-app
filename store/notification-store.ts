import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NotificationEvent } from "@/lib/types";

// Mounted once at the dashboard layout level and never unmounted for the life of the session
// (see useNotificationStream) — without a cap, a long-running admin tab accumulates every event
// it has ever received and the array grows without bound.
const MAX_NOTIFICATIONS = 200;

type NotificationState = {
  notifications: NotificationEvent[];
  unreadCount: number;
  isOpen: boolean;
  addNotification: (event: NotificationEvent) => void;
  markAllRead: () => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      addNotification: (event) =>
        set((s) => ({
          notifications: [event, ...s.notifications].slice(0, MAX_NOTIFICATIONS),
          unreadCount: s.unreadCount + 1,
        })),
      markAllRead: () => set({ unreadCount: 0 }),
      clear: () => set({ notifications: [], unreadCount: 0 }),
      open: () => set({ isOpen: true, unreadCount: 0 }),
      close: () => set({ isOpen: false }),
      toggle: () =>
        set((s) => ({
          isOpen: !s.isOpen,
          unreadCount: s.isOpen ? s.unreadCount : 0,
        })),
    }),
    { name: "NotificationStore" },
  ),
);
