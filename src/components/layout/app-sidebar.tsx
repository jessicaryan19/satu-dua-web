"use client"
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
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
import Link from "next/link";

type SidebarItem = {
  title: string,
  url: string,
  icon: string
}

export const sidebarItems: SidebarItem[] = [
  {
    title: "Beranda",
    url: "/",
    icon: "material-symbols:home-rounded",
  },
  {
    title: "Laporan",
    url: "/report",
    icon: "mingcute:paper-fill",
  },
  {
    title: "Statistik",
    url: "/statistic",
    icon: "bi:bar-chart-fill",
  },
]

export default function AppSidebar() {
  const pathname = usePathname();

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
      <SidebarContent className="pt-10 overflow-hidden">
        <SidebarMenu className="relative flex ps-5 gap-2">
          <div className="absolute w-full pe-5">
            <div className={cn(
              "relative w-full h-14 bg-white rounded-r-none rounded-l-2xl\
              before:content-[''] before:h-8 before:w-10 before:absolute before:top-[-32] before:right-0 before:rounded-br-2xl before:shadow-[10px_10px_0_0_#fff]",
              "after:content-[''] after:h-8 after:w-10 after:absolute after:bottom-[-32] after:right-0 after:rounded-tr-2xl after:shadow-[10px_-10px_0_0_#fff]",
              "transition-transform duration-300 ease-in-out"
            )}
            style={{
              transform: `translateY(${sidebarItems.findIndex(item => item.url === pathname) * 4}rem)`
            }}/>
          </div>

          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.url === pathname} className={cn("relative px-4 py-7 transition-colors duration-300 ease-in-out")}>
                <Link href={item.url}>
                  <Icon icon={item.icon} />
                  <Label type="subtitle">{item.title}</Label>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}