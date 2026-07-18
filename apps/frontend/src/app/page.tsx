import { HeroBanner } from '@/components/home/HeroBanner';
import { ModuleCards } from '@/components/home/ModuleCards';

export default function Home() {
  return (
    <div className="home-page">
      <HeroBanner />
      <ModuleCards />
      {/* Other sections will go here */}
    </div>
  );
}
