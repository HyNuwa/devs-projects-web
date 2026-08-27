'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

export function ScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
