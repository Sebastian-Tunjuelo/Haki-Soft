import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/src/components/navbar';
import { SmoothScrollProvider } from '@/app/providers/smooth-scroll';
import './globals.css';

export const metadata = {
  title: 'TaskStream AI · Protocolo de Pagos en Escrow y Arquitectura 3D',
  description:
    'Marketplace panamericano con verificación criptográfica GNAP de billetera, motor 3D en WebGL vinculado al scroll y custodia financiera al 100%.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <html lang="es">
        <body>
          <SmoothScrollProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main className="app-container" style={{ padding: '32px 20px', flex: 1 }}>
                {children}
              </main>
              <footer className="app-footer">
                <div
                  className="app-container"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                >
                  <div>
                    <strong>TaskStream AI</strong> · Fase 1 (SPEC-02: Identidad Clerk & SPEC-03: Motor 3D Lenis/ScrollTrigger)
                  </div>
                  <div>
                    Open Payments · GNAP Subject Grant · Invariante 96% / 4% · 60–120 FPS WebGL
                  </div>
                </div>
              </footer>
            </div>
          </SmoothScrollProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
