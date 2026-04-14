import {
  StudentRequestResponse,
  Stop,
  Trip,
  UserRequestResponse,
  Vehicle,
  VehicleHistoryPoint,
  VehicleLocation,
  Geofence,
} from "./types";
import axios from "axios";

// export const BASE_URL = "http://localhost:6003";
export const BASE_URL = "http://138.252.201.46:6003";

export const api = axios.create({
  baseURL: BASE_URL,
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
export async function fetchVehicleLocations(): Promise<VehicleLocation[]> {
  try {
    const res = await api.get<VehicleLocation[]>("/location");
    return res.data;
  } catch {
    return [];
  }
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

export async function deleteVehicleTrips(vehicleId: string): Promise<void> {
  await api.delete(`/trip/vehicle/${vehicleId}`);
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
