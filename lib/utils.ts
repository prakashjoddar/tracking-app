import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

