import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchChatConversations } from "@/lib/api";
import { ConversationSummary } from "@/lib/types";
import { useChatUnreadStore } from "@/store/chat-unread-store";
import { getCurrentUserType } from "@/lib/utils";

const POLL_INTERVAL_MS = 10000;

type SeenState = { lastMessageAt: string; unreadCount: number };

/**
 * Polls `GET /chat/conversations` — already scoped server-side to the logged-in user
 * (`ChatService.getConversations`) — and surfaces a new incoming message as either a real OS
 * notification (tab backgrounded/minimized) or an in-page toast (tab focused), plus keeps the
 * "Chat" sidebar badge (`chat-unread-store`) up to date.
 *
 * Deliberately NOT piped through `useNotificationStream`'s SSE connection — that's a per-org
 * broadcast (every admin tab in the org gets every event), which is wrong for private 1:1 chat.
 * Mounted once at the dashboard layout level, same as `useNotificationStream`.
 */
export function useChatNotifications() {
  const router = useRouter();
  const setUnreadCount = useChatUnreadStore((s) => s.setUnreadCount);
  const seenRef = useRef<Map<number, SeenState> | null>(null);

  useEffect(() => {
    // Chat isn't available to SUPER at all (same reasoning as useNotificationStream's own check).
    if (getCurrentUserType() === "SUPER") return;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let cancelled = false;

    function openChat() {
      window.focus();
      router.push("/chat");
    }

    function notifyNewMessage(conversation: ConversationSummary) {
      const canUseOsNotification =
        typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";

      if (document.hidden && canUseOsNotification) {
        const notification = new Notification(conversation.otherUserName, {
          body: conversation.lastMessageText,
          tag: `chat-${conversation.otherUserId}`,
        });
        notification.onclick = openChat;
        return;
      }

      toast(conversation.otherUserName, {
        description: conversation.lastMessageText,
        action: { label: "Open", onClick: openChat },
      });
    }

    async function poll() {
      try {
        const conversations = await fetchChatConversations();
        if (cancelled) return;

        setUnreadCount(conversations.reduce((sum, c) => sum + c.unreadCount, 0));

        const seen = seenRef.current;
        const next = new Map<number, SeenState>();
        conversations.forEach((c) => {
          const previous = seen?.get(c.otherUserId);
          // `seen` is null only on the very first poll — that's just establishing the baseline
          // (and the badge count above), not a burst of "new" messages to toast about.
          if (seen && (!previous || c.unreadCount > previous.unreadCount)) {
            notifyNewMessage(c);
          }
          next.set(c.otherUserId, { lastMessageAt: c.lastMessageAt, unreadCount: c.unreadCount });
        });
        seenRef.current = next;
      } catch {
        // transient network error, or a SUB_ORG without the CHAT menu grant (403) — try again next tick
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router, setUnreadCount]);
}
