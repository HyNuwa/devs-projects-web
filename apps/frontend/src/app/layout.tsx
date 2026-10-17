import type { Metadata } from 'next';
import { Caveat, Figtree } from 'next/font/google';
import './globals.css';
import { SkipLink } from '@/components/layout/SkipLink';
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
        <SkipLink />
        <ToastProvider>
          <AuthInitializer />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
