import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Forma — Treino, Nutrição e Bem-estar",
    template: "%s · Forma",
  },
  description:
    "Um plano de treino desenhado para a sua vida: onboarding inteligente, fichas editáveis, execução explicada, nutrição e progresso em um só lugar.",
  applicationName: "Forma",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    title: "Forma",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e08" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${instrument.variable}`}
    >
      <body className="min-h-dvh bg-canvas antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ServiceWorkerRegistration />
          <Toaster
            position="top-center"
            theme="dark"
            closeButton
            toastOptions={{
              className: "font-sans",
              classNames: {
                toast: "!rounded-2xl !border !border-white/10",
                description: "!text-cream/60",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
