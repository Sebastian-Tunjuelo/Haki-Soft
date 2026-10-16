import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/src/components/navbar';
import './globals.css';

export const metadata = {
  title: 'TaskStream AI · Identidad y Billetera Multimoneda (SPEC-02)',
  description:
    'Marketplace panamericano con verificación criptográfica GNAP de posesión de billetera sobre Open Payments.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <html lang="es">
        <body>
          <Navbar />
          <main className="app-container" style={{ padding: '32px 20px', flex: 1 }}>
            {children}
          </main>
          <footer className="app-footer">
            <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>TaskStream AI</strong> · Fase 1 (SPEC-02: Identidad Clerk y verificación de billetera)
              </div>
              <div>
                Open Payments · GNAP Subject Grant · Invariante 96% / 4%
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
