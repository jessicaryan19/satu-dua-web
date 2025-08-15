"use client"
import { BarChart3, FileText, Home } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import CustomLabel from "../form/custom-label"
import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Beranda",
    url: "#",
    icon: Home,
  },
  {
    title: "Laporan",
    url: "#",
    icon: FileText,
  },
  {
    title: "Statistik",
    url: "#",
    icon: BarChart3,
  },
]

export default function AppSidebar() {
  const [active, setActive] = useState("Beranda");

  return (
    <Sidebar>
      <SidebarHeader className="flex p-5">
        <CustomLabel type='title'>Satudua.</CustomLabel>
      </SidebarHeader>
      <SidebarContent className="pt-10">
        <SidebarMenu className="flex ps-5 gap-4">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={active === item.title} className={cn(
                "p-5 rounded-r-none",
                active === item.title && "relative overflow-visible rounded-r-none\
                before:content-[''] before:h-8 before:w-10 before:absolute before:top-[-32] before:right-0 \
                before:rounded-br-xl before:shadow-[0_15px_0_0_#fff]\
                after:content-[''] after:h-8 after:w-10 after:absolute after:bottom-[-32] after:right-0 \
                after:rounded-tr-xl after:shadow-[0_-15px_0_0_#fff]",

              )}>
                <a href={item.url} onClick={() => setActive(item.title)}>
                  <item.icon />
                  <CustomLabel type='default'>{item.title}</CustomLabel>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}