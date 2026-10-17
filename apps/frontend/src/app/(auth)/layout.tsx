import { AccessHeader } from '@/components/layout/AccessHeader';
import { MainContent } from '@/components/layout/MainContent';

/** Access screens: reduced header, no menu, bottom bar or footer. */
export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <AccessHeader />
      <MainContent>{children}</MainContent>
    </div>
  );
}
