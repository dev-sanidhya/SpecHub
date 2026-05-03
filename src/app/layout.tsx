import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "SpecHub - Version Control for Product Docs",
  description:
    "Propose, review, and approve changes to your PRDs like your devs ship code. GitHub for product specifications.",
  keywords: ["PRD", "product requirements", "version control", "product management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorBackground: "#111114",
          colorInputBackground: "#18181c",
          colorInputText: "#f2f2f5",
          colorText: "#f2f2f5",
          colorTextSecondary: "#a0a0b0",
          colorPrimary: "#6366f1",
          colorDanger: "#ef4444",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-[#111114] border border-[#2a2a32]",
          headerTitle: "text-[#f2f2f5]",
          headerSubtitle: "text-[#a0a0b0]",
          socialButtonsBlockButton:
            "bg-[#18181c] border border-[#2a2a32] text-[#f2f2f5] hover:bg-[#222228]",
          formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
          footerActionLink: "text-indigo-400 hover:text-indigo-300",
          identityPreviewText: "text-[#f2f2f5]",
          formFieldInput:
            "bg-[#18181c] border-[#2a2a32] text-[#f2f2f5] focus:border-indigo-500",
          dividerLine: "bg-[#2a2a32]",
          dividerText: "text-[#606070]",
        },
      }}
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
        <body className="min-h-full antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
