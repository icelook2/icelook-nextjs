import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages } from "next-intl/server";
import { CookieConsentProvider } from "@/components/cookie-consent-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { NavigationProvider } from "@/components/navigation-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getLocale } from "@/i18n/get-locale";
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
  title: "Icelook - Your Beauty Services",
  description: "Find and book beauty appointments with ease",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div id="root">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocaleProvider locale={locale} messages={messages} timeZone="UTC">
              <CookieConsentProvider>
                <NavigationProvider>{children}</NavigationProvider>
              </CookieConsentProvider>
            </LocaleProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
