
import type React from "react"
import { Home, FileText, BarChart3 } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

// Menu items matching the image
const items = [
  {
    title: "Beranda",
    url: "/",
    icon: Home,
  },
  {
    title: "Laporan",
    url: "/laporan",
    icon: FileText,
  },
  {
    title: "Statistik",
    url: "/statistik",
    icon: BarChart3,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <div className=" h-full ">
      <Sidebar {...props} className="border-0 bg-transparent ">
        <SidebarHeader className=" pb-4 bg-transparent">
          <div className="px-4 py-3">
            <h1 className="text-2xl font-bold text-white">Satudua.</h1>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 pt-6 pr-0 bg-transparent ">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-5 ">
                {items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title} className={`sidebar-menu-item ${isActive ? "active" : ""}`}>
                      {isActive && <div className="curved-top"></div>}
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="h-12 font-medium relative border-0 outline-0 text-white hover:bg-white/10 focus:bg-white/10 active:bg-white/20 transition-colors"
                      >
                        <Link href={item.url} className="flex items-center gap-3 px-4 border-0 outline-0">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {isActive && <div className="curved-bottom"></div>}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

      </Sidebar>
    </div>
  )
}

