import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Middleware Clerk v6 para TaskStream AI (SPEC-02 §6.1).
 * Se mantiene mínimo sin createRouteMatcher (en desuso).
 * Cada página y Server Action verifica la sesión dentro de su propio handler con await auth().
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Omitir archivos estáticos e internos de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Ejecutar siempre en rutas de API
    '/(api|trpc)(.*)',
  ],
};
