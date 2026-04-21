import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tash Lashes - קביעת תורים",
  description: "Tash Lashes - קביעת תורים",
  icons: {
    icon: "/icon?v=2",
    shortcut: "/icon?v=2",
    apple: "/icon?v=2",
  },
  openGraph: {
    title: "Tash Lashes - קביעת תורים",
    description: "Tash Lashes - קביעת תורים",
    images: ["/opengraph-image?v=4"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tash Lashes - קביעת תורים",
    description: "Tash Lashes - קביעת תורים",
    images: ["/opengraph-image?v=4"],
  },
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
