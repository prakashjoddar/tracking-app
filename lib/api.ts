import {
  ActiveTrip,
  Alert,
  AnnouncementResponse,
  Page,
  SendAnnouncementRequest,
  StudentRequestResponse,
  Stop,
  Trip,
  TripReportEntry,
  UserRequestResponse,
  Vehicle,
  VehicleAlert,
  VehicleHistoryPoint,
  VehicleLocation,
  VehicleReportEntry,
  VehicleReplacementHistoryEntry,
  DistanceReportEntry,
  DaywiseDistanceEntry,
  Geofence,
  AlertConfigEntry,
  AlertConfigUpdateRequest,
  VehicleGroupEntry,
  VehicleGroupSaveRequest,
  StopProposal,
  StopProposalContext,
  ReviewStopProposalRequest,
} from "./types";
import axios from "axios";

// export const BASE_URL = "http://localhost:6003";
export const BASE_URL = "/api";

// export const BACKEND_URL = "http://localhost:6003";
export const BACKEND_URL = "http://138.252.201.46:6003";

// gps-engine's notification stream is connected to directly (not proxied
// through the /api rewrite) — Next.js's response compression buffers the
// low-throughput SSE chunks before flushing, so the browser never receives
// them in real time through the proxy, even though the connection itself
// succeeds. gps-engine's endpoint has @CrossOrigin for exactly this reason.
export const NOTIFICATION_URL = "https://alert.trackingtoe.com";
// export const NOTIFICATION_URL = "http://localhost:6002";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Server-only axios instance — uses direct backend URL (no proxy needed on Node.js) */
export const serverApi = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const getCookie = (name: string) => {
      const match = document.cookie.match(
        new RegExp("(^|;\\s*)" + name + "=([^;]*)"),
      );
      return match ? match[2] : null;
    };

    const token = getCookie("access_token");
    const deviceId = getCookie("x_device_id");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (deviceId) {
      config.headers["X-Device-Id"] = deviceId;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Detection: Check if the response was a 401 OR if the error message explicitly contains "JWT expired"
    // Even if the status is 500, we should still try to refresh if it's a JWT expiry.
    const errorData = error.response?.data;
    const errorString =
      typeof errorData === "string"
        ? errorData
        : JSON.stringify(errorData || "");
    const isUnauthorized =
      error.response?.status === 401 || errorString.includes("JWT expired");

    if (
      isUnauthorized &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authActions = await import("./auth-actions");
        const res = await authActions.refreshTokensAction();

        if (res.success && res.accessToken) {
          const newToken = res.accessToken;
          api.defaults.headers.common["Authorization"] = "Bearer " + newToken;
          originalRequest.headers["Authorization"] = "Bearer " + newToken;
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          processQueue(res.error, null);
          window.location.href = "/login";
          return Promise.reject(res.error);
        }
      } catch (err) {
        processQueue(err, null);
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// ── Location ──────────────────────────────────────────────────────────────────
export async function fetchVehicleLocations(
  groupId?: string | null,
): Promise<VehicleLocation[]> {
  const res = await api.get<VehicleLocation[]>("/location", {
    params: groupId ? { groupId } : undefined,
  });
  return res.data;
}

export async function fetchVehicleLocationHistory(
  vehicleNo: string,
  startDate: string,
  endDate?: string,
): Promise<VehicleHistoryPoint[]> {
  try {
    const res = await api.get<VehicleHistoryPoint[]>(
      `/location/history/${vehicleNo}/${startDate}`,
      { params: endDate ? { endDate } : {} },
    );
    return res.data;
  } catch {
    return [];
  }
}

// ── Vehicle ───────────────────────────────────────────────────────────────────
export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await api.get<Vehicle[]>("/vehicle");
  return res.data;
}

export async function saveVehicle(
  vehicle: Omit<Vehicle, "id"> & { id?: string },
): Promise<Vehicle> {
  const res = await api.post<Vehicle>("/vehicle", vehicle);
  return res.data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicle/${id}`);
}

export async function replaceVehicle(
  id: string,
  replacementVehicleId: string,
): Promise<Vehicle> {
  const res = await api.post<Vehicle>(`/vehicle/${id}/replace`, {
    replacementVehicleId,
  });
  return res.data;
}

export async function cancelVehicleReplacement(id: string): Promise<Vehicle> {
  const res = await api.post<Vehicle>(`/vehicle/${id}/replace/cancel`);
  return res.data;
}

// ── Trip ──────────────────────────────────────────────────────────────────────
export async function fetchTrips(vehicleId: string): Promise<Trip[]> {
  const res = await api.get<Trip[]>(`/trip/${vehicleId}`);
  return res.data;
}

export async function saveTrip(
  trip: Omit<Trip, "id"> & { id?: string },
): Promise<Trip> {
  const res = await api.post<Trip>("/trip", trip);
  return res.data;
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trip/${id}`);
}

export async function cloneTrip(id: string): Promise<Trip> {
  const res = await api.post<Trip>(`/trip/${id}/clone`);
  return res.data;
}

export async function deleteVehicleTrips(vehicleId: string): Promise<void> {
  await api.delete(`/trip/vehicle/${vehicleId}`);
}

/** Live trip status for a vehicle — null when it has no active trip right now. */
export async function fetchActiveTrip(
  vehicleNo: string,
): Promise<ActiveTrip | null> {
  try {
    const res = await api.get<ActiveTrip>(`/trip/vehicle/${vehicleNo}/active`);
    return res.status === 204 ? null : res.data;
  } catch (e) {
    console.error("Failed to fetch active trip", e);
    return null;
  }
}

/** Ends a vehicle's currently active trip right away instead of waiting for its scheduled end time. */
export async function finishActiveTrip(vehicleNo: string): Promise<void> {
  await api.post(`/trip/vehicle/${vehicleNo}/finish`);
}

export async function initializeWaypoint(
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<Trip> {
  const res = await api.post<Trip>("/trip/waypoint", {
    tripId,
    startDate,
    endDate,
  });
  return res.data;
}

// ── Stop ──────────────────────────────────────────────────────────────────────
export async function fetchStops(tripId: string): Promise<Stop[]> {
  const res = await api.get<Stop[]>(`/stop/${tripId}`);
  return res.data;
}

export async function saveStop(
  stop: Omit<Stop, "id" | "snapToRoute"> & { id?: string },
): Promise<Stop> {
  const res = await api.post<Stop>("/stop", stop);
  return res.data;
}

// Bulk save — maps to @PostMapping on /stop/batch (fix the duplicate @PostMapping in StopController)
export async function saveStops(
  stops: (Omit<Stop, "id" | "snapToRoute"> & { id?: string })[],
): Promise<Stop[]> {
  const res = await api.post<Stop[]>("/stop/batch", stops);
  return res.data;
}

export async function deleteStop(id: string): Promise<void> {
  await api.delete(`/stop/${id}`);
}

export async function deleteStops(ids: string[]): Promise<void> {
  await api.delete(`/stop/batch/${ids.join(",")}`);
}

export async function deleteTripStops(tripId: string): Promise<void> {
  await api.delete(`/stop/trip/${tripId}`);
}

// ── Stop Proposal ─────────────────────────────────────────────────────────────
export async function fetchPendingStopProposals(): Promise<StopProposal[]> {
  const res = await api.get<StopProposal[]>("/stop-proposal/pending");
  return res.data;
}

/** The trip's route polyline + existing ordered stops, for the review page's map preview. */
export async function fetchStopProposalContext(tripId: string): Promise<StopProposalContext> {
  const res = await api.get<StopProposalContext>(`/stop-proposal/context/${tripId}`);
  return res.data;
}

export async function approveStopProposal(
  id: string,
  request: ReviewStopProposalRequest,
): Promise<StopProposal> {
  const res = await api.post<StopProposal>(`/stop-proposal/${id}/approve`, request);
  return res.data;
}

export async function rejectStopProposal(
  id: string,
  request: ReviewStopProposalRequest,
): Promise<StopProposal> {
  const res = await api.post<StopProposal>(`/stop-proposal/${id}/reject`, request);
  return res.data;
}

// ── Alert ─────────────────────────────────────────────────────────────────────
/** Trip-lifecycle alerts (TRIP_STARTED, BUS_ARRIVED_AT_STOP, etc.). */
export async function fetchTripAlerts(
  page: number,
  size = 25,
  vehicleNo?: string,
): Promise<Page<Alert>> {
  const res = await api.get<Page<Alert>>("/alert/trip", {
    params: { page, size, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

/** Per-packet vehicle-status alerts (IGNITION_ON, OVER_SPEED, etc.) — a separate, higher-volume stream. */
export async function fetchVehicleAlerts(
  page: number,
  size = 25,
  vehicleNo?: string,
): Promise<Page<VehicleAlert>> {
  const res = await api.get<Page<VehicleAlert>>("/alert/vehicle", {
    params: { page, size, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

// ── Announcement ──────────────────────────────────────────────────────────────
export async function sendAnnouncement(
  request: SendAnnouncementRequest,
): Promise<AnnouncementResponse> {
  const res = await api.post<AnnouncementResponse>("/announcement", request);
  return res.data;
}

export async function fetchAnnouncements(
  page: number,
  size = 25,
): Promise<Page<AnnouncementResponse>> {
  const res = await api.get<Page<AnnouncementResponse>>("/announcement", {
    params: { page, size },
  });
  return res.data;
}

// ── Reports ───────────────────────────────────────────────────────────────────
/** `from`/`to` are required — format "YYYY-MM-DDTHH:mm:ss". */
export async function fetchIgnitionReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
): Promise<Page<VehicleAlert>> {
  const res = await api.get<Page<VehicleAlert>>("/report/ignition", {
    params: { page, size, from, to, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

export async function fetchVehicleReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
  groupId?: string,
): Promise<Page<VehicleReportEntry>> {
  const res = await api.get<Page<VehicleReportEntry>>("/report/vehicle", {
    params: {
      page,
      size,
      from,
      to,
      vehicleNo: vehicleNo || undefined,
      groupId: groupId || undefined,
    },
  });
  return res.data;
}

export async function fetchDistanceReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
  groupId?: string,
): Promise<Page<DistanceReportEntry>> {
  const res = await api.get<Page<DistanceReportEntry>>("/report/distance", {
    params: {
      page,
      size,
      from,
      to,
      vehicleNo: vehicleNo || undefined,
      groupId: groupId || undefined,
    },
  });
  return res.data;
}

export async function fetchDaywiseDistanceReport(
  from: string,
  to: string,
  vehicleNo?: string,
  groupId?: string,
): Promise<DaywiseDistanceEntry[]> {
  const res = await api.get<DaywiseDistanceEntry[]>(
    "/report/distance/daywise",
    {
      params: {
        from,
        to,
        vehicleNo: vehicleNo || undefined,
        groupId: groupId || undefined,
      },
    },
  );
  return res.data;
}

export async function fetchOverSpeedReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
): Promise<Page<VehicleAlert>> {
  const res = await api.get<Page<VehicleAlert>>("/report/over-speed", {
    params: { page, size, from, to, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

export async function fetchGeofenceReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
): Promise<Page<VehicleAlert>> {
  const res = await api.get<Page<VehicleAlert>>("/report/geofence", {
    params: { page, size, from, to, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

export async function fetchTripReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
): Promise<Page<TripReportEntry>> {
  const res = await api.get<Page<TripReportEntry>>("/report/trip", {
    params: { page, size, from, to, vehicleNo: vehicleNo || undefined },
  });
  return res.data;
}

export async function fetchStopsReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
  groupId?: string,
): Promise<Page<Alert>> {
  const res = await api.get<Page<Alert>>("/report/stops", {
    params: {
      page,
      size,
      from,
      to,
      vehicleNo: vehicleNo || undefined,
      groupId: groupId || undefined,
    },
  });
  return res.data;
}

export async function fetchVehicleReplacementReport(
  page: number,
  size: number,
  from: string,
  to: string,
  vehicleNo?: string,
): Promise<Page<VehicleReplacementHistoryEntry>> {
  const res = await api.get<Page<VehicleReplacementHistoryEntry>>(
    "/report/vehicle-replacement",
    {
      params: { page, size, from, to, vehicleNo: vehicleNo || undefined },
    },
  );
  return res.data;
}

// ── Student ───────────────────────────────────────────────────────────────────
export const fetchStudents = async (): Promise<StudentRequestResponse[]> => {
  const res = await api.get("/user/student");
  return res.data;
};

export const saveStudent = async (
  data: StudentRequestResponse,
): Promise<StudentRequestResponse> => {
  const res = await api.post("/user/student", data);
  return res.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await api.delete(`/user/student/${id}`);
};

// ── User ──────────────────────────────────────────────────────────────────────
/** Returns the currently logged-in user's details */
export async function fetchCurrentUser(): Promise<UserRequestResponse> {
  const res = await api.get<UserRequestResponse>("/user/details");
  return res.data;
}

/** SUPER only — returns all users across all orgs */
export async function fetchAllUsers(): Promise<UserRequestResponse[]> {
  const res = await api.get<UserRequestResponse[]>("/user/all");
  return res.data;
}

/** ORG / SUB_ORG — returns scoped users, optionally filtered by type */
export async function fetchUsers(
  type?: import("./types").UserType,
): Promise<UserRequestResponse[]> {
  const res = await api.get<UserRequestResponse[]>("/user", {
    params: type ? { type } : undefined,
  });
  return res.data;
}

export async function saveUser(
  user: UserRequestResponse,
): Promise<UserRequestResponse> {
  const res = await api.post<UserRequestResponse>("/user", user);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/user/${id}`);
}

export async function uploadUserPhoto(
  id: string,
  file: File,
): Promise<UserRequestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<UserRequestResponse>(
    `/user/${id}/photo`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

/** gps_api returns photoUrl as a server-relative path (e.g. "/uploads/users/x.jpg") — resolve it through the same /api proxy everything else uses. */
export function resolveUserPhotoUrl(photoUrl?: string | null): string | null {
  return photoUrl ? `${BASE_URL}${photoUrl}` : null;
}

export async function updatePassword(password: string): Promise<void> {
  await api.post(`/auth/updatePassword/${encodeURIComponent(password)}`);
}

// ── Geofence ──────────────────────────────────────────────────────────────────
export async function fetchGeofences(): Promise<Geofence[]> {
  const res = await api.get<Geofence[]>("/geofence");
  return res.data;
}

export async function saveGeofence(geofence: Geofence): Promise<Geofence> {
  const res = await api.post<Geofence>("/geofence", geofence);
  return res.data;
}

export async function deleteGeofence(id: string): Promise<void> {
  await api.delete(`/geofence/${id}`);
}

// ── Alert Config ──────────────────────────────────────────────────────────────
export async function fetchAlertConfigs(): Promise<AlertConfigEntry[]> {
  const res = await api.get<AlertConfigEntry[]>("/alert-config");
  return res.data;
}

export async function updateAlertConfig(
  vehicleNo: string,
  payload: AlertConfigUpdateRequest,
): Promise<AlertConfigEntry> {
  const res = await api.put<AlertConfigEntry>(
    `/alert-config/${vehicleNo}`,
    payload,
  );
  return res.data;
}

export async function resetAlertConfig(vehicleNo: string): Promise<void> {
  await api.delete(`/alert-config/${vehicleNo}`);
}

export async function fetchDefaultAlertConfig(): Promise<AlertConfigUpdateRequest> {
  const res = await api.get<AlertConfigUpdateRequest>("/alert-config/default");
  return res.data;
}

export async function updateDefaultAlertConfig(
  payload: AlertConfigUpdateRequest,
): Promise<AlertConfigUpdateRequest> {
  const res = await api.put<AlertConfigUpdateRequest>(
    "/alert-config/default",
    payload,
  );
  return res.data;
}

// ── Vehicle Group ─────────────────────────────────────────────────────────────
export async function fetchVehicleGroups(): Promise<VehicleGroupEntry[]> {
  const res = await api.get<VehicleGroupEntry[]>("/vehicle-group");
  return res.data;
}

export async function saveVehicleGroup(
  payload: VehicleGroupSaveRequest,
): Promise<VehicleGroupEntry> {
  const res = await api.post<VehicleGroupEntry>("/vehicle-group", payload);
  return res.data;
}

export async function deleteVehicleGroup(id: string): Promise<void> {
  await api.delete(`/vehicle-group/${id}`);
}
