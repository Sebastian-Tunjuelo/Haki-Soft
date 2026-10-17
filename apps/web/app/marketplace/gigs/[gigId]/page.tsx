import { StorefrontLoader } from '@/src/features/marketplace/storefront-loader';

export default async function GigDetailPage({ params }: { params: Promise<{ gigId: string }> }) {
  const { gigId } = await params;
  return <StorefrontLoader kind="gig" id={gigId} />;
}
