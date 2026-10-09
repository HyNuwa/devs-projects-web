import { MainContent } from '@/components/layout/MainContent';
import { SanctionBanner } from '@/components/layout/SanctionBanner';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

/** Focus screens (upload, write a reseña or final): the full header without the bottom bar. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <SanctionBanner />
      <MainContent>{children}</MainContent>
      <SiteFooter />
    </div>
  );
}
