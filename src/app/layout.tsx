import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xero - Hue & You",
  applicationName: "Xero - Hue & You",
  description: "AI colour analysis and personalised palette report.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Xero - Hue & You",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/images/appIcon.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/images/appIcon.png",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#062f48",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
