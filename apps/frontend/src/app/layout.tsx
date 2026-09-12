import type { Metadata } from 'next';
import { Inter, Outfit, Press_Start_2P } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
});

const pressStart2P = Press_Start_2P({
  variable: '--font-pixel',
  weight: '400',
  subsets: ['latin'],
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
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${pressStart2P.variable}`}>
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
