import { BottomBar } from '@/components/layout/BottomBar';
import { MainContent } from '@/components/layout/MainContent';
import { SanctionBanner } from '@/components/layout/SanctionBanner';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

/** Full shell: header, content, footer and, below lg, the bottom bar. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // Below lg, reserve the bottom bar (60px row + 1.5px border) plus the safe area so the last
    // content and the footer are never hidden behind it.
    <div className="flex flex-1 flex-col pb-[calc(62px+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <SanctionBanner />
      <MainContent>{children}</MainContent>
      <SiteFooter />
      <BottomBar />
    </div>
  );
}
