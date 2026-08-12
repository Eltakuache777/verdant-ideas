import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Verdant Ideas — AI-Powered Product Design",
  description:
    "Turn a photo, sketch, or description into an editable 3D concept, ready for manufacturing.",
  openGraph: {
    title: "Verdant Ideas — AI-Powered Product Design",
    description:
      "Turn a photo, sketch, or description into an editable 3D concept, ready for manufacturing.",
    siteName: "Verdant Ideas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdant Ideas — AI-Powered Product Design",
    description:
      "Turn a photo, sketch, or description into an editable 3D concept, ready for manufacturing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
