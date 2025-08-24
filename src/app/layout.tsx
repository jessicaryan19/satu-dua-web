import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./client-layout";

const nunito_sans = Nunito_Sans({
  variable: "--font-nunito-sans", 
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Satu Dua Web",
  description: "Emergency Call Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito_sans.className} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}