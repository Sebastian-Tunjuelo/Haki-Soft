import { EscrowCheckout } from '@/src/components/escrow-checkout';

type PageProps = { params: Promise<{ taskId: string }> };

export default async function OrderEscrowPage({ params }: PageProps) {
  const { taskId } = await params;
  return <EscrowCheckout taskId={taskId} />;
}
