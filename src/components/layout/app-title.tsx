"use client"
import { usePathname } from "next/navigation";
import { Label } from "../ui/label";
import { sidebarItems } from "./app-sidebar";

export default function AppTitle() {
    const pathname = usePathname();
    return (
        <div className="bg-primary p-4 w-full rounded-2xl">
            <Label type="title" className="text-white">{sidebarItems[sidebarItems.findIndex(item => item.url === pathname)].title ?? ''}</Label>
        </div>
    )
}