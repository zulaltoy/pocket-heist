"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import RouteLoader from "@/components/RouteLoader";

// hooks
import { useUser } from "@/hooks/useUser";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/heists");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <RouteLoader />;
  }

  return <main className="public">{children}</main>;
}
