"use client"

import { Checkbox, Drawer, DrawerProps, Flex, GetProp, Radio, TimePicker, Button as AntBtn } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import dayjs from "dayjs";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "../ui/field";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]

export default function JourneyForm() {


    const options: string[] = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];
    const format = 'HH:mm';

    const [tripType, setTripType] = useState<string>("PICKING");
    const [tripEnable, setTripEnable] = useState<boolean>(true);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const router = useRouter()


    const onChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
        console.log('checked = ', checkedValues);
    };

    const types: CheckboxGroupProps<string>['options'] = [
        { label: 'PICKING', value: 'PICKING' },
        { label: 'DROPPING', value: 'DROPPING' },
    ];
    const states: CheckboxGroupProps<boolean>['options'] = [
        { label: 'ENABLE', value: true },
        { label: 'DISABLE', value: false },
    ];

    const stylesFn: DrawerProps['styles'] = (info) => {
        if (info.props.footer) {
            return {
                header: {
                    padding: 16,
                },
                body: {
                    padding: 16,
                },
                footer: {
                    padding: '10px 10px',
                    backgroundColor: '#fafafa',
                },
            } satisfies DrawerProps['styles'];
        }
        return {};
    };

    const footer: React.ReactNode = (
        <Flex gap="medium" justify="center">
            <AntBtn
                type="primary"
                styles={{ root: { backgroundColor: '#171717' } }}
                onClick={() => setDrawerOpen(true)}
                size="large"
            >
                Submit
            </AntBtn>
        </Flex>
    );

    const sharedProps: DrawerProps = {
        size: 425,
    };

    return (
        <div className="w-full">

            <h2 className="text-xl font-semibold text-center text-gray-600 mb-6">
                Create New Journey
            </h2>

            <div className="grid grid-cols-[180px_1fr] gap-y-4 gap-x-4 items-center">

                <span className="text-[15px] text-end">Trip Id:</span>
                <Input
                    disabled
                    placeholder="trip id"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Trip Name:</span>
                <Input
                    placeholder="trip name"
                    className="border p-1.5 rounded w-full"
                />

                <span className="text-[15px] text-end">Trip State:</span>
                <div className="flex gap-2">
                    <Badge variant="outline">CREATED</Badge>
                    <Badge className="bg-amber-500">INITIALIZED</Badge>
                    <Badge className="bg-green-500">COMPLETED</Badge>
                </div>

                <span className="text-[15px] text-end">Trip State:</span>
                <Radio.Group
                    options={states}
                    value={tripEnable}
                    optionType="button"
                    buttonStyle="solid"
                    onChange={e => setTripEnable(e.target.value)}
                />

                <span className="text-[15px] text-end">Trip Type:</span>
                <Radio.Group
                    options={types}
                    value={tripType}
                    optionType="button"
                    buttonStyle="solid"
                    onChange={e => setTripType(e.target.value)}
                />

                <span className="text-[15px] text-end">Time:</span>
                <div className="flex gap-3">
                    <TimePicker
                        placeholder="Start Time"
                        defaultValue={dayjs('06:00', format)}
                        format={format}
                    />
                    <TimePicker
                        placeholder="End Time"
                        defaultValue={dayjs('18:00', format)}
                        format={format}
                    />
                </div>

                <span className="text-[15px] text-end">Working Days:</span>
                <Checkbox.Group
                    options={options}
                    defaultValue={options.filter(v => v !== "Saturday" && v !== "Sunday")}
                    onChange={onChange}
                />

                <span className="text-[15px] text-end">Add Staff:</span>
                <Button variant="outline" onClick={() => setDrawerOpen(true)}>Add (122)</Button>
                <br />
                <p>(Note: Add student, assign class group, normal group)</p>

                <Drawer
                    {...sharedProps}
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
                                    <Checkbox id="toggle-checkbox-1" name="toggle-checkbox-1" />
                                    <FieldContent>
                                        <FieldTitle>Student 1</FieldTitle>
                                        <FieldDescription>
                                            XII - ABC123
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>
                            </FieldLabel>
                            <FieldLabel>
                                <Field orientation="horizontal">
                                    <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
                                    <FieldContent>
                                        <FieldTitle>Student 2</FieldTitle>
                                        <FieldDescription>
                                            XII - ABC123
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>
                            </FieldLabel>
                            <FieldLabel >
                                <Field orientation="horizontal" className="w-full">
                                    <Checkbox id="toggle-checkbox-3" name="toggle-checkbox-3" />
                                    <FieldContent>
                                        <FieldTitle>Student 3</FieldTitle>
                                        <FieldDescription>
                                            XII - ABC123
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>
                            </FieldLabel>
                        </FieldGroup>
                    </div>
                </Drawer>


                {false && <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">Add (122)</Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Select Students</SheetTitle>
                            {/* <SheetDescription>
                                Make changes to your profile here. Click save when you&apos;re done.
                            </SheetDescription> */}
                        </SheetHeader>
                        <div className="grid flex-1 auto-rows-min gap-6 px-4">
                            <FieldGroup className="max-w-sm gap-3">
                                <FieldLabel>
                                    <Field orientation="horizontal">
                                        <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
                                        <FieldContent>
                                            <FieldTitle>Student 1</FieldTitle>
                                            <FieldDescription>
                                                XII - ABC123
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldLabel>
                                <FieldLabel>
                                    <Field orientation="horizontal">
                                        <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
                                        <FieldContent>
                                            <FieldTitle>Student 2</FieldTitle>
                                            <FieldDescription>
                                                XII - ABC123
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldLabel>
                                <FieldLabel>
                                    <Field orientation="horizontal">
                                        <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
                                        <FieldContent>
                                            <FieldTitle>Student 3</FieldTitle>
                                            <FieldDescription>
                                                XII - ABC123
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldLabel>
                            </FieldGroup>
                        </div>
                        <SheetFooter>
                            <Button type="submit">Save changes</Button>
                            <SheetClose asChild>
                                <Button variant="outline">Close</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>}

            </div>

            <div className="flex justify-center mt-5 gap-5">
                <Button className="bg-red-600 text-white px-4 py-2 rounded">
                    Clear
                </Button>
                <Button className="bg-cyan-600 text-white px-4 py-2 rounded">
                    Create Journey
                </Button>
                <Button className="bg-green-700 text-white px-4 py-2 rounded"
                    onClick={() => {
                        router.push("/trip/stop")
                    }}>
                    Edit Stops
                </Button>
            </div>

        </div >

    )
}