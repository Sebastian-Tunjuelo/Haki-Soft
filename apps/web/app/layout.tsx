import type { ReactNode } from 'react';
import { Navbar } from '@/src/components/navbar';
import { WorkRequestAlert } from '@/src/components/work-request-alert';
import { DeliveryReadyAlert } from '@/src/components/delivery-ready-alert';
import { SellerAcceptanceAlert } from '@/src/components/seller-acceptance-alert';
import { SmoothScrollProvider } from '@/app/providers/smooth-scroll';
import './globals.css';

export const metadata = {
  title: 'TaskStream AI · Protocolo de Pagos en Escrow y Arquitectura 3D',
  description:
    'Marketplace panamericano con verificación criptográfica GNAP de billetera, motor 3D en WebGL vinculado al scroll y custodia financiera al 100%.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
        <body>
          <SmoothScrollProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <WorkRequestAlert />
              <DeliveryReadyAlert />
              <SellerAcceptanceAlert />
              <main className="app-container" style={{ padding: '32px 20px', flex: 1 }}>
                {children}
              </main>
              <footer className="app-footer">
                <div
                  className="app-container"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                >
                  <div>
                    <strong>TaskStream AI</strong> · Marketplace con custodia Open Payments
                  </div>
                  <div>
                    Custodia 100% · Liquidación 96% / 4% · Interledger
                  </div>
                </div>
              </footer>
            </div>
          </SmoothScrollProvider>
        </body>
    </html>
  );
}
