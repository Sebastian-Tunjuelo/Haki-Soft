import type { ReactNode } from 'react';
import Link from 'next/link';
import { Navbar } from '@/src/components/navbar';
import { WorkRequestAlert } from '@/src/components/work-request-alert';
import { SmoothScrollProvider } from '@/app/providers/smooth-scroll';
import './globals.css';

export const metadata = {
  title: 'TaskStream AI · Custodia Open Payments',
  description:
    'Publica, negocia y libera pagos con escrow Open Payments. Identidad local, billetera GNAP y flujo de custodia 96/4.',
};

/** Evita flash de tema incorrecto antes de hidratar. */
const themeBootScript = `
(function(){
  try {
    var k='ts-theme:v1';
    var s=localStorage.getItem(k);
    var m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    var t=(s==='light'||s==='dark')?s:m;
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <SmoothScrollProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <WorkRequestAlert />
            <main className="app-container" style={{ padding: '36px 20px 48px', flex: 1 }}>
              {children}
            </main>
            <footer className="app-footer app-footer--rich">
              <div className="app-container">
                <div className="app-footer__cols">
                  <div>
                    <Link href="/" className="app-footer__brand">
                      TaskStream<span> AI</span>
                    </Link>
                    <p className="ld-muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
                      Marketplace con escrow Open Payments para Buyer y Seller.
                    </p>
                  </div>
                  <div>
                    <h4>Producto</h4>
                    <Link href="/marketplace">Marketplace</Link>
                    <Link href="/#how">Cómo funciona</Link>
                    <Link href="/#pricing">Precios 96/4</Link>
                  </div>
                  <div>
                    <h4>Cuenta</h4>
                    <Link href="/sign-in">Iniciar sesión</Link>
                    <Link href="/onboarding/wallet">Billetera</Link>
                    <Link href="/settings/mode">Modo Buyer/Seller</Link>
                  </div>
                  <div>
                    <h4>Recursos</h4>
                    <Link href="/#faq">FAQ</Link>
                    <Link href="/#reviews">Flujo</Link>
                    <Link href="/activity">Actividad</Link>
                  </div>
                </div>
                <p className="app-footer__copy">
                  © 2026 TaskStream AI · 96% seller · 4% plataforma · GNAP · WebGL
                </p>
              </div>
            </footer>
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
