import { useEffect } from "react";
import { toast } from "sonner";
import { NOTIFICATION_URL } from "@/lib/api";
import { NotificationEvent } from "@/lib/types";
import { useNotificationStore } from "@/store/notification-store";

const RECONNECT_DELAY_MS = 3000;

function getAccessToken(): string | null {
  const match = document.cookie.match(/(^|;\s*)access_token=([^;]*)/);
  return match ? match[2] : null;
}

function notifyToast(event: NotificationEvent) {
  const title =
    event.source === "TRIP_ALERT"
      ? event.message
      : `${event.vehicleNo} — ${event.message ?? event.type}`;

  if (event.priority === "CRITICAL" || event.priority === "HIGH" || event.type === "STOP_SKIPPED_MISSED") {
    toast.error(title);
  } else if (event.priority === "MEDIUM") {
    toast.warning(title);
  } else {
    toast.info(title);
  }
}

/**
 * Opens a live SSE connection to gps-engine's notification stream and feeds
 * every event into the notification store + a toast. Mounted once at the
 * dashboard layout level so it stays connected across route changes.
 */
export function useNotificationStream() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      const token = getAccessToken();
      if (!token) return; // not logged in — middleware will redirect anyway

      eventSource = new EventSource(`${NOTIFICATION_URL}/notifications/stream?token=${encodeURIComponent(token)}`);

      eventSource.addEventListener("notification", (e: MessageEvent) => {
        try {
          const event: NotificationEvent = JSON.parse(e.data);
          addNotification(event);
          notifyToast(event);
        } catch (err) {
          console.error("Failed to parse notification event", err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [addNotification]);
}
