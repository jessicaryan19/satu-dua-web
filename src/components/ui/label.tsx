"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

type LabelProp = React.ComponentProps<typeof LabelPrimitive.Root> & {
  type?: 'default' | 'defaultMuted' | 'title' | 'subtitle' | 'strong'
}

function Label({
  type = 'default',
  className,
  ...props
}: LabelProp) {
  const style: Record<string, string> = {
    default: "text-md font-medium",
    defaultMuted: "text-md font-medium text-muted-foreground",
    title: "text-2xl font-bold",
    subtitle: "text-lg font-bold",
    strong: "text-4xl font-bold"
  }
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        style[type],
        "flex items-center gap-2 leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
