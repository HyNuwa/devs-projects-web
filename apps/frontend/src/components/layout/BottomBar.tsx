'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/components/ui/shadcn/utils';

import { currentDestination, primaryDestinations, uploadDestination } from './navigation';

// The canvas puts the emphasized Subir button in the middle of the bar.
const [inicio, ...rest] = primaryDestinations;
const items = [inicio, rest[0], uploadDestination, ...rest.slice(1)];

export function BottomBar() {
  const current = currentDestination(usePathname());

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-foreground bg-card pb-[env(safe-area-inset-bottom)] font-sans lg:hidden"
    >
      <ul className="mx-auto flex h-[60px] max-w-xl items-start">
        {items.map(({ href, icon: Icon, id, label }) => {
          const isCurrent = current === id;

          if (id === 'subir') {
            return (
              <li className="flex flex-1 justify-center" key={id}>
                <Link
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label="Subir material"
                  className="-mt-[22px] flex flex-col items-center gap-[3px] rounded-2xl text-[0.6875rem] font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  href={href}
                >
                  <span className="grid size-[52px] place-items-center rounded-2xl border-[1.5px] border-foreground bg-primary text-primary-foreground shadow-pop">
                    <Icon aria-hidden="true" className="size-6" strokeWidth={2.3} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          }

          return (
            <li className="flex flex-1" key={id}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 flex-1 flex-col items-center gap-1 pt-2.5 text-[0.6875rem] outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring',
                  isCurrent ? 'font-extrabold text-primary' : 'font-semibold text-muted-foreground',
                )}
                href={href}
              >
                {isCurrent ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-[3px] w-[26px] -translate-x-1/2 rounded-b-[3px] bg-primary"
                  />
                ) : null}
                <Icon aria-hidden="true" className="size-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
