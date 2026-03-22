"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "antd"
import { GripVertical } from "lucide-react"
import { StopCard } from "./StopCard"

export default function SortableItem({ id, stop, index }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style}
            className={`transition-shadow ${isDragging ? "shadow-2xl scale-[1.02]" : ""}`}>
            <Badge.Ribbon text={index + 1}>
                <div className="relative">

                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing z-10"
                    >
                        <GripVertical size={18} />
                    </div>

                    <StopCard stop={stop} index={index} />
                </div>
            </Badge.Ribbon>
        </div>
    )
}