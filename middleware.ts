import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match internationalized pathnames (including tripSlug routes)
  matcher: ['/', '/(nl|en)/:path*'],
};
