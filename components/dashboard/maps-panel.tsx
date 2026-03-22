"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useVehicleLocations } from "@/hooks/useVehicleLocations";
import { VehicleLocation } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  tags as allTags,
  categories,
  statusColor,
  type Location,
} from "@/mock-data/locations";
import { useVehicleStore } from "@/store/location-store";
import { useMapsStore } from "@/store/maps-store";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  Clock,
  Eye,
  Heart,
  Loader2,
  LucideChevronsRight,
  MapPin,
  Navigation,
  Rocket,
  Route,
  Search,
  Star,
  TrendingUp,
  X
} from "lucide-react";
import * as React from "react";
import { IoRocketSharp, IoSpeedometer } from "react-icons/io5";
import { LiaSatelliteDishSolid } from "react-icons/lia";
import { PiMapPinFill } from "react-icons/pi";
import { useMediaQuery } from "usehooks-ts";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { fetchVehicleLocationHistory } from "@/lib/api";
import Draggable from 'react-draggable';
import { BiSignal1, BiSignal2, BiSignal3, BiSignal4, BiSignal5 } from "react-icons/bi";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { MdOutlineSpeed } from "react-icons/md";
import { BsSpeedometer2 } from "react-icons/bs";
import { VehicleCard } from "./vehicle-card";
import Link from "next/link";


type PanelMode = "all" | "favorites" | "recents";

interface MapsPanelProps {
  mode?: PanelMode;
}

const panelConfig = {
  all: {
    title: "All Locations",
    emptyIcon: MapPin,
    emptyTitle: "No locations found",
    emptyDescription: null,
    getSubtitle: (count: number) =>
      `${count} location${count !== 1 ? "s" : ""}`,
  },
  favorites: {
    title: "Favorites",
    emptyIcon: Heart,
    emptyTitle: "No favorites yet",
    emptyDescription:
      "Click the heart icon on a location to add it to favorites",
    getSubtitle: (count: number) =>
      `${count} favorite${count !== 1 ? "s" : ""}`,
  },
  recents: {
    title: "Recent Locations",
    emptyIcon: Clock,
    emptyTitle: "No recent locations",
    emptyDescription: null,
    getSubtitle: (count: number) => `Last ${count} added locations`,
  },
};

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function MapsPanel({ mode = "all" }: MapsPanelProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingRoute, setIsLoadingRoute] = React.useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const {
    selectedLocationId,
    searchQuery,
    sortBy,
    selectLocation,
    toggleFavorite,
    setSearchQuery,
    setSortBy,
    getFilteredLocations,
    getFavoriteLocations,
    getRecentLocations,
    userLocation,
    routeDestinationId,
    setRouteDestination,
    setUserLocation,
    clearRoute,
    isPanelVisible,
    setPanelVisible,
  } = useMapsStore();

  const isDesktop = useMediaQuery("(min-width: 640px)");

  useVehicleLocations()
  const vehicles = useVehicleStore((s) => s.vehicles)
  const setLocationHistory = useVehicleStore((s) => s.setLocationHistory);
  const nodeRef = React.useRef(null);
  const [isSidebarOnLeft, setIsSidebarOnLeft] = useState(true);

  const followVehicleId = useMapsStore((s) => s.followVehicleId)
  const setFollowVehicle = useMapsStore((s) => s.setFollowVehicle)
  const setAutoFocus = useMapsStore((s) => s.setAutoFocus);

  React.useEffect(() => {
    if (isDesktop && !isPanelVisible) {
      // setPanelVisible(true);
    }
  }, [isDesktop, isPanelVisible, setPanelVisible]);

  const getDistance = React.useCallback(
    (location: Location) => {
      if (!userLocation) return null;
      return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        location.coordinates.lat,
        location.coordinates.lng
      );
    },
    [userLocation]
  );

  const getLocationFromIP = React.useCallback(async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const requestUserLocation = React.useCallback(() => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      setIsRequestingLocation(true);

      const tryIPFallback = async () => {
        const ipLocation = await getLocationFromIP();
        setIsRequestingLocation(false);
        if (ipLocation) {
          setUserLocation(ipLocation);
          resolve(ipLocation);
        } else {
          alert("Unable to get your location. Please try again later.");
          resolve(null);
        }
      };

      if (!("geolocation" in navigator)) {
        tryIPFallback();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsRequestingLocation(false);
          resolve(location);
        },
        () => {
          tryIPFallback();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    });
  }, [setUserLocation, getLocationFromIP]);

  const getLocations = () => {
    switch (mode) {
      case "favorites":
        return getFavoriteLocations();
      case "recents":
        return getRecentLocations();
      default:
        return getFilteredLocations();
    }
  };

  // const rawLocations = getLocations();
  // const locations = React.useMemo(() => {
  //   if (!selectedLocationId) return rawLocations;
  //   const selected = rawLocations.find((l) => l.id === selectedLocationId);
  //   if (!selected) return rawLocations;
  //   return [
  //     selected,
  //     ...rawLocations.filter((l) => l.id !== selectedLocationId),
  //   ];
  // }, [rawLocations, selectedLocationId]);

  const config = panelConfig[mode];
  const EmptyIcon = config.emptyIcon;

  // React.useEffect(() => {
  //   if (selectedLocationId) {
  //     const isInList = rawLocations.some((l) => l.id === selectedLocationId);
  //     if (!isInList) {
  //       // selectLocation(null);
  //       clearRoute();
  //     }
  //   }
  // }, [rawLocations, selectedLocationId, selectLocation, clearRoute]);

  React.useEffect(() => {
    if (selectedLocationId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedLocationId]);

  const handleLocationClick = (location: Location) => {
    if (selectedLocationId === location.id) {
      selectLocation(null);
    } else {
      selectLocation(location.id);
    }
  };

  const handleVehicleClick = (location: VehicleLocation) => {
    if (selectedLocationId === location.vehicleNo) {
      selectLocation(null);
    } else {
      selectLocation(location.vehicleNo);
      selectLocation(location.vehicleNo);

      // enable autofocus if disabled
      setAutoFocus(true);

      // start following vehicle
      setFollowVehicle(location.vehicleNo);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectLocation(null);
    clearRoute();
  };

  const handleGetDirections = async (
    e: React.MouseEvent,
    location: VehicleLocation
  ) => {
    e.stopPropagation();

    if (routeDestinationId === location.vehicleNo) {
      clearRoute();
      return;
    }

    let currentUserLocation = userLocation;

    if (!currentUserLocation) {
      currentUserLocation = await requestUserLocation();
      if (!currentUserLocation) {
        return;
      }
    }

    setIsLoadingRoute(true);
    setRouteDestination(location.vehicleNo);

    setTimeout(() => {
      setIsLoadingRoute(false);
    }, 1500);
  };

  const handleGetVehicleLocationHistory = async (
    e: React.MouseEvent,
    location: VehicleLocation
  ) => {
    e.stopPropagation();

    try {
      const now = new Date();
      const offsetInMs = now.getTimezoneOffset() * 60000;
      const date = new Date(now.getTime() - offsetInMs).toISOString().split("T")[0];

      const data = await fetchVehicleLocationHistory(location.vehicleNo, date);
      setLocationHistory(location.vehicleNo, date, data);
    } catch (err) {
      console.error("Vehicle fetch error", err);
    }

    if (routeDestinationId === location.vehicleNo) {
      clearRoute();
      return;
    }

    let currentUserLocation = userLocation;

    if (!currentUserLocation) {
      currentUserLocation = await requestUserLocation();
      if (!currentUserLocation) {
        return;
      }
    }

    setIsLoadingRoute(true);
    setRouteDestination(location.vehicleNo);

    setTimeout(() => {
      setIsLoadingRoute(false);
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toDateString() + " " + date.toLocaleTimeString() + " - " + `${diffDays} days ago`;
    if (diffDays < 30) return date.toDateString() + " " + date.toLocaleTimeString() + " - " + `${Math.floor(diffDays / 7)} weeks ago`;
    return dateString;
  };

  const getTagName = (tagId: string) => {
    return allTags.find((t) => t.id === tagId)?.name || tagId;
  };

  if (!isPanelVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        // className="absolute left-4 top-4 z-20 sm:hidden size-10 bg-background! shadow-xl"
        className="absolute left-4 top-4 z-20 size-10 bg-background! shadow-xl"
        onClick={() => setPanelVisible(true)}
      >
        <LucideChevronsRight className="size-5" />
      </Button>
    );
  }

  const getStatusCount = (status: string) => {
    return vehicles.filter((v) => v.status === status).length;
  };

  const getSignalStrengthIcon = (signalStrength: number | undefined) => {
    if (signalStrength === undefined) return <BiSignal1 className="size-4 text-gray-500" />;
    if (signalStrength >= 80) return <BiSignal5 className="size-4 text-green-500" />;
    if (signalStrength >= 60) return <BiSignal4 className="size-4 text-yellow-500" />;
    if (signalStrength >= 40) return <BiSignal3 className="size-4 text-orange-500" />;
    if (signalStrength >= 20) return <BiSignal2 className="size-4 text-red-500" />;
    return <BiSignal1 className="size-4 text-gray-500" />;
  }

  const getSateliteIcon = (noOfSatellites: number | null | undefined) => {
    if (noOfSatellites === undefined || noOfSatellites == null)
      return <LiaSatelliteDishSolid className="size-4 text-gray-500 fill-gray-500" />;;
    if (noOfSatellites >= 25) return <LiaSatelliteDishSolid className="size-4 text-green-500 fill-green-500" />;
    if (noOfSatellites >= 20) return <LiaSatelliteDishSolid className="size-4 text-yellow-500 fill-yellow-500" />;
    if (noOfSatellites >= 15) return <LiaSatelliteDishSolid className="size-4 text-orange-500 fill-orange-500" />;
    if (noOfSatellites >= 10) return <LiaSatelliteDishSolid className="size-4 text-red-500 fill-red-500" />;
    return <LiaSatelliteDishSolid className="size-4 text-gray-500 fill-gray-500" />;
  }

  const getSpeedColor = (speed: number | undefined) => {
    if (speed === undefined) return "text-gray-500";
    if (speed >= 50) return "text-green-500";
    if (speed >= 40) return "text-yellow-500";
    if (speed >= 30) return "text-orange-500";
    if (speed >= 20) return "text-red-500";
    return "text-gray-500";
  }

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">

      {/* <div className={"absolute top-4 bottom-4 z-20 flex flex-col bg-background rounded-xl shadow-xl border overflow-hidden w-80 sm:w-400 xl:w-125"+ (isSidebarOnLeft ? " left-4" : " right-30")}> */}
      <div className={"absolute top-4 bottom-4 z-20 flex flex-col bg-background/95 backdrop-blur rounded-2xl shadow-2xl border border-border/50 overflow-hidden w-80 sm:w-[400px] xl:w-[450px]" + (isSidebarOnLeft ? " left-4" : " right-30")}>

        <div className="p-1 border-b flex items-center justify-between cursor-move select-none drag-handle bg-muted/40 backdrop-blur">

          <div className="flex items-center gap-1" ref={nodeRef}>
            <Button
              variant="ghost"
              size="icon"
              // className="size-7 sm:hidden"
              onClick={() => {
                console.log("Closing panel");
                setPanelVisible(false)
              }}
            >
              <X className="size-4" />
            </Button>

            <div className="ms-2">
              <h2 className="font-semibold flex items-center gap-2">
                {mode === "recents" && <Clock className="size-4" />}
                {config.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {vehicles.length} locations
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            // className="size-7 sm:hidden"
            onClick={() => {
              setIsSidebarOnLeft(val => !val)
            }}
          >
            {isSidebarOnLeft ? <FiChevronRight className="size-6" /> : <FiChevronLeft className="size-6" />}
          </Button>

        </div>

        <div className="p-2 pt-1 border-b">

          <Tabs defaultValue={selectedStatus} className="w-full mb-1" onValueChange={(value) => setSelectedStatus(value)}>
            <TabsList variant={"line"} className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg">
              <TabsTrigger value="idle"
                className={cn(statusColor["IDLE"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Idle<Badge className="ml-1" variant="secondary">{getStatusCount("IDLE")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="running"
                className={cn(statusColor["RUNNING"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Running<Badge className="ml-1" variant="secondary">{getStatusCount("RUNNING")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="stopped"
                className={cn(statusColor["STOPPED"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Stopped<Badge className="ml-1" variant="secondary">{getStatusCount("STOPPED")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="parked"
                className={cn(statusColor["PARKED"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Parked<Badge className="ml-1" variant="secondary">{getStatusCount("PARKED")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="trip"
                className={cn(statusColor["TRIP"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Trip<Badge className="ml-1" variant="secondary">{getStatusCount("TRIP")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offline"
                className={cn(statusColor["OFFLINE"], "text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm")}>
                Offline<Badge className="ml-1" variant="secondary">{getStatusCount("OFFLINE")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="text-sm px-2 py-1 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                All<Badge className="ml-1" variant="secondary">{vehicles.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // className={cn("pl-8 h-9", searchQuery && "pr-8")}
                className={cn(
                  "pl-8 h-9 rounded-lg bg-background border shadow-sm",
                  searchQuery && "pr-8"
                )}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-9 shrink-0">
                  <ArrowUpDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setSortBy("date-newest")}
                  className="gap-2"
                >
                  <CalendarArrowDown className="size-4" />
                  <span className="flex-1">Newest first</span>
                  {sortBy === "date-newest" && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("date-oldest")}
                  className="gap-2"
                >
                  <CalendarArrowUp className="size-4" />
                  <span className="flex-1">Oldest first</span>
                  {sortBy === "date-oldest" && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("alpha-az")}
                  className="gap-2"
                >
                  <ArrowDownAZ className="size-4" />
                  <span className="flex-1">A to Z</span>
                  {sortBy === "alpha-az" && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("alpha-za")}
                  className="gap-2"
                >
                  <ArrowUpAZ className="size-4" />
                  <span className="flex-1">Z to A</span>
                  {sortBy === "alpha-za" && <Check className="size-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-muted/30 scroll-smooth">
          <div className="p-2 space-y-2">

            {vehicles
              .filter((v) => selectedStatus === 'all' || v.status === selectedStatus.toUpperCase())
              .filter((v) => !searchQuery || v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((location, idx) => {

                const isSelected = selectedLocationId === location.vehicleNo;
                const isRouteActive = routeDestinationId === location.vehicleNo;

                return (
                  <VehicleCard
                    key={location.vehicleNo}
                    location={location}
                    isSelected={isSelected}
                    isRouteActive={isRouteActive}
                    isFollowing={followVehicleId === location.vehicleNo}
                    onClick={() => handleVehicleClick(location)}
                    onFavorite={() => toggleFavorite(location.vehicleNo)}
                    onRoute={() => handleGetVehicleLocationHistory(new MouseEvent("click") as any, location)}
                    onFollow={() =>
                      setFollowVehicle(
                        followVehicleId === location.vehicleNo
                          ? null
                          : location.vehicleNo
                      )
                    }
                  />
                )
              })}

            {true || vehicles
              .filter((v) => selectedStatus === 'all' || v.status === selectedStatus.toUpperCase())
              .filter((v) => !searchQuery || v.vehicleNo.toLowerCase().startsWith(searchQuery.toLowerCase()))
              .map((location, idx) => {
                const category = categories.find(
                  (c) => c.id === location.vehicleNo
                );

                // console.log(selectedLocationId, location.vehicleNo);

                const isSelected = selectedLocationId === location.vehicleNo;
                const isRouteActive = routeDestinationId === location.vehicleNo;

                if (isSelected) {
                  return (
                    <div
                      key={location.vehicleNo}
                      className={cn(
                        "flex flex-col rounded-lg border-2 overflow-hidden",
                        isRouteActive
                          ? "border-green-500 bg-green-500/10"
                          : "border-primary bg-accent/30"
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${category?.color}20` }}
                            >
                              <MapPin
                                className="size-5"
                                style={{ color: category?.color }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">
                                  {location.label}
                                </h3>

                              </div>
                              <p className="text-sm text-muted-foreground">
                                {category?.name}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={handleClose}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {location.date} {location.time} - {location.vehicleNo}
                        </p>

                        <p className="text-sm mb-4">{location.time}</p>

                        <div className="flex items-center flex-wrap gap-4 mb-4">
                          {userLocation && (
                            <div className="flex items-center gap-1.5">
                              <Rocket className="size-4 text-primary" />
                              <span className="font-semibold text-primary">
                                {location.speed} km/h - {location.ignition ? "Ignition ON" : "Ignition OFF"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">
                              {location.signalStrength || "N/A"} dBm
                            </span>
                            <span className="text-sm text-muted-foreground">
                              /5
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="size-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {location.noOfSatellites} satellites
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(location.date + " " + location.time)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <Badge
                            // key={"tag"}
                            variant="secondary"
                            className="text-xs"
                          >
                            {location.batteryType || "Battery info"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(location.vehicleNo);
                            }}
                          >
                            <Heart
                              className={cn(
                                "size-4 mr-2",
                                true && "fill-red-500 text-red-500"
                              )}
                            />
                            {true ? "Unfavorite" : "Favorite"}
                          </Button>
                          <Button
                            size="sm"
                            className={cn(
                              "flex-1",
                              isRouteActive
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            )}
                            // onClick={(e) => handleGetDirections(e, location)}
                            onClick={(e) => handleGetVehicleLocationHistory(e, location)}
                            disabled={isLoadingRoute || isRequestingLocation}
                          >
                            {isLoadingRoute || isRequestingLocation ? (
                              <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                              <Route className="size-4 mr-2" />
                            )}
                            {isRequestingLocation
                              ? "Getting location..."
                              : isRouteActive
                                ? "Clear route"
                                : "Get directions"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }


                return <div
                  key={location.vehicleNo}
                  // className={cn(
                  //   "group flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-colors bg-white hover:bg-accent/50",
                  //   routeDestinationId === location.vehicleNo &&
                  //   "border-green-500 bg-green-500/10"
                  // )}
                  className="group flex flex-col gap-3 rounded-xl border bg-white p-4 transition hover:shadow-md hover:border-primary/40"
                  onClick={() => handleVehicleClick(location)}
                >
                  {/* <div className="flex items-start gap-1"> */}
                  <div className="flex items-start justify-between">
                    <div
                      // className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      // className="flex size-9 shrink-0 items-center justify-center "
                      className="size-10 flex items-center justify-center rounded-lg bg-muted border"
                    >
                      <PiMapPinFill
                        className="size-6"
                        style={{ color: statusColor[location.status] }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* <h3 className="font-medium text-sm truncate"> */}
                        <h3 className="font-semibold text-sm leading-none">
                          {location.label}
                        </h3>

                        {routeDestinationId === location.vehicleNo && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-green-500/20 text-green-600"
                          >
                            Route active
                          </Badge>
                        )}
                      </div>
                      {/* <p className="text-sm text-muted-foreground truncate"> */}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(location.date + " " + location.time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <IoSpeedometer className={`size-4 ${getSpeedColor(location.speed)}`} />
                      <span className="text-xs font-medium">
                        {location.speed} km/h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {userLocation && (
                        <div className="flex items-center gap-1">
                          {location.ignition ? <IoRocketSharp className="size-3.5 text-green-500" /> : <IoRocketSharp className="size-3.5 text-red-500" />}
                          <span className="text-xs text-muted-foreground font-medium">
                            {/* {formatDistance(getDistance(location) || 0)} */}
                            {location.ignition ? "Ignition ON" : "Ignition OFF"}
                          </span>
                        </div>
                      )}
                      {mode === "recents" && (
                        <div className="flex items-center gap-1">
                          <Clock className="size-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(location.date + " " + location.time)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {getSignalStrengthIcon(location.signalStrength)}
                        <span className="text-xs text-muted-foreground">
                          {location.signalStrength} %
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* <LiaSatelliteDishSolid className="size-4 text-muted-foreground" /> */}
                        {getSateliteIcon(location.noOfSatellites)}
                        <span className="text-xs text-muted-foreground">
                          {location.noOfSatellites} satellites
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(location.vehicleNo);
                        }}
                      >
                        <Heart
                          className={cn(
                            "size-4.5",
                            "fill-red-500 text-red-500 shrink-0"
                          )}
                        />

                      </Button>

                      <Link href={"/location-history"}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-8",
                            routeDestinationId === location.vehicleNo && "text-green-500"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            handleGetVehicleLocationHistory(e, location)
                          }}
                        >
                          <Route className="size-3.5" />
                        </Button>
                      </Link>

                    </div>
                  </div>

                  <Badge
                    // key={tag}
                    variant="secondary"
                    className="text-[10px] h-5"
                  >
                    {location.status}
                  </Badge>
                </div>
              })}

          </div>
        </div>
      </div>
    </Draggable >

  );
}
