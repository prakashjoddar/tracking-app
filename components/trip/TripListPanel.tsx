import { useState } from "react";
import { SearchableSelect } from "../ui/searchable-select";
import { TripCard } from "./TripCard";

export default function TripListPanel() {

  const [vehicle, setVehicle] = useState<string>("")


  return (
    <div className="space-y-4">

      {/* Vehicle Search */}
      <SearchableSelect
        options={[
          { label: "AP28TD7553", value: "AP28TD7553" },
          { label: "MH12AB2345", value: "MH12AB2345" },
          { label: "DL8CAF1234", value: "DL8CAF1234" },
        ]}
        value={vehicle}
        onChange={(val) => setVehicle(val)}
        placeholder="Select vehicle"
      />

      {/* Trip Cards */}
      <div className="space-y-3">

        <TripCard
          route="TEST"
          type="PICKING"
          stops={0}
          passengers={0}
        />

        <TripCard
          route="TRIAL ROUTE"
          type="PICKING"
          stops={5}
          passengers={0}
        />

      </div>

    </div>
  )
}