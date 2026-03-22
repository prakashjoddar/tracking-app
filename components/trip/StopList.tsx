"use client"

import { DndContext, closestCenter } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTripStore } from "@/store/trip-store"
import SortableItem from "./SortableItem"

export default function StopList() {
    const stops = useTripStore(s => s.stops)             // 👈 from store
    const reorderStops = useTripStore(s => s.reorderStops)

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = stops.findIndex(s => s.id === active.id)
        const newIndex = stops.findIndex(s => s.id === over.id)

        reorderStops(oldIndex, newIndex)   // 👈 updates store → map re-syncs via syncStops effect
    }

    if (stops.length === 0) {
        return (
            <p className="text-sm text-gray-400 text-center mt-6">
                Click on the route to add stops
            </p>
        )
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext items={stops} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mt-3">
                    {stops.map((stop, index) => (
                        <SortableItem key={stop.id} id={stop.id} stop={stop} index={index} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}