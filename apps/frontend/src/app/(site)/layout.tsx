import { BottomBar } from '@/components/layout/BottomBar';
import { MainContent } from '@/components/layout/MainContent';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

/** Full shell: header, content, footer and, below lg, the bottom bar. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // Below lg, reserve the bottom bar's 60px plus the device safe area so the last
    // content and the footer are never hidden behind it.
    <div className="flex flex-1 flex-col pb-[calc(60px+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <MainContent>{children}</MainContent>
      <SiteFooter />
      <BottomBar />
    </div>
  );
}
