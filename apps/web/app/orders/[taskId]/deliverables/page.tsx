import { DeliverablesHarness } from '@/src/components/deliverables-harness';

type PageProps = { params: Promise<{ taskId: string }> };

export default async function OrderDeliverablesPage({ params }: PageProps) {
  const { taskId } = await params;
  return <DeliverablesHarness taskId={taskId} />;
}
