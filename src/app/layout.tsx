import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PublicFooter } from "@/components/shared/footer";
import { CookieConsentProvider } from "@/components/cookies/cookie-consent-provider";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_POLICY_VERSION,
} from "@/lib/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DonacionesSaaS | Perfiles de apoyo conectados con Hotmart",
  description: "Crea una página personalizada, añade tus enlaces de Hotmart y comparte una sola URL con tu audiencia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Blocking inline script: executes synchronously before React hydrates.
          Reads the user's saved preference only after preferences consent.
          Falls back to the OS color-scheme preference.
          Falls back to 'light' if neither is available.
          Runs before any CSS paint → zero flash of wrong theme.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var consent = JSON.parse(localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)}) || 'null');
                  var canRememberTheme =
                    consent &&
                    consent.version === ${JSON.stringify(COOKIE_POLICY_VERSION)} &&
                    consent.categories &&
                    consent.categories.preferences === true &&
                    Date.parse(consent.expiresAt) > Date.now();
                  var saved = canRememberTheme ? localStorage.getItem('theme') : null;
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // No saved preference: follow OS
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    }
                    // else: no class added → light mode (default)
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
        <CookieConsentProvider>
          <ThemeProvider>
            {children}
            <PublicFooter />
          </ThemeProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
