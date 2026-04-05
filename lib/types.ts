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
};

export type StopType = "BUS_STOP" | "PICK_DROP" | "INSTITUTE";

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
};

export type ParentDetails = {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
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
