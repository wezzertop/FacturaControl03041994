import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import BottomNavigation from "@/components/layout/BottomNavigation";
import InstallPrompt from "@/components/pwa/InstallPrompt";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export const metadata: Metadata = {
  title: "FacturaControl - Control Financiero",
  description: "Controla facturas, carteras, préstamos y gastos personales con datos CFDI del SAT.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FacturaControl",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="h-screen overflow-hidden bg-brand-smoke text-brand-carbon dark:bg-brand-carbon dark:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            {user && <SidebarNavigation />}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </main>
            {user && <BottomNavigation />}
            <InstallPrompt />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
