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
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Label } from "../ui/label";

type SidebarItem = {
  title: string,
  url: string,
  icon: string
}

const items: SidebarItem[] = [
  {
    title: "Beranda",
    url: "#",
    icon: "material-symbols:home-rounded",
  },
  {
    title: "Laporan",
    url: "#",
    icon: "mingcute:paper-fill",
  },
  {
    title: "Statistik",
    url: "#",
    icon: "bi:bar-chart-fill",
  },
]

export default function AppSidebar() {
  const [active, setActive] = useState("Beranda");

  return (
    <Sidebar className="rounded-2xl">
      <SidebarHeader className="flex p-5">
        <Image
          src="/logo-satudua.svg"
          alt="Satudua."
          width={200}
          height={50}
        />
      </SidebarHeader>
      <SidebarContent className="pt-10">
        <SidebarMenu className="flex ps-5 gap-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={active === item.title} className={cn(
                "px-4 py-6 rounded-r-none rounded-l-2xl",
                active === item.title && "relative overflow-visible rounded-r-none\
                before:content-[''] before:h-8 before:w-10 before:absolute before:top-[-32] before:right-0 \
                before:rounded-br-2xl before:shadow-[0_15px_0_0_#fff]\
                after:content-[''] after:h-8 after:w-10 after:absolute after:bottom-[-32] after:right-0 \
                after:rounded-tr-2xl after:shadow-[0_-15px_0_0_#fff]",

              )}>
                <a href={item.url} onClick={() => setActive(item.title)}>
                  <Icon icon={item.icon} />
                  <Label type='subtitle'>{item.title}</Label>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}