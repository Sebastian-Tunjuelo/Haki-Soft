import type { ReactNode } from 'react';
import Link from 'next/link';
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Navbar } from '@/src/components/navbar';
import { WorkRequestAlert } from '@/src/components/work-request-alert';
import { DeliveryReadyAlert } from '@/src/components/delivery-ready-alert';
import { SellerAcceptanceAlert } from '@/src/components/seller-acceptance-alert';
import { SmoothScrollProvider } from '@/app/providers/smooth-scroll';
import { MeridiaPrismLogo } from '@/src/components/brand/meridia-prism-logo';
import './globals.css';

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

export const metadata = {
  title: 'MERIDIA · Custodia Open Payments 96/4',
  description:
    'MERIDIA — Plataforma Panamericana para Clientes y Freelancers con custodia en bloque único Open Payments (96% Freelancer / 4% Protocolo) e identidad GNAP.',
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
    <html
      lang="es"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <SmoothScrollProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <WorkRequestAlert />
            <DeliveryReadyAlert />
            <SellerAcceptanceAlert />
            <main className="app-container" style={{ padding: '36px 20px 48px', flex: 1 }}>
              {children}
            </main>
            <footer className="app-footer app-footer--rich">
              <div className="app-container">
                <div className="app-footer__cols">
                  <div>
                    <Link href="/" className="app-footer__brand" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <MeridiaPrismLogo size={36} showWordmark />
                    </Link>
                    <p className="ld-muted" style={{ marginTop: 10, fontSize: '0.95rem', lineHeight: 1.6 }}>
                      Marketplace panamericano con custodia en bloque único Open Payments. Una sola cuenta unificada para actuar como Cliente y Freelancer.
                    </p>
                  </div>
                  <div>
                    <h4>Plataforma</h4>
                    <Link href="/marketplace">Marketplace</Link>
                    <Link href="/#how">Cómo funciona MERIDIA</Link>
                    <Link href="/#pricing">Liquidación 96/4</Link>
                  </div>
                  <div>
                    <h4>Cuenta Unificada</h4>
                    <Link href="/onboarding/wallet">Billetera Open Payments</Link>
                    <Link href="/sign-in">Iniciar sesión</Link>
                    <Link href="/sign-up">Crear cuenta</Link>
                  </div>
                  <div>
                    <h4>Ecosistema</h4>
                    <Link href="/#faq">Preguntas frecuentes</Link>
                    <Link href="/#reviews">Flujo de custodia</Link>
                    <Link href="/activity">Actividad en vivo</Link>
                  </div>
                </div>
                <p className="app-footer__copy">
                  © 2026 MERIDIA · 96% Freelancer · 4% Protocolo · GNAP · Open Payments · WebGL
                </p>
              </div>
            </footer>
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
