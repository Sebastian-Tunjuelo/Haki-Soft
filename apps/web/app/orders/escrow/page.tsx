import Link from 'next/link';

/** Entrada sin orden: redirige al flujo de contratación. */
export default function EscrowEntryPage() {
  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Custodia en escrow</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Primero contrata un Gig o acepta una oferta. Al cerrar el acuerdo te llevamos al checkout de depósito.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/marketplace/negotiations" className="btn btn-primary">
          Contratar o negociar
        </Link>
        <Link href="/marketplace" className="btn btn-secondary">
          Ir al marketplace
        </Link>
      </div>
    </div>
  );
}
