import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Backend `time` strings are a bare `LocalTime.toString()` — it only ever appends a fractional
 * part when the underlying value actually carries sub-second precision (never a padded ".000"),
 * but real GPS fixes routinely do carry it. Strip it for display; anything sorting/comparing raw
 * `date`+`time` strings should keep using the untouched value. */
export function formatTime(time: string): string {
  return time.split(".")[0];
}

/** Decode the access_token JWT and return the `type` claim (client-side only). */
export function getCurrentUserType(): UserType | null {
  try {
    const match = document.cookie.match(/(^|;\s*)access_token=([^;]*)/)
    const token = match?.[2]
    if (!token) return null
    const payload = JSON.parse(atob(token.split(".")[1]))
    return (payload.type ?? payload.userType ?? payload.role ?? null) as UserType | null
  } catch {
    return null
  }
}

