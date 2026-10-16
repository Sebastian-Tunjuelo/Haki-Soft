import { mockTaskOrderCard, splitSingleBlockEscrow } from '@taskstream/shared-schemas';

export default function HomePage() {
  const order = mockTaskOrderCard();
  const split = splitSingleBlockEscrow(order.paymentTerms.totalAmountUSDInCents);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>TaskStream AI · Fase 0</p>
      <h1 style={{ fontWeight: 500, fontSize: 40, marginBottom: 8 }}>Contratos listos para el equipo</h1>
      <p>
        El monorepo ya expone los esquemas compartidos. Una orden de ejemplo por{' '}
        {(order.paymentTerms.totalAmountUSDInCents / 100).toFixed(2)} USD reparte{' '}
        {(split.freelancerPayoutUSDInCents / 100).toFixed(2)} USD al freelancer y{' '}
        {(split.platformFeeUSDInCents / 100).toFixed(2)} USD a la wallet del dueño.
      </p>
      <ul>
        <li>Estado de la orden de muestra: {order.lifecycleStatus}</li>
        <li>Modalidad auditable en el MVP: {order.aiAuditableModality}</li>
        <li>Revisión: {order.paymentTerms.deliveryReviewHours} h · ventana final: {order.paymentTerms.finalClaimWindowMinutes} min</li>
        <li>Correcciones usadas: {order.revisionTerms.revisionsUsed}/{order.revisionTerms.maxRevisionsAllowed}</li>
      </ul>
    </main>
  );
}
