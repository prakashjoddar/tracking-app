"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
    label: string
    value: string
    subLabel?: string
    icon?: React.ReactNode
}

interface Props {
    options: Option[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    allowDeselect?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option",
    allowDeselect = false,
}: Props) {

    const [open, setOpen] = React.useState(false)

    const selected = options.find((o) => o.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>

                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2 truncate">
                        {selected ? (
                            <>
                                {selected.icon && <div className="shrink-0">{selected.icon}</div>}
                                <span className="truncate">{selected.label}</span>
                                {selected.subLabel && (
                                    <span className="text-[10px] text-muted-foreground opacity-70 ml-1">
                                        ({selected.subLabel})
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>

                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>

            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command className="w-full">
                    <CommandInput placeholder="Search..." className="h-9" />
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={`${option.label} ${option.subLabel || ""}`}
                                onSelect={() => {
                                    const next = allowDeselect && option.value === value ? "" : option.value
                                    onChange?.(next)
                                    setOpen(false)
                                }}
                                className="flex items-center px-3 py-2 cursor-pointer"
                            >
                                <div className="flex items-center flex-1 min-w-0 gap-3">
                                    <div className={cn(
                                        "flex size-4 items-center justify-center rounded-sm border",
                                        value === option.value ? "bg-blue-600 border-blue-600" : "opacity-50"
                                    )}>
                                        <Check className={cn(
                                            "size-3 text-white",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )} />
                                    </div>
                                    
                                    {option.icon && (
                                        <div className="shrink-0 text-muted-foreground group-hover:text-blue-500 transition-colors">
                                            {option.icon}
                                        </div>
                                    )}

                                    <div className="flex flex-col min-w-0">
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            value === option.value ? "text-blue-600" : "text-slate-700"
                                        )}>
                                            {option.label}
                                        </span>
                                        {option.subLabel && (
                                            <span className="text-[10px] text-slate-400 font-mono truncate uppercase tracking-tighter">
                                                {option.subLabel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>

        </Popover>
    )
}
