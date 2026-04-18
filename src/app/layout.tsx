import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tash Lashes & Eyebrows",
  description: "Professional mobile-first booking app",
};

export const viewport: Viewport = {
  themeColor: "#7e3e48",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
