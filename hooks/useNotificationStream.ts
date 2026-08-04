import { useEffect } from "react";
import { toast } from "sonner";
import { NOTIFICATION_URL } from "@/lib/api";
import { NotificationEvent } from "@/lib/types";
import { useNotificationStore } from "@/store/notification-store";
import { getCurrentUserType } from "@/lib/utils";

const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 60000;

function getAccessToken(): string | null {
  const match = document.cookie.match(/(^|;\s*)access_token=([^;]*)/);
  return match ? match[2] : null;
}

// `event.dateTime` now carries an explicit UTC offset (see gps-engine's NotificationEvent), so
// this renders in the browser's own local timezone rather than the server's.
function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function notifyToast(event: NotificationEvent) {
  const time = formatEventTime(event.dateTime);
  const message = time ? `${time} - ${event.message}` : event.message;
  const vehicleLabel = event.vehicleName || event.vehicleNo;
  const title =
    event.source === "TRIP_ALERT"
      ? message
      : `${vehicleLabel} — ${message ?? event.type}`;

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
    // SUPER accounts aren't scoped to a single org (LocationController's
    // /location excludes them for the same reason) — gps-engine's
    // UserOrgResolver can't resolve an org for them, so opening this stream
    // would just fail and retry forever.
    if (getCurrentUserType() === "SUPER") return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    // Doubles on every failed attempt (capped) and resets once a connection actually opens — a
    // fixed 3s retry would otherwise hammer the server forever during e.g. an expired-token
    // outage that isn't going to resolve itself on the next tick.
    let reconnectDelay = RECONNECT_BASE_MS;

    function connect() {
      const token = getAccessToken();
      if (!token) return; // not logged in — middleware will redirect anyway

      eventSource = new EventSource(`${NOTIFICATION_URL}/notifications/stream?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        reconnectDelay = RECONNECT_BASE_MS;
      };

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
          reconnectTimer = setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
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
