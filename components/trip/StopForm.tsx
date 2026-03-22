"use client"

import { Button as AntBtn, Checkbox, Drawer, DrawerProps, Flex, Radio } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useTripStore } from "@/store/trip-store"
import { Stop } from "@/lib/types"

type StopFormProps = {
    setShowMap: (value: boolean) => void
}

export default function StopForm({ setShowMap }: StopFormProps) {

    const stops = useTripStore(s => s.stops)
    const editingStopId = useTripStore(s => s.editingStopId)
    const updateStop = useTripStore(s => s.updateStop)
    const setEditingStopId = useTripStore(s => s.setEditingStopId)

    const editingStop = stops.find(s => s.id === editingStopId) ?? null

    // controlled form state
    const [name, setName] = useState<string>("")
    const [lat, setLat] = useState<string>("")
    const [lng, setLng] = useState<string>("")
    const [stopType, setStopType] = useState<Stop["type"]>("point")
    const [enabled, setEnabled] = useState<boolean>(true)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

    // fill form when editing stop changes
    useEffect(() => {
        if (editingStop) {
            setName(editingStop.name)
            setLat(String(editingStop.latitude))
            setLng(String(editingStop.longitude))
            setStopType(editingStop.type)
            setEnabled(editingStop.enabled)
        }
    }, [editingStopId])

    const handleUpdate = (): void => {
        if (!editingStopId) return

        updateStop(editingStopId, {
            name,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            type: stopType,
            enabled,
        })

        setEditingStopId(null)
        setShowMap(true)      // back to map
    }

    const handleClose = (): void => {
        setEditingStopId(null)
        setShowMap(true)      // back to map without saving
    }

    const states: CheckboxGroupProps<boolean>["options"] = [
        { label: "ENABLE", value: true },
        { label: "DISABLE", value: false },
    ]

    const stylesFn: DrawerProps["styles"] = (info) => {
        if (info.props.footer) {
            return {
                header: { padding: 16 },
                body: { padding: 16 },
                footer: { padding: "10px 10px", backgroundColor: "#fafafa" },
            } satisfies DrawerProps["styles"]
        }
        return {}
    }

    const footer: React.ReactNode = (
        <Flex gap="medium" justify="center">
            <AntBtn
                type="primary"
                styles={{ root: { backgroundColor: "#171717" } }}
                onClick={() => setDrawerOpen(false)}
                size="large"
            >
                Submit
            </AntBtn>
        </Flex>
    )

    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold text-center text-gray-600 mb-6 w-full">
                Edit Stop
            </h2>

            <div className="grid grid-cols-[180px_1fr] gap-y-4 gap-x-4 items-center">

                <span className="text-[15px] text-end">Stop Id:</span>
                <Input
                    disabled
                    value={editingStopId ?? ""}
                    placeholder="stop id"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Stop Name:</span>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="stop name"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Stop Latitude:</span>
                <Input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="latitude"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Stop Longitude:</span>
                <Input
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="longitude"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Stop Type:</span>
                <FieldGroup className="w-full">
                    <Field orientation="horizontal">
                        <Select
                            value={stopType}
                            onValueChange={(v) => setStopType(v as Stop["type"])}
                        >
                            <SelectTrigger className="w-[50%]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectGroup>
                                    <SelectItem value="bus">Bus Stop</SelectItem>
                                    <SelectItem value="point">Drop / Picking Point</SelectItem>
                                    <SelectItem value="institute">Institute</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>

                <span className="text-[15px] text-end">Stop State:</span>
                <Radio.Group
                    options={states}
                    value={enabled}
                    optionType="button"
                    buttonStyle="solid"
                    onChange={(e) => setEnabled(e.target.value)}
                />

                <Drawer
                    size={425}
                    footer={footer}
                    title="Select Students"
                    styles={stylesFn}
                    mask={{ enabled: true, blur: true }}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    destroyOnHidden={false}
                >
                    <div className="w-full">
                        <FieldGroup className="max-w-sm gap-3">
                            <FieldLabel>
                                <Field orientation="horizontal">
                                    <Checkbox id="toggle-checkbox-1" />
                                    <FieldContent>
                                        <FieldTitle>Student 1</FieldTitle>
                                        <FieldDescription>XII - ABC123</FieldDescription>
                                    </FieldContent>
                                </Field>
                            </FieldLabel>
                        </FieldGroup>
                    </div>
                </Drawer>

            </div>

            <div className="flex justify-center mt-5 gap-5">
                <Button
                    className="bg-green-700 text-white px-4 py-2 rounded"
                    onClick={handleUpdate}
                >
                    Update
                </Button>
                <Button
                    className="bg-red-600 text-white px-4 py-2 rounded"
                    onClick={handleClose}
                >
                    Close
                </Button>
            </div>
        </div>
    )
}