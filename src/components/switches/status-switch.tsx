"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"
import { Label } from "../ui/label"

function StatusSwitch({
    checked,
    className,
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            checked={checked}
            className={cn(
                "peer relative w-48 h-10 data-[state=checked]:bg-secondary data-[state=unchecked]:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-primary/80 inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all duration-300 ease-in-out outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            <Label className={`absolute text-primary-foreground block ${checked ? "ps-10" : "ps-10"}`}>
                {checked ? "Tidak Tersedia" : "Sedang Bertugas"}
            </Label>
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "absolute bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-6 rounded-full ring-0 transition-transform duration-300 ease-in-out data-[state=checked]:translate-x-40 data-[state=unchecked]:translate-x-2"
                )}
            />
        </SwitchPrimitive.Root>
    )
}

export { StatusSwitch }
