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

export type Stop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "bus" | "point" | "institute";
  enabled: boolean;
  snapToRoute: boolean;
};

export type RfidType = "NONE" | "INDIAN" | "CHINESE";

export type Vehicle = {
  id: string;
  imei: string;
  number: string;
  name: string;
  description: string;
  rfidType: RfidType;
  simNumber: string;
  rechargeExpiry: string;
  certificateExpiry: string;
  deviceManufacturer: string;
  deviceModelNumber: string;
  vehicleManufacturer: string;
  vehicleModelNumber: string;
};
