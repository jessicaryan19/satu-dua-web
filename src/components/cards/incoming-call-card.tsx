import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export default function IncomingCallCard() {
    return (
        <div className="w-full h-full bg-destructive-accent rounded-2xl border-2 border-destructive overflow-hidden relative animate-[blink-shadow_1s_infinite]">
            <Image
                className="object-cover flex-1"
                src="/call-pattern.svg"
                alt=""
                fill
            />
            <div className="absolute inset-0 bg-destructive mix-blend-screen" />
            <div className="absolute w-full h-full flex flex-col gap-10 justify-center items-center">
                <div className="flex flex-col gap-4 justify-center items-center">
                    <div className="w-fit h-fit bg-accent rounded-full">
                        <Icon icon="gg:profile" className="text-9xl text-info" />
                    </div>
                    <Label className="text-black" type="strong">Wilbert Chandra</Label>
                    <Label className="text-black" type="subtitle">089530069830</Label>
                </div>
                <Button variant="success" className="p-6">
                    <Icon icon="ion:call" className="text-9xl" />
                    <Label type="subtitle">Angkat</Label>
                </Button>
            </div>
        </div>
    )
}