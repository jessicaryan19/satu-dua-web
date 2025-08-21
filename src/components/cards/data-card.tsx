import { Icon } from "@iconify/react/dist/iconify.js";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";

type DataCardProps = {
    title: string,
    value: string,
    icon: string,
    theme?: 'blue' | 'red'
}
export default function DataCard({
    title,
    value,
    icon,
    theme = 'blue'
}: DataCardProps) {
    const themeStyle = {
        blue: {
            label: 'text-primary',
            icon: 'text-accent',
        },
        red: {
            label: 'text-destructive',
            icon: 'text-destructive-accent',
        }
    }
    return (
        <Card className="relative flex-1 overflow-clip">
            <CardContent className="flex flex-col gap-2 py-6">
                <Label type="subtitle" className="z-10">{title}</Label>
                <Label type="strong" className={`z-10 ${themeStyle[theme].label}`}>{value}</Label>
                <Icon icon={icon} className={`absolute right-[-30] bottom-[-20] text-[9rem] ${themeStyle[theme].icon}`} />
            </CardContent>
        </Card>
    )
}