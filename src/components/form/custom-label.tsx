import { LabelProps } from "@radix-ui/react-label"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"

type CustomLabelProps = LabelProps & {
    type?: 'default' | 'title' | 'subtitle'
}

export default function CustomLabel({
    type = 'default',
    ...props
}: CustomLabelProps) {
    const style: Record<string, string> = {
        default: "",
        title: "text-4xl font-bold",
        subtitle: "text-lg"
    }
    return (
        <Label {...props} className={cn(style[type], props.className, "block")} />
    )
}