const safeOrigin = 'https://devsproject.local';

/**
 * Accepts only a local path so authentication redirects cannot leave the app.
 */
export function safeReturnPath(candidate: string | null | undefined): string {
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return '/';
  }

  try {
    const resolved = new URL(candidate, safeOrigin);
    if (resolved.origin !== safeOrigin) return '/';

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return '/';
  }
}

export function loginHrefForReturnPath(returnPath: string): string {
  return `/auth/login?redirect=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

export function loginHrefForCurrentLocation(): string {
  if (typeof window === 'undefined') return loginHrefForReturnPath('/');

  return loginHrefForReturnPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}
