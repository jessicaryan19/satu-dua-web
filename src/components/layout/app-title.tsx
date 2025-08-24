"use client"
import { usePathname } from "next/navigation";
import { Label } from "../ui/label";
import { sidebarItems } from "./app-sidebar";
import { Button } from "../ui/button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { signOut } from "@/services/auth-service";

export default function AppTitle() {
    const pathname = usePathname();
    
    // Safely find the sidebar item
    const currentItem = sidebarItems.find(item => item.url === pathname);
    const title = currentItem?.title || "Dashboard";
    
    return (
        <div className="bg-primary p-4 w-full rounded-2xl flex justify-between">
            <Label type="title" className="text-white">{title}</Label>
            <Button className="p-0" onClick={signOut}>
                <Icon icon="material-symbols:logout"/>
            </Button>
        </div>
    )
}