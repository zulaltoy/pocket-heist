import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Pocket Heist",
  description: "Tiny missions. Big office mischief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
