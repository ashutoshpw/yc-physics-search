import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YC Physics Search | Semantic Startup Discovery',
  description: 'A 2D physics-driven semantic search interface for Y Combinator startups.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-neutral-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
