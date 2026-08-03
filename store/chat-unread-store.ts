import { create } from "zustand";

/**
 * Total unread chat message count across every conversation, for this logged-in user — fed by
 * `useChatNotifications` (polling `GET /chat/conversations`), read by the "Chat" sidebar nav item's
 * badge (`components/ui/nav-main.tsx`). Kept separate from `notification-store.ts` — that store is
 * the dismissible ALERT/TRIP_ALERT log/panel, a different concept from per-conversation unread chat.
 */
type ChatUnreadState = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
};

export const useChatUnreadStore = create<ChatUnreadState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
