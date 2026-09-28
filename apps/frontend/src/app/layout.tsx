import type { Metadata } from 'next';
import { Caveat, Figtree } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

// Figtree carries every piece of interface text; Caveat is only for handwritten
// accents. Both are variable fonts, self-hosted by next/font and exposed as the
// variables that --dp-font-sans and --dp-font-hand in styles/tokens.css consume.
const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  display: 'swap',
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
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
    <html lang="es" className={`${figtree.variable} ${caveat.variable}`}>
      <body>
        <a
          className="sr-only fixed left-4 top-4 z-[100] border border-primary bg-background px-4 py-3 font-sans text-sm font-bold text-primary focus:not-sr-only focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
