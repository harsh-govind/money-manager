"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DateTimePicker({ date, setDate }: { date: Date | undefined, setDate: (date: Date | undefined) => void }) {
    const [open, setOpen] = React.useState(false)

    const formatTime = (date: Date | undefined): string => {
        if (!date) return ""
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        return `${hours}:${minutes}:${seconds}`
    }

    const handleTimeChange = (timeString: string) => {
        if (!date) return

        const [hours, minutes, seconds] = timeString.split(':').map(Number)
        const newDate = new Date(date)
        newDate.setHours(hours, minutes, seconds || 0)
        setDate(newDate)
    }

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return

        const newDate = new Date(selectedDate)
        if (date) {
            newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds())
        }
        setDate(newDate)
        setOpen(false)
    }

    return (
        <div className="flex gap-1 justify-between w-full">
            <div className="flex flex-col gap-1 w-1/2">
                <Label htmlFor="date-picker" className="px-1">
                    Date
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
                            className="w-full justify-between font-normal"
                        >
                            {date ? date.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            onSelect={handleDateSelect}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col gap-1 w-1/2">
                <Label htmlFor="time-picker" className="px-1">
                    Time
                </Label>
                <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    value={formatTime(date)}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    )
}
