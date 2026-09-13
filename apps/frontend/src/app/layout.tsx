import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

// Body and display type use the native Pixel Notebook stacks (canonical --pn-font-*
// tokens, aliased in globals.css). The legacy pixel face is the only webfont,
// and this is the single source of `--font-pixel`.
const pressStart2P = Press_Start_2P({
  variable: '--font-pixel',
  weight: '400',
  subsets: ['latin'],
  fallback: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  title: 'DevsProject · Comunidad FI UNJu',
  description: 'Parciales, apuntes y experiencias de estudiantes de FI · UNJu.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={pressStart2P.variable}>
      <body>
        <a
          className="sr-only fixed left-4 top-4 z-[100] border border-primary bg-background px-4 py-3 font-sans text-sm font-bold text-primary shadow-surface focus:not-sr-only focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="#main-content"
        >
          Saltar al contenido principal
        </a>
        <ToastProvider>
          <AuthInitializer />
          <Navbar />
          <main className="main-content" id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
