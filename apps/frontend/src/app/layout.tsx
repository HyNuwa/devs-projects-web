import type { Metadata } from 'next';
import { Inter, Outfit, Press_Start_2P } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

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
  title: 'DevsProject Foro',
  description: 'Plataforma comunitaria para estudiantes universitarios con temática RPG.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${pressStart2P.variable}`}>
      <body>
        <Navbar />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
