"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { StopCard } from "./StopCard"
import { Stop } from "@/lib/types"

type SortableItemProps = {
    id: string
    stop: Stop
    index: number
}

export default function SortableItem({ id, stop, index }: SortableItemProps) {

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative transition-shadow ${isDragging ? "shadow-2xl scale-[1.02] z-50" : ""}`}
        >
            {/* Index badge */}
            <div className="absolute -left-1 -top-1 z-10 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {index + 1}
            </div>

            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-3 right-3 z-10 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors"
            >
                <GripVertical size={14} className="text-gray-400" />
            </div>

            <StopCard stop={stop} index={index} />
        </div>
    )
}