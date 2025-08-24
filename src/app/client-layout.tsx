"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import AppTitle from "@/components/layout/app-title";
import AuthProvider from "@/hooks/use-auth";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const isPublic = path === "/sign-in";

  return (
    <AuthProvider>
      <SidebarProvider>
        {!isPublic && <AppSidebar />}
        <main className="w-screen h-screen overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden">
            {!isPublic && (
              <div className="pt-4 px-4">
                <AppTitle />
              </div>
            )}
            <div className="flex-1 py-4 pr-4 overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
