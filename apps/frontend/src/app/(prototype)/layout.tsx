import { MainContent } from '@/components/layout/MainContent';

/** The Pixel Notebook validation prototype brings its own header; only the <main> landmark. */
export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <MainContent>{children}</MainContent>
    </div>
  );
}
