"use client";

import { useAuth } from "@/hooks/use-auth"; // Adjust path if needed
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading state is resolved
    if (isLoading) {
      return;
    }

    // If there is no session, redirect to the login page
    if (!session) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  // While loading, you can show a spinner or a blank screen
  if (isLoading || !session) {
    return <div>Loading...</div>; // Or a loading component
  }

  // If a session exists, render the child pages
  return <>{children}</>;
}
