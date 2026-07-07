import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { PwaProvider } from "@/components/pwa-provider";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  weight: "variable",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

const siteTitle = "Água Pura — Uma onda de jovens transformando o mundo";
const siteDescription =
  "Doe ao movimento Água Pura e ajude a formar jovens com propósito, pureza e impacto social em 6 países.";
const ogDescription =
  "Sua doação forma jovens com propósito, pureza e responsabilidade social.";
const ogImage =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/062a1507-f67a-4d17-a837-07298dfd864f/id-preview-4435ff7c--cf8a61b8-da7c-405a-8496-391f50a552e5.lovable.app-1780430246026.png";

const libraryAppName = "Biblioteca Água Pura";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  applicationName: libraryAppName,
  authors: [{ name: "Água Pura" }],
  appleWebApp: {
    capable: true,
    title: libraryAppName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: siteTitle,
    description: ogDescription,
    type: "website",
    images: [{ url: ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a4d7a",
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
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaProvider>
          <Providers>{children}</Providers>
        </PwaProvider>
      </body>
    </html>
  );
}
