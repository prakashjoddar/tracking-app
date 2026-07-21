import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NotificationEvent } from "@/lib/types";

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
          notifications: [event, ...s.notifications],
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
