import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FacturaControl - SaaS Financiero",
  description: "Controla tus finanzas personales conectando con el SAT.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {user && <SidebarNavigation />}
          <main className={user ? "flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0" : "flex-1 overflow-y-auto"}>
            {children}
          </main>
          {user && <BottomNavigation />}
        </ThemeProvider>
      </body>
    </html>
  );
}
