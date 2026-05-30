import type { Metadata } from "next";

import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "BookBridge",
  description: "Community-based second-hand book sharing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
