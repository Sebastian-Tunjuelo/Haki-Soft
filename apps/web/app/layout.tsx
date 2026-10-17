import type { ReactNode } from 'react';
import { Navbar } from '@/src/components/navbar';
import { WorkRequestAlert } from '@/src/components/work-request-alert';
import { DeliveryReadyAlert } from '@/src/components/delivery-ready-alert';
import { SellerAcceptanceAlert } from '@/src/components/seller-acceptance-alert';
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
            <DeliveryReadyAlert />
            <SellerAcceptanceAlert />
            <main className="app-container" style={{ padding: '36px 20px 48px', flex: 1 }}>
              {children}
            </main>
            <footer className="app-footer">
              <div
                className="app-container"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <strong>TaskStream AI</strong> · Custodia, revisión IA y liquidación Open Payments
                </div>
                <div>96% seller · 4% plataforma · GNAP · WebGL</div>
              </div>
            </footer>
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
