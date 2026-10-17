import { OrderWorkspace } from '@/src/components/order-workspace';

type PageProps = { params: Promise<{ taskId: string }> };

export default async function OrderWorkspacePage({ params }: PageProps) {
  const { taskId } = await params;
  return <OrderWorkspace taskId={taskId} />;
}
