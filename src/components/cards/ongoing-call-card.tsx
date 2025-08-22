import { Icon } from "@iconify/react/dist/iconify.js";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Pause } from "lucide-react";

export default function OngoingCallCard() {
    return (
        <div className="w-full bg-destructive-accent flex p-6 rounded-2xl justify-between items-center">
            <div className="flex gap-4">
                <div className="w-fit h-fit bg-accent rounded-full">
                    <Icon icon="gg:profile" className="text-5xl text-info" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label type="subtitle">Wilbert Chandra</Label>
                    <Label>089530069830</Label>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
                <Label type="subtitle">00:11:45</Label>
                <div className="flex gap-2">
                    <Button variant="info" className="w-10 h-10 rounded-full">
                        <Icon icon="material-symbols:pause"/>
                    </Button>
                     <Button variant="info_outline" className="w-10 h-10 rounded-full">
                        <Icon icon="vaadin:mute"/>
                    </Button>
                     <Button variant="secondary" className="w-10 h-10 rounded-full">
                        <Icon icon="solar:end-call-bold"/>
                    </Button>
                </div>
            </div>
        </div>
    )
}