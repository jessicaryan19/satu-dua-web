"use client";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import AppTitle from "@/components/layout/app-title";
import AuthProvider from "@/hooks/use-auth";
import { usePathname } from "next/navigation";

const nunito_sans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  const isPublic = path === "/sign-in"
  return (
    <html lang="en">
      <body
        className={`${nunito_sans.className} antialiased`}
      >
        <AuthProvider>
          <SidebarProvider>
            {!isPublic && <AppSidebar />}
            <main className="w-screen h-screen overflow-hidden">
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="pt-4 px-4">
                  {!isPublic && <AppTitle />}
                </div>
                <div className="flex-1 py-4 pr-4 overflow-hidden">
                  {children}
                </div>
              </div>
            </main>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
