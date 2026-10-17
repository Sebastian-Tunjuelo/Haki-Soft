import { AdminDisputeDetail } from '@/src/components/admin-dispute-detail';

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  return <AdminDisputeDetail disputeId={disputeId} />;
}
