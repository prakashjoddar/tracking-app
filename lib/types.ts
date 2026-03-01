export type VehicleLocation = {
  vehicleNo: string;
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
