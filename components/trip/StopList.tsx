"use client"

import { DndContext, closestCenter } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTripStore } from "@/store/trip-store"
import SortableItem from "./SortableItem"
import { MapPin } from "lucide-react"

export default function StopList() {

    const stops = useTripStore(s => s.stops)
    const reorderStops = useTripStore(s => s.reorderStops)

    const handleDragEnd = (event: any): void => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = stops.findIndex(s => s.id === active.id)
        const newIndex = stops.findIndex(s => s.id === over.id)
        reorderStops(oldIndex, newIndex)
    }

    if (stops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                <div className="p-3 bg-gray-100 rounded-full">
                    <MapPin size={18} />
                </div>
                <p className="text-xs font-medium">No stops yet</p>
                <p className="text-[11px] text-center">Click on the route on the map to add stops</p>
            </div>
        )
    }

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={stops} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 pt-2 pb-1">
                    {stops.map((stop, index) => (
                        <SortableItem key={stop.id} id={stop.id} stop={stop} index={index} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}