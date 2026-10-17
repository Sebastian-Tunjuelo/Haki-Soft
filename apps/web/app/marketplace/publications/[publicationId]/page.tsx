import { StorefrontLoader } from '@/src/features/marketplace/storefront-loader';

export default async function PublicationDetailPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;
  return <StorefrontLoader kind="publication" id={publicationId} />;
}
