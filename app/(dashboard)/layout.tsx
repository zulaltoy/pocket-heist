"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import Navbar from "@/components/Navbar";
import RouteLoader from "@/components/RouteLoader";

// hooks
import { useUser } from "@/hooks/useUser";

export default function HeistsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <RouteLoader />;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
