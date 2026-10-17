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

/** Hard navigation to login that keeps the current same-origin location as the return path. */
export function redirectToLogin(): void {
  window.location.href = loginHrefForCurrentLocation();
}

/**
 * An account suspended while signed in: close the session and send it to sign-in,
 * where it sees why and can appeal. Uses fetch because the api client imports this
 * module.
 */
export function redirectSuspended() {
  if (typeof window === 'undefined') return;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  void fetch(`${base}/auth/logout`, { method: 'POST', credentials: 'include' })
    .catch(() => undefined)
    .finally(() => window.location.assign('/auth/login?suspendida=1'));
}
