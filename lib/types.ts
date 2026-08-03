export type VehicleLocation = {
  vehicleNo: string;
  label: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  bearing: number;
  ignition: boolean;
  speed: number;
  signalStrength?: number;
  noOfSatellites?: number | null;
  batteryType?: string | null;
  externalBatteryPercent?: number | null;
  internalBatteryPercent?: number | null;
  status: string;
  tripActive?: boolean;
  /** Stop progress for the active trip — undefined/null unless tripActive. */
  completedStops?: number | null;
  totalStops?: number | null;
  /** Set only while this vehicle has an active replacement — the substitute's number/name, display only. */
  displayVehicleNo?: string;
  displayLabel?: string;
};

export type VehicleHistoryPoint = {
  vehicleNo: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  ignition: boolean;
  speed: number;
  signalStrength: number;
  noOfSatellites: number;
};

export type RfidType = "NONE" | "INTERNAL" | "EXTERNAL";

export type Vehicle = {
  id: string;
  imei: string;
  /**
   * Driver mobile number authorized to submit GPS for this vehicle from the
   * mobile app — set only for vehicles with no real hardware tracker. When
   * set, `imei` holds an admin-chosen device label rather than a real IMEI.
   */
  deviceMobileNo?: string;
  number: string;
  name: string;
  description: string;
  rfidType: RfidType;
  simNumber: string;
  rechargeExpiry: string; // LocalDateTime → ISO string
  certificateExpiry: string;
  deviceManufacturer: string;
  deviceModelNumber: string;
  vehicleManufacturer: string;
  vehicleModelNumber: string;
  checkImeiExist: boolean;
  /** Set on a damaged vehicle while it's covered by a substitute — the substitute's Vehicle.id,
   * but serialized from the backend's `Integer` field, so it arrives as a number, not a string. */
  replacementVehicleId?: number | null;
};

export type TripType = "PICKING" | "DROPPING";

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type Trip = {
  id: string;
  name: string;
  enable: boolean;
  type: TripType;
  startTime: string; // "HH:mm"
  endTime: string;
  workingDay: WeekDay[];
  staff: string[];
  driver: string[];
  vehicleId: string;
  waypoint?: string;
  stopCount?: number;
  studentCount?: number;
  followSequence: boolean;
  sequenceLookahead?: number | null;
  /** Per-trip override: when true, gps-engine's sequence-mode stall auto-skip never fires for this trip. Only meaningful when followSequence is true. */
  disableSequenceStallTimeout?: boolean | null;
  killAtMidnight: boolean;
  /** Hours of day (0-23), besides midnight, at which a still-open trip gets force-closed. */
  forceKillHours?: number[] | null;
  /** Default false: once finished, this trip can't start again same day. True allows re-starting after completion. */
  allowMultipleRunsPerDay: boolean;
  /** Default true: whether any mobile login (or this admin's own direct-add flow) can propose a new stop for this trip. */
  allowStopProposals: boolean;
};

export type StopType = "BUS_STOP" | "PICK_DROP" | "INSTITUTE";

/** Minimal driver/supervisor info attached to an active trip. */
export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  photoUrl?: string | null;
};

/** GET /api/trip/vehicle/{vehicleNo}/active — 204 when the vehicle has no active trip. */
export type ActiveTrip = {
  vehicleNo: string;
  tripId: number;
  tripName: string;
  tripType: TripType;
  waypoint?: string;
  drivers: PersonSummary[];
  supervisors: PersonSummary[];
};

export type AlertType =
  | "TRIP_STARTED"
  | "TRIP_FINISHED"
  | "BUS_APPROACHING_STOP"
  | "BUS_ARRIVED_AT_STOP"
  | "BUS_DEPARTED_STOP"
  | "STOP_SKIPPED_MISSED";

export type Alert = {
  id: number;
  vehicleNo: string;
  tripId: number;
  stopId: number | null;
  type: AlertType;
  message: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  etaSeconds: number | null;
  createdAt: string; // ISO LocalDateTime
};

/** Per-packet vehicle-status alerts — a separate, higher-volume stream than Alert/trip alerts. */
export type VehicleAlertType =
  | "IGNITION_ON"
  | "IGNITION_OFF"
  | "OVER_SPEED"
  | "RUNNING"
  | "IDLE"
  | "HALT"
  | "PARKED"
  | "BATTERY_LOW"
  | "GEOFENCE_ENTER"
  | "GEOFENCE_EXIT";

export type VehicleAlert = {
  vehicleNo: string;
  type: VehicleAlertType;
  dateTime: string; // ISO LocalDateTime — no surrogate id, (vehicleNo, type, dateTime) is the natural key
  alertLimit: number | null;
  alertValue: number | null;
  category: "ALERT" | "TRIP" | null;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  accId: string | null;
};

/** Shape of a Spring Data `Page<T>` JSON response. */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index, 0-based
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type Stop = {
  id: string;
  name: string;
  enable: boolean;
  type: StopType;
  latitude: number;
  longitude: number;
  studentId: string[];
  tripId: string;
  sequence?: number;
  snapToRoute?: boolean;
  radiusMeters?: number;
};

export type UserType = "SUPER" | "ORG" | "SUB_ORG" | "DRIVER" | "SUPERVISOR" | "STUDENT" | "PARENT";

export type UserRequestResponse = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  username: string;
  password?: string;
  type: UserType;
  address: string;
  orgId?: number;
  licenseNo?: string;
  licenseExpiryDate?: string; // "YYYY-MM-DD"
  rfid?: string;
  photoUrl?: string | null;
  vehicleIds?: string[];
  vehicleGroupIds?: string[];
  allowedMenus?: string[];
  studentIds?: string[];
  mapProvider?: "GOOGLE" | "MAPLIBRE";
  placeSearchProvider?: "GOOGLE" | "OSM";
};

export type MenuKey =
  | "DASHBOARD"
  | "LOCATION_HISTORY"
  | "VEHICLE_DETAILS"
  | "VEHICLE_GROUPS"
  | "ALERTS"
  | "ANNOUNCEMENTS"
  | "REPORTS"
  | "GEOFENCE"
  | "ALERT_SETTINGS"
  | "TRIPS"
  | "DRIVER_SUPERVISOR"
  | "STUDENTS"
  | "SUB_LOGIN"
  | "VEHICLE_REPLACEMENT";

/** `id` is matched by gps_api's UserService#updateStudentDetail on save (present = update/attach
 * that existing shared parent record; blank/absent = create a new one) — always round-trip `id`
 * when editing an existing student or attaching an already-known parent, to avoid creating
 * duplicate parent rows. A Parent can be linked to more than one Student, so editing a parent's
 * fields on one student's form updates it everywhere it's linked. */
export type ParentDetails = {
  id?: string;
  name: string;
  mobileNo: string;
  email?: string;
  address?: string;
  username?: string;
  password?: string;
  userId?: string;
};

export type StudentRequestResponse = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNo: string;
  standard: string;
  rfid: string;
  mobileNo: string;
  address: string;
  parents?: ParentDetails[];
  orgId?: number;
  username?: string;
  password?: string;
  userId?: string;
};

// ── Geofence ──────────────────────────────────────────────────────────────────
export type GeofenceType = "CIRCLE" | "POLYGON";

export type Geofence = {
  id?: string;
  name: string;
  enable: boolean;
  latitude: number;
  longitude: number;
  radius: number; // meters
  color?: string; // hex
  description?: string;
  address?: string;
  orgId?: number;
};

// ── Announcement ──────────────────────────────────────────────────────────────
export type RecipientType = "PARENT" | "STUDENT" | "DRIVER" | "SUPERVISOR" | "ALL";

export type SendAnnouncementRequest = {
  vehicleNo: string | null; // null = all vehicles
  recipientType: RecipientType;
  text: string;
};

export type AnnouncementResponse = {
  id: number;
  vehicleNo: string | null;
  recipientType: RecipientType;
  text: string;
  createdAt: string; // ISO LocalDateTime
};

// ── Notification (live, SSE) ─────────────────────────────────────────────────
export type NotificationSource = "ALERT" | "TRIP_ALERT";

/** Pushed by gps-engine's notification package over `GET /api/notifications/stream`. */
export type NotificationEvent = {
  id: string;
  source: NotificationSource;
  vehicleNo: string;
  vehicleName?: string | null;
  orgId: number;
  type: VehicleAlertType | AlertType | string;
  message: string;
  dateTime: string; // ISO LocalDateTime
  latitude: number | null;
  longitude: number | null;

  // ALERT-only
  category?: "ALERT" | "TRIP" | null;
  alertValue?: number | null;
  alertLimit?: number | null;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;

  // TRIP_ALERT-only
  tripId?: number | null;
  stopId?: number | null;
  distanceMeters?: number | null;
  etaSeconds?: number | null;
};

// ── Report ────────────────────────────────────────────────────────────────────
export type DistanceReportEntry = {
  vehicleNo: string;
  distanceKm: number;
};

export type DaywiseDistanceEntry = {
  date: string; // "YYYY-MM-DD"
  vehicleNo: string;
  distanceKm: number;
};

export type VehicleReportEntry = {
  date: string; // "YYYY-MM-DD"
  vehicleNo: string;
  distanceKm: number;
  runningMinutes: number;
  idleMinutes: number;
  parkedMinutes: number;
  overSpeedPercent: number;
  maxSpeedKmh: number;
  speedLimitKmh: number;
};


export type TripReportEntry = {
  id: number;
  vehicleNo: string;
  tripId: number;
  tripName: string | null;
  type: "PICKING" | "DROPPING";
  state: "STARTED" | "RUNNING" | "FINISHED";
  startTime: string; // ISO LocalDateTime
  endTime: string | null; // ISO LocalDateTime — null while still in progress
  totalStopsVisited: number;
};

export type VehicleReplacementHistoryEntry = {
  id: number;
  damagedVehicleNumber: string;
  replacementVehicleNumber: string;
  startedAt: string; // ISO LocalDateTime
  endedAt: string | null; // ISO LocalDateTime — null while still active
  active: boolean;
};

export type AlertConfigEntry = {
  vehicleNo: string;
  vehicleName: string | null;
  thresholdLimit: number;
  minimumRunningSpeed: number;
  overSpeedLimit: number;
  lowBatteryPercentage: number;
  ignitionAlert: boolean;
  overSpeedAlert: boolean;
  stateAlert: boolean;
  lowBatteryAlert: boolean;
  geoFenceAlert: boolean;
  tripAlert: boolean;
  overridden: boolean;
};

export type AlertConfigUpdateRequest = Omit<AlertConfigEntry, "vehicleNo" | "vehicleName" | "overridden">;

export type VehicleGroupEntry = {
  id: string;
  name: string;
  description: string | null;
  vehicleIds: string[];
  vehicleNumbers: string[];
};

export type VehicleGroupSaveRequest = {
  id?: string;
  name: string;
  description: string;
  vehicleIds: string[];
};

// ── Stop Proposal ─────────────────────────────────────────────────────────────
export type StopProposalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type StopProposalType = "NEW_STOP" | "TRANSFER";

/** A mobile-submitted "add a stop here" (or "move to a different stop") request — GET /stop-proposal/pending. */
export type StopProposal = {
  id: string;
  tripId: string;
  vehicleNo: string;
  type: StopProposalType;
  latitude: number | null;
  longitude: number | null;
  requestedSequence: number;
  studentIds: string[];
  stopName: string | null;
  status: StopProposalStatus;
  finalSequence: number | null;
  reviewNote: string | null;
  requestedByUserType: UserType;
  createdAt: string; // ISO LocalDateTime
  reviewedAt: string | null;
  /** Trip context so an admin can identify the right request without cross-referencing the trip list. */
  tripName: string | null;
  tripType: TripType | null;
  tripStartTime: string | null;
  tripEndTime: string | null;
  /** TRANSFER only. */
  sourceStopId: string | null;
  sourceStopName: string | null;
  sourceStopSequence: number | null;
  targetStopId: string | null;
  targetStopName: string | null;
  targetStopSequence: number | null;
};

export type ReviewStopProposalRequest = {
  finalSequence?: number | null;
  studentIds?: string[];
  stopName?: string | null;
  reviewNote?: string | null;
  /** TRANSFER only — lets an admin change the target stop before approving. */
  targetStopId?: string | null;
};

/** GET /stop-proposal/context/{tripId} — the trip's route polyline + its existing stops, for the review-page map. */
export type StopProposalContext = {
  waypoint: string | null;
  stops: {
    id: string;
    name: string;
    sequence: number;
    latitude: number | null;
    longitude: number | null;
  }[];
};
