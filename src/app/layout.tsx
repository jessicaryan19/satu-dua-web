"use client" // Convert this to a Client Component

import type React from "react"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation" // Import the usePathname hook
import "./globals.css"
import { AppSidebar } from "@/components/Sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

// Note: You can no longer export static metadata from this file because it's now a Client Component.
// You should move the `metadata` object to your specific page files (e.g., app/page.tsx)
// or a parent server-only layout file.
/*
export const metadata: Metadata = {
  title: "Satudua Dashboard",
  description: "Dashboard aplikasi Satudua",
}
*/

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current URL pathname
  const pathname = usePathname()

  // Define the path where you don't want the sidebar.
  // I'm assuming '/sign-in', but you can change it to your actual route.
  const noSidebarLayout = pathname === "/sign-in"

  return (
    <html lang="id">
      <body className={inter.className}>
        {noSidebarLayout ? (
          // If it's the sign-in page, render only the page content
          <>{children}</>
        ) : (
          // For all other pages, render the layout with the sidebar
          <SidebarProvider>
            <AppSidebar className="shadow-lg" />
            <SidebarInset className="flex-1 bg-white main-content-container">
              <header className="flex h-16 shrink-0 items-center gap-2 px-6 header-override">
                <div className="text-gray-800">
                  <h2 className="text-lg font-semibold">Dashboard</h2>
                </div>
              </header>
              <main className="flex-1 p-6 bg-white">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        )}
      </body>
    </html>
  )
}
