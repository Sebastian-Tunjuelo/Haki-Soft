import type { ReactNode } from 'react';

export const metadata = {
  title: 'TaskStream AI',
  description: 'Contratos fundacionales del marketplace TaskStream AI.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'Georgia, serif', margin: 0, background: '#f6f3ee', color: '#1c1917' }}>
        {children}
      </body>
    </html>
  );
}
