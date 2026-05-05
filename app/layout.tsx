import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "SPADT Thailand — Member Management System",
  description: "ระบบจัดการสมาชิก สมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SPADT",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1e3f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
      <Script id="register-sw" strategy="afterInteractive">{`
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }
      `}</Script>
    </html>
  );
}
