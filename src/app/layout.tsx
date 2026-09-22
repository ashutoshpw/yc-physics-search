import type { Metadata } from 'next';
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'YC Physics Search | Semantic Startup Discovery',
  description: 'A 2D physics-driven semantic search interface for Y Combinator startups.',
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme-preference');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased overflow-hidden">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
