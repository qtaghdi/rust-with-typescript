/**
 * @file middleware.ts
 *
 * Astro SSR middleware for locale auto-detection.
 *
 * ### Behaviour
 * When a visitor hits the root path (`/`) with no saved preference:
 * 1. Check the `lang` cookie set by Starlight's language switcher.
 * 2. Fall back to the `Accept-Language` request header.
 * 3. Redirect to `/ko/` if Korean is preferred; otherwise serve English (default).
 *
 * All other paths are passed through unchanged — Starlight handles its own
 * locale routing for `/ko/*` and root `/*` pages.
 *
 * ### Cookie
 * Starlight sets a `lang` cookie when the user manually switches language via
 * the built-in language picker. This middleware respects that choice on
 * subsequent visits.
 */

import { defineMiddleware } from 'astro:middleware';

/**
 * @param context - Astro middleware context (request, cookies, url, etc.)
 * @param next - Call to continue to the next middleware or page handler
 */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Only auto-redirect at the root; let Starlight handle all other routes
  if (pathname === '/') {
    // Respect a language preference the user explicitly selected before
    const saved = context.cookies.get('lang')?.value;
    if (saved === 'ko') {
      return context.redirect('/ko/', 302);
    }

    // Auto-detect from the browser's Accept-Language header
    // e.g. "ko-KR,ko;q=0.9,en-US;q=0.8" → redirect to /ko/
    const accept = context.request.headers.get('accept-language') ?? '';
    const prefersKorean = /\bko\b/i.test(accept);
    if (prefersKorean) {
      return context.redirect('/ko/', 302);
    }
  }

  return next();
});
