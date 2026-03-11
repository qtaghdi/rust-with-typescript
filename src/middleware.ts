import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Only redirect root path; let Starlight handle everything else
  if (pathname === '/') {
    // Respect previously chosen language stored in cookie
    const saved = context.cookies.get('lang')?.value;
    if (saved === 'ko') {
      return context.redirect('/ko/', 302);
    }

    // Auto-detect from browser Accept-Language header
    const accept = context.request.headers.get('accept-language') ?? '';
    const prefersKorean = /\bko\b/i.test(accept);
    if (prefersKorean) {
      return context.redirect('/ko/', 302);
    }
  }

  return next();
});
