import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";

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

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  authors: [{ name: "Água Pura" }],
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
