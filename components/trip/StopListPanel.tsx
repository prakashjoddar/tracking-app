import { Button as AntButton, Card } from "antd";
import { Button } from "../ui/button";
import StopList from "./StopList";
import { useTripStore } from "@/store/trip-store";

export default function StopListPanel() {

  const snapToRoute = useTripStore(s => s.snapToRoute)
  const setSnapToRoute = useTripStore(s => s.setSnapToRoute)

  return (
    <div className="flex flex-col h-full">  {/* 👈 full height flex column */}

      {/* HEADER — fixed, never scrolls */}
      <div className="p-4 shrink-0">
        <Card>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">ABC23</span>
            <AntButton color="cyan" variant="solid">Download</AntButton>
            <AntButton color="green" variant="solid">Upload</AntButton>
          </div>

          <div className="flex justify-between text-sm mt-3">
            <Button className="bg-red-600 text-white px-4">Back</Button>

            <Button className="bg-green-700 text-white px-4">Update</Button>
            <button
              type="button"
              onClick={() => setSnapToRoute(!snapToRoute)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors ${snapToRoute
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
            >
              {snapToRoute ? "📍 Snap ON" : "📍 Snap OFF"}
            </button>
          </div>


        </Card>
      </div>

      {/* STOP LIST — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">  {/* 👈 only this scrolls */}
        <StopList />
      </div>

    </div>
  )
}