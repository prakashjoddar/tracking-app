"use client"

import { useCallback } from "react"

type RouteSliderProps = {
    progress: number                        // 0 to 1
    onChange: (progress: number) => void
}

export function RouteSlider({ progress, onChange }: RouteSliderProps) {

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(parseFloat(e.target.value))
    }, [onChange])

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[360px]">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-5 py-3 shadow-lg flex items-center gap-3">

                {/* Start dot */}
                <div className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-white shrink-0" />

                {/* Slider */}
                <div className="relative flex-1 flex items-center">
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={progress}
                        onChange={handleChange}
                        className="w-full h-[3px] appearance-none rounded-full outline-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #22d3ee ${progress * 100}%, #e5e7eb ${progress * 100}%)`
                        }}
                    />
                </div>

                {/* End dot */}
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white shrink-0" />

            </div>
        </div>
    )
}