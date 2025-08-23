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
        className={`${nunito_sans.className} antialiased w-screen h-screen overflow-hidden`}
      >
        <AuthProvider>

          <SidebarProvider>
            {!isPublic && <AppSidebar />}
            <main className="p-4 w-screen h-screen relative">
              {!isPublic && <AppTitle />}
              <div className="w-full h-full">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
